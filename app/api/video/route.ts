import { NextRequest, NextResponse } from "next/server";
import {
  submitVideoJob,
  getVideoJob,
  fetchVideoContent,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import {
  sanitizePromptForVideo,
  sanitizePromptForGeneration,
} from "@/lib/server/promptSanitizer";
import { getTenant } from "@/lib/tenants/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Video generation route — exposes two operations on the same endpoint:
 *
 *  POST  /api/video         { prompt, ... }            -> submit Sora job
 *  GET   /api/video?id=...                              -> poll status, fetch
 *                                                          finished content
 *
 * This split lets the UI submit-then-poll without holding open a slow request,
 * which matters because Sora jobs can take 30s–3min.
 */

/** Sora-2 applies the same minors-depiction filter as the image model. */
const ADULTS_ONLY_CLAUSE =
  "All people depicted are adults aged 25 or older; do not depict children, teenagers, or minors.";

const STRICT_SAFETY_SUFFIX =
  `no overlay text, no logos, no brand mascots, no political symbolism, no flag-dominant compositions. ${ADULTS_ONLY_CLAUSE}`;

const RELAXED_SAFETY_SUFFIX =
  `no overlay text, no on-screen logos, no political symbolism, no flag-dominant compositions. ${ADULTS_ONLY_CLAUSE}`;

interface VideoSubmitBody {
  prompt: string;
  style?: string;
  moodTags?: string[];
  mascotUsage?: boolean;
  /** Demo / showcase opt-in: allow stylized mascot character in the scene. */
  allowMascot?: boolean;
  seconds?: 4 | 8 | 12;
  aspect?: "16:9" | "9:16" | "1:1";
  /** Native sora-2 audio fields. Sora-2 can render speech + music + SFX. */
  voiceoverScript?: string;
  voiceoverDirection?: string;
  musicAndSfx?: string;
  tenantId?: string;
}

export async function POST(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.video) {
    return NextResponse.json(
      {
        error: "video_disabled",
        message:
          "Sora video deployment is not configured. Set AZURE_OPENAI_VIDEO_DEPLOYMENT.",
      },
      { status: 503 },
    );
  }

  let body: VideoSubmitBody;
  try {
    body = (await req.json()) as VideoSubmitBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tenant = getTenant(body.tenantId);

  if (body.mascotUsage && !body.allowMascot) {
    return NextResponse.json({
      routed: true,
      complianceStatus: "needs_review",
      complianceNote:
        "Mascot usage requested — generation blocked. Routed to approved asset / studio workflow for licensed mascot motion design.",
      ticketId: `AAW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    });
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
  }

  const { width, height } = aspectToDims(body.aspect ?? "16:9");
  const styleHint = body.style ? `Style: ${body.style}. ` : "";
  const moodHint =
    body.moodTags && body.moodTags.length
      ? `Mood: ${body.moodTags.join(", ")}. `
      : "";
  const safetySuffix = body.allowMascot
    ? RELAXED_SAFETY_SUFFIX
    : STRICT_SAFETY_SUFFIX;

  // Sanitize prompt against content-filter triggers (brand names + national
  // symbolism). Belt-and-suspenders on top of the agent-side rules.
  const sanitizedVisual = sanitizePromptForVideo(body.prompt.trim(), tenant.sanitizer);

  // Audio block — Sora-2 renders speech + music + SFX when prompted explicitly.
  // Format the audio direction in the structure Sora-2 responds best to:
  // a dedicated "AUDIO:" section with VOICEOVER (literal script), VOICE,
  // and MUSIC/SFX sub-fields. Sanitize the VO script too so brand names
  // never end up in the spoken track.
  const audioBlock = buildAudioBlock({
    voiceoverScript: body.voiceoverScript
      ? sanitizePromptForGeneration(body.voiceoverScript, tenant.sanitizer)
      : undefined,
    voiceoverDirection: body.voiceoverDirection,
    musicAndSfx: body.musicAndSfx,
  });

  const finalPrompt =
    `VISUAL: ${styleHint}${moodHint}${sanitizedVisual} ${safetySuffix}` +
    (audioBlock ? `\n\n${audioBlock}` : "");

  try {
    const job = await submitVideoJob({
      prompt: finalPrompt,
      width,
      height,
      n_seconds: body.seconds ?? 4,
      n_variants: 1,
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      promptUsed: finalPrompt,
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

export async function GET(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.video) {
    return NextResponse.json({ error: "video_disabled" }, { status: 503 });
  }
  const jobId = req.nextUrl.searchParams.get("id");
  if (!jobId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  try {
    const job = await getVideoJob(jobId);
    const isDone = job.status === "succeeded" || job.status === "completed";
    const isFail = job.status === "failed" || job.status === "cancelled";

    if (isDone) {
      // sora-2 (v1): the job id itself is used to fetch content.
      // legacy: each job has nested generations[0].id.
      const contentId = job.generations?.[0]?.id ?? job.id;
      const b64 = await fetchVideoContent(contentId);
      return NextResponse.json({
        jobId: job.id,
        // Normalize to "succeeded" for the UI's state machine.
        status: "succeeded",
        dataUrl: `data:video/mp4;base64,${b64}`,
      });
    }
    return NextResponse.json({
      jobId: job.id,
      // Normalize sora-2 "in_progress" to "running" so the UI doesn't have
      // to know about both shapes.
      status:
        job.status === "in_progress"
          ? "running"
          : isFail
            ? "failed"
            : job.status,
      failureReason:
        job.failure_reason ??
        (typeof job.error === "string" ? job.error : job.error?.message),
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

function aspectToDims(aspect: "16:9" | "9:16" | "1:1") {
  switch (aspect) {
    case "9:16":
      return { width: 720, height: 1280 };
    case "1:1":
      return { width: 1024, height: 1024 };
    case "16:9":
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Compose the explicit audio direction for Sora-2.
 *
 * Sora-2 supports native audio (speech + music + SFX) but it must be told
 * what to render. Empirically, an "AUDIO:" section with sub-fields produces
 * the most consistent voiceover + score combination.
 *
 * If no voiceover is supplied, this falls back to ambient + music only.
 */
function buildAudioBlock(opts: {
  voiceoverScript?: string;
  voiceoverDirection?: string;
  musicAndSfx?: string;
}): string {
  const parts: string[] = [];
  if (opts.voiceoverScript?.trim()) {
    const voice = opts.voiceoverDirection?.trim() ||
      "Warm, confident broadcast narrator, slightly conversational pacing.";
    parts.push(`VOICEOVER (spoken on-screen): "${opts.voiceoverScript.trim()}"`);
    parts.push(`VOICE: ${voice}`);
  }
  if (opts.musicAndSfx?.trim()) {
    parts.push(`MUSIC & SFX: ${opts.musicAndSfx.trim()}`);
  } else if (parts.length > 0) {
    // Default music if VO is present but no music description supplied.
    parts.push(
      "MUSIC & SFX: Uplifting acoustic-pop instrumental, light percussion building toward the final beat; subtle ambient layer of natural sound matched to the scene.",
    );
  }
  if (parts.length === 0) return "";
  return `AUDIO:\n${parts.join("\n")}`;
}
