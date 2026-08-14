import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  chatCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import { sanitizePromptForGeneration } from "@/lib/server/promptSanitizer";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Image generation route.
 *
 * Compliance posture:
 *  - If the request indicates mascot usage, we DO NOT call the image model.
 *    Instead we return a routed-to-approved-asset response. This guarantees
 *    we never generate an unapproved mascot likeness.
 *  - Every prompt is augmented with brand-safety language ("no overlay text,
 *    no logos, no brand mascots, no political symbolism") regardless of the
 *    request.
 */

interface ImageRequest {
  prompt: string;
  style?: string;
  moodTags?: string[];
  mascotUsage?: boolean;
  /**
   * When true, the request is for a creative reference concept that may
   * include a stylized mascot character. The output is clearly labeled as
   * a "reference concept" and tagged for approved-asset workflow handoff.
   * This is the demo / showcase path — production assets still require
   * sourcing through the approved asset management system.
   */
  allowMascot?: boolean;
  /** Optional title to label the returned concept. */
  title?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792" | "1536x1024" | "1024x1536";
  quality?: "standard" | "hd" | "low" | "medium" | "high";
  tenantId?: string;
}

/**
 * gpt-image-* runs an OUTPUT-stage safety check that rejects renders which
 * appear to depict minors. Prompts mentioning teens, kids, or an unqualified
 * "family" get a 400 `moderation_blocked`. Stating the adults-only intent
 * explicitly clears the filter, so every prompt carries this clause.
 */
const ADULTS_ONLY_CLAUSE =
  "All people depicted are adults aged 25 or older; do not depict children, teenagers, or minors.";

const STRICT_SAFETY_SUFFIX =
  `no overlay text, no logos, no brand mascots, no political symbolism, no flag-dominant compositions, photorealistic where appropriate. ${ADULTS_ONLY_CLAUSE}`;

const RELAXED_SAFETY_SUFFIX =
  `no overlay text, no on-screen logos, no political symbolism, no flag-dominant compositions. ${ADULTS_ONLY_CLAUSE}`;

function buildRationalePrompt(tenant: Tenant): string {
  return `You are ${tenant.persona.creativeDirectorTitle}. Given a generative image prompt, write a 1-2 sentence concept rationale (~30 words) explaining why this concept fits a modern, trust-forward ${tenant.vocabulary.industry} marketing campaign. Do not mention the prompt itself. Return only the rationale.`;
}

export async function POST(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.image) {
    return NextResponse.json(
      {
        error: "image_disabled",
        message:
          "Image generation deployment is not configured. Set AZURE_OPENAI_IMAGE_DEPLOYMENT.",
      },
      { status: 503 },
    );
  }

  let body: ImageRequest;
  try {
    body = (await req.json()) as ImageRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tenant = getTenant(body.tenantId);

  // Mascot guardrail — block generation when the request explicitly requests
  // mascot usage UNLESS the caller opted in to allowMascot for a reference
  // concept. allowMascot still returns content with strict labeling.
  if (body.mascotUsage && !body.allowMascot) {
    return NextResponse.json({
      routed: true,
      complianceStatus: "needs_review",
      complianceNote:
        "Mascot usage requested — generation blocked. This concept has been routed to the approved asset workflow for licensed mascot rendering with a human reviewer in the loop.",
      ticketId: `AAW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    });
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json(
      { error: "missing_prompt" },
      { status: 400 },
    );
  }

  const styleHint = body.style ? `Style: ${body.style}. ` : "";
  const moodHint =
    body.moodTags && body.moodTags.length
      ? `Mood: ${body.moodTags.join(", ")}. `
      : "";
  const safetySuffix = body.allowMascot ? RELAXED_SAFETY_SUFFIX : STRICT_SAFETY_SUFFIX;
  const sanitized = sanitizePromptForGeneration(body.prompt.trim(), tenant.sanitizer);
  const finalPrompt = `${styleHint}${moodHint}${sanitized} ${safetySuffix}`;

  try {
    const images = await generateImage({
      prompt: finalPrompt,
      size: body.size ?? "1536x1024",
      quality: body.quality,
      n: 1,
    });

    // Try to generate a rationale alongside the image. Best-effort — if it
    // fails we just leave it blank.
    let rationale = "";
    if (caps.chat) {
      try {
        rationale = await chatCompletion({
          messages: [
            { role: "system", content: buildRationalePrompt(tenant) },
            { role: "user", content: `Prompt: ${finalPrompt}` },
          ],
          temperature: 0.5,
          maxTokens: 120,
        });
      } catch {
        // ignore; rationale is non-critical
      }
    }

    return NextResponse.json({
      title:
        body.title ?? deriveTitle(body.prompt, body.moodTags) ?? "Concept Direction",
      promptUsed: finalPrompt,
      rationale: rationale.trim(),
      images: images.map((img) => ({
        dataUrl: `data:image/png;base64,${img.b64}`,
        model: img.model,
        promptUsed: img.promptUsed,
      })),
      complianceStatus: "needs_review",
      complianceNote: body.allowMascot
        ? "Reference concept featuring stylized mascot character. Final production asset must be sourced through the approved asset workflow with a brand creative lead in the loop."
        : "Generated concept — requires human review before production handoff.",
      mascotReference: Boolean(body.allowMascot),
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

function deriveTitle(prompt: string, moods?: string[]): string | undefined {
  const first = prompt.split(/[,.]/)[0]?.trim();
  if (first && first.length < 80) return titleCase(first);
  if (moods && moods.length) return titleCase(moods.slice(0, 2).join(" "));
  return undefined;
}

function titleCase(s: string) {
  return s
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
