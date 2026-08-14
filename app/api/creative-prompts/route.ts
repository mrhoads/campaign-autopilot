import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief } from "@/types";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Creative Director Agent.
 *
 * Reads a campaign brief and produces production-ready prompts for both
 * image (gpt-image-2) and video (sora-2) models. This is the "agents writing
 * prompts for other agents" moment in the auto-pilot pipeline.
 */

function buildSystemPrompt(tenant: Tenant): string {
  const mascotRules = tenant.mascot
    ? `If "allowMascot" is true, you MAY include a generic stylized ${tenant.mascot.description} in the IMAGE PROMPTS ONLY — describe it as a charming, expressive, anthropomorphic cartoon character. Do NOT use the brand name. The VIDEO PROMPT must remain people-and-environment only (this is a technical constraint of the video model — the character is composited in post).\n\nIf "allowMascot" is false, do NOT include any character mascot anywhere. Focus on people, environment, and product cues.`
    : `Do NOT include any brand mascot, cartoon character, animated character, logo, or insignia anywhere in the image or video prompts. Focus on real people, environment, and product cues only.`;

  return `You are ${tenant.persona.creativeDirectorTitle}. Your job is to translate a campaign brief into precise, production-ready generation prompts for two different AI models:

1. THREE still-image prompts for gpt-image-2 (each ~80-120 words):
   - Each image should explore a distinct creative direction
   - Be specific about composition, lighting, palette, talent, wardrobe, props
   - Optimize for storytelling that aligns with the brief's audience + tone

2. ONE motion prompt for sora-2 (~80-120 words for VISUAL only):
   - Describe a 12-second sequence in shot-by-shot terms
   - Include camera movement language (push-in, dolly, aerial pan, etc.)
   - Specify lighting (golden hour, soft daylight, etc.) and pacing
   - IMPORTANT: the video prompt must focus on REAL PEOPLE and ENVIRONMENT only. Do NOT include any animated mascot, cartoon character, or anthropomorphic character in the video prompt — even if allowMascot is true.
   - Do NOT mix audio cues into the visual prompt. Audio goes in a separate field (see #3).

3. AUDIO BLOCK for sora-2 — three required fields. Sora-2 supports native audio: a voiceover, music, and SFX. Be concrete and specific; vague audio direction produces silent or generic ambient output.
   - "voiceoverScript": the EXACT spoken script. 2-3 short sentences, ~25-35 words total, that map to the 12-second duration. Use natural broadcast cadence. End with a clear, on-brand sign-off line (but never include the brand name "${tenant.name}"). The first sentence should be a hook, the last should be a call to action.
   - "voiceoverDirection": one short sentence describing the voice (e.g., "Warm, confident narrator, broadcast quality, slightly conversational pacing.").
   - "musicAndSfx": one short sentence describing the background score and any SFX.

CRITICAL CONTENT-FILTER RULES — prompts go through strict safety filters:
- NEVER use the brand name "${tenant.name}" in any prompt.
- Depict ADULTS ONLY. Never describe children, kids, teenagers, students, babies, or minors in any prompt. Where a brief implies a younger audience, describe adults in their twenties (e.g. "a new driver in their twenties", "a young adult") and say "a family of adults" rather than "a family". Renders that appear to show minors are rejected by the model's safety system.
- AVOID national symbolism and sensitive iconography: do NOT mention national flags, Memorial Day directly, patriotic colors prominently, political imagery, military, veterans, uniforms, or service insignia. Reframe holiday energy as "long weekend", "early summer road trip", "family gathering", "community picnic", "open-road getaway".
- Keep the tone warm, optimistic, and family-friendly.

${mascotRules}

Other rules:
- No overlay text, no on-screen logos (those are added in post)
- Trust-forward tone always
- Pair seasonal motifs with community/family motifs

Return JSON matching the supplied schema.`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "imagePrompts",
    "videoPrompt",
    "videoTitle",
    "videoDurationSec",
    "videoAspect",
    "voiceoverScript",
    "voiceoverDirection",
    "musicAndSfx",
    "rationale",
  ],
  properties: {
    imagePrompts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "prompt", "moodTags"],
        properties: {
          title: { type: "string" },
          prompt: { type: "string" },
          moodTags: { type: "array", items: { type: "string" } },
        },
      },
    },
    videoPrompt: { type: "string" },
    videoTitle: { type: "string" },
    videoDurationSec: { type: "integer", enum: [4, 8, 12] },
    videoAspect: { type: "string", enum: ["16:9", "9:16", "1:1"] },
    voiceoverScript: { type: "string" },
    voiceoverDirection: { type: "string" },
    musicAndSfx: { type: "string" },
    rationale: { type: "string" },
  },
};

interface ImagePromptSpec {
  title: string;
  prompt: string;
  moodTags: string[];
}

interface RawResult {
  imagePrompts: ImagePromptSpec[];
  videoPrompt: string;
  videoTitle: string;
  videoDurationSec: 4 | 8 | 12;
  videoAspect: "16:9" | "9:16" | "1:1";
  voiceoverScript: string;
  voiceoverDirection: string;
  musicAndSfx: string;
  rationale: string;
}

export async function POST(req: NextRequest) {
  if (!getCapabilities().chat) {
    return NextResponse.json({ error: "chat_disabled" }, { status: 503 });
  }

  let brief: CampaignBrief;
  let allowMascot: boolean;
  let tenant: Tenant = getTenant(undefined);
  try {
    const body = (await req.json()) as {
      brief: CampaignBrief;
      allowMascot?: boolean;
      tenantId?: string;
    };
    brief = body.brief;
    allowMascot = Boolean(body.allowMascot);
    tenant = getTenant(body.tenantId);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const briefContext = JSON.stringify(
    {
      title: brief.title,
      objective: brief.objective,
      productLine: brief.productLine,
      audiences: brief.audiences,
      keyMessages: brief.keyMessages,
      creativeNotes: brief.creativeNotes,
    },
    null,
    2,
  );

  try {
    const raw = await structuredCompletion<RawResult>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant) },
        {
          role: "user",
          content: `BRIEF (JSON):\n${briefContext}\n\nallowMascot: ${allowMascot}\n\nDraft the prompts now. Make the video sequence cinematic and emotionally resonant — it's going to a CMO.`,
        },
      ],
      temperature: 0.85,
      maxTokens: 2000,
      jsonSchema: { name: "creative_prompts", schema: SCHEMA },
    });

    // Defensive — if model produced an unexpected shape, normalize.
    const rawAny = raw as unknown as Partial<RawResult> | null;
    if (!rawAny || !Array.isArray(rawAny.imagePrompts)) {
      return NextResponse.json(
        {
          error: "bad_response",
          message: "Creative agent returned an unexpected shape.",
          detail: rawAny,
        },
        { status: 502 },
      );
    }

    const trimmed: ImagePromptSpec[] = rawAny.imagePrompts.slice(0, 3) as ImagePromptSpec[];
    while (trimmed.length < 3) {
      trimmed.push({
        title: `Direction ${trimmed.length + 1}`,
        prompt: trimmed[0]?.prompt ?? "Editorial concept aligned with the campaign brief.",
        moodTags: ["warm", "community"],
      });
    }

    return NextResponse.json({
      imagePrompts: trimmed,
      videoPrompt: raw.videoPrompt,
      videoTitle: raw.videoTitle,
      videoDurationSec: raw.videoDurationSec,
      videoAspect: raw.videoAspect,
      voiceoverScript: raw.voiceoverScript,
      voiceoverDirection: raw.voiceoverDirection,
      musicAndSfx: raw.musicAndSfx,
      rationale: raw.rationale,
      allowMascot,
    });
  } catch (e) {
    if (e instanceof AzureOpenAIError) {
      return NextResponse.json(
        { error: "azure_error", message: e.message, detail: e.detail },
        { status: e.status },
      );
    }
    return NextResponse.json(
      { error: "internal_error", message: (e as Error).message },
      { status: 500 },
    );
  }
}
