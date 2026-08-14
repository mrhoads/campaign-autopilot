import type {
  CampaignBrief,
  CampaignChannel,
  CreativeConcept,
  CreativeStyle,
  CreativeToolStatus,
} from "@/types";
import { getActiveTenant, getActiveTenantId } from "@/lib/tenants/active";
import { generateId } from "@/lib/utils";
import { getClientCapabilities } from "./status";

/**
 * Creative Tool Gateway client.
 *
 * Real path:
 *  - Concept set: parallel POSTs to /api/image (one per direction) using
 *    variant prompts to get visual diversity from a single creative brief.
 *  - Single concept: POST /api/image
 *  - Video concept: POST /api/video to submit a Sora job, then poll via
 *    GET /api/video?id=...
 *
 * Fallback path: returns curated seed concepts so the workspace still has
 * shape when no image deployment is configured.
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ConceptRequest {
  brief: CampaignBrief;
  conceptPrompt: string;
  style: CreativeStyle;
  channels: CampaignChannel[];
  moodTags: string[];
  approvedAssetsOnly: boolean;
  mascotUsage: boolean;
}

export async function getToolStatus(): Promise<CreativeToolStatus> {
  const caps = await getClientCapabilities();
  return {
    ...getActiveTenant().content.creativeToolStatus,
    connectionStatus: caps.image || caps.video ? "connected" : "degraded",
    lastSyncIso: new Date().toISOString(),
  };
}

export async function listSeedConcepts(): Promise<CreativeConcept[]> {
  return getActiveTenant().content.creativeConcepts;
}

interface VariantAngle {
  title: string;
  hue: string;
  angle: string;
}

/**
 * Distinct visual directions used to generate a live concept set. Derived
 * from the active tenant's seed concepts so each brand's generation prompts
 * stay on-brand and compliance-safe.
 */
function getVariantAngles(): VariantAngle[] {
  return getActiveTenant()
    .content.creativeConcepts.slice(0, 3)
    .map((c) => ({ title: c.title, hue: c.thumbnailHue, angle: c.promptUsed }));
}

interface ImageApiResponse {
  routed?: boolean;
  complianceStatus?: "ready" | "needs_review" | "blocked";
  complianceNote?: string;
  ticketId?: string;
  title?: string;
  promptUsed?: string;
  rationale?: string;
  images?: { dataUrl: string; model: string; promptUsed: string }[];
}

export async function generateConcepts(
  request: ConceptRequest,
): Promise<CreativeConcept[]> {
  const caps = await getClientCapabilities();

  // If the marketer flagged mascot usage, never call generation — route to
  // approved-asset workflow.
  if (request.mascotUsage) {
    await latency(400);
    return getVariantAngles().map((v, i) => ({
      id: generateId("vc"),
      title: `${v.title} (routed)`,
      rationale:
        "Mascot reference requested — routed to the approved asset workflow. Licensed mascot rendering will be sourced from the asset management system with a human reviewer in the loop.",
      promptUsed: `${v.angle}. ROUTING NOTE: approved asset workflow only.`,
      style: request.style,
      channels: request.channels.length
        ? request.channels
        : ["Paid Social", "Landing Page"],
      moodTags: request.moodTags.length
        ? request.moodTags
        : ["warm", "community", "trustworthy"],
      complianceStatus: "needs_review",
      complianceNote:
        "Mascot usage requested — generation blocked. This concept has been routed to the approved asset workflow.",
      thumbnailHue: v.hue,
      requiresHumanReview: true,
    }));
  }

  if (!caps.image) {
    // No image gen configured — fall back to seed concepts so the page still
    // looks alive.
    await latency(600);
    return getActiveTenant().content.creativeConcepts;
  }

  // Build three distinct concept prompts off the same brief so each card has
  // a meaningfully different visual direction.
  const requests = getVariantAngles().map((variant) =>
    fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: getActiveTenantId(),
        title: variant.title,
        prompt: combinePrompt(request, variant.angle),
        style: request.style,
        moodTags: request.moodTags,
        mascotUsage: false,
        size: "1536x1024",
        quality: "high",
      }),
    })
      .then((r) => r.json())
      .then((data) => ({ data: data as ImageApiResponse, variant }))
      .catch((e) => ({ error: e as Error, variant })),
  );

  const results = await Promise.all(requests);

  const concepts: CreativeConcept[] = results.map(
    (r): CreativeConcept => {
      if ("error" in r || !("data" in r)) {
        return seedCreativeConceptForVariant(r.variant, request);
      }
      const { data, variant } = r;
      if (!data.images || data.images.length === 0) {
        return seedCreativeConceptForVariant(variant, request);
      }
      return {
        id: generateId("vc"),
        title: data.title ?? variant.title,
        rationale:
          data.rationale ||
          "Generated concept calibrated to the brief's tone and audience. Confirm prop styling and ensure no political symbolism before production.",
        promptUsed: data.promptUsed ?? variant.angle,
        style: request.style,
        channels: request.channels.length
          ? request.channels
          : ["Paid Social", "Landing Page"],
        moodTags: request.moodTags.length
          ? request.moodTags
          : ["warm", "community", "trustworthy"],
        complianceStatus: data.complianceStatus ?? "needs_review",
        complianceNote: data.complianceNote,
        thumbnailHue: variant.hue,
        requiresHumanReview: true,
        imageDataUrl: data.images[0].dataUrl,
      };
    },
  );

  return concepts;
}

function seedCreativeConceptForVariant(
  variant: VariantAngle,
  request: ConceptRequest,
): CreativeConcept {
  return {
    id: generateId("vc"),
    title: variant.title,
    rationale:
      "Generation unavailable — showing curated reference direction. Connect the image deployment to render a live concept.",
    promptUsed: variant.angle,
    style: request.style,
    channels: request.channels.length
      ? request.channels
      : ["Paid Social", "Landing Page"],
    moodTags: request.moodTags.length ? request.moodTags : ["warm", "community"],
    complianceStatus: "needs_review",
    thumbnailHue: variant.hue,
    requiresHumanReview: true,
  };
}

function combinePrompt(req: ConceptRequest, angle: string): string {
  const base = req.conceptPrompt?.trim();
  return [base, angle].filter(Boolean).join(". ");
}

// ---------------------------------------------------------------------------
// Video generation — Sora submit + poll
// ---------------------------------------------------------------------------

export interface VideoSubmitResult {
  jobId: string;
  status: string;
  promptUsed: string;
}

export interface VideoPollResult {
  jobId: string;
  status:
    | "queued"
    | "preprocessing"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";
  dataUrl?: string;
  failureReason?: string;
}

export async function submitVideoConcept(opts: {
  brief: CampaignBrief;
  prompt: string;
  style?: CreativeStyle;
  moodTags?: string[];
  mascotUsage?: boolean;
  seconds?: 4 | 8 | 12;
  aspect?: "16:9" | "9:16" | "1:1";
}): Promise<VideoSubmitResult | { routed: true; ticketId: string; complianceNote: string }> {
  if (opts.mascotUsage) {
    return {
      routed: true,
      ticketId: `AAW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      complianceNote:
        "Mascot reference requested — video generation blocked. Routed to approved asset workflow.",
    };
  }

  const res = await fetch("/api/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId: getActiveTenantId(),
      prompt: opts.prompt,
      style: opts.style,
      moodTags: opts.moodTags,
      seconds: opts.seconds,
      aspect: opts.aspect,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new VideoUnavailableError(
      detail?.message ?? "Video generation unavailable.",
      res.status,
    );
  }

  return (await res.json()) as VideoSubmitResult;
}

export async function pollVideo(jobId: string): Promise<VideoPollResult> {
  const res = await fetch(`/api/video?id=${encodeURIComponent(jobId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new VideoUnavailableError(
      `Video polling failed (HTTP ${res.status}).`,
      res.status,
    );
  }
  return (await res.json()) as VideoPollResult;
}

export class VideoUnavailableError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "VideoUnavailableError";
  }
}

/** Thrown when a single-concept regeneration fails (surfaces 429s to the UI). */
export class ConceptGenerationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ConceptGenerationError";
  }
}

/**
 * Ask the creative-director agent for 1-3 short, on-brand ways to adjust a
 * concept before regenerating it. Best-effort — always resolves with at least
 * a curated fallback so the regenerate UI is never empty.
 */
export async function getRegenerationSuggestions(opts: {
  kind: "image" | "video";
  brief: CampaignBrief;
  basePrompt: string;
  title?: string;
}): Promise<string[]> {
  const fallback =
    opts.kind === "video"
      ? [
          "Open on a close-up, then pull back",
          "Slow the pacing for a warmer tone",
          "Add a golden-hour color grade",
        ]
      : [
          "Warmer golden-hour palette, softer light",
          "Tighter crop on a single subject",
          "Shift to an evening community setting",
        ];
  try {
    const res = await fetch("/api/creative-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: getActiveTenantId(),
        kind: opts.kind,
        title: opts.title,
        basePrompt: opts.basePrompt,
        brief: {
          title: opts.brief.title,
          objective: opts.brief.objective,
          audiences: opts.brief.audiences,
          keyMessages: opts.brief.keyMessages,
        },
      }),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { suggestions?: string[] };
    const list = (data.suggestions ?? []).filter(Boolean).slice(0, 3);
    return list.length ? list : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Regenerate a SINGLE concept in place, keeping its identity (id, title, hue,
 * channels) so the caller can swap it into the existing set without disturbing
 * the others. An optional `suggestion` is appended to the original prompt.
 *
 * Throws ConceptGenerationError on failure (including 429 rate limits) so the
 * UI can keep the previous image and offer a retry.
 */
export async function regenerateConcept(opts: {
  brief: CampaignBrief;
  baseConcept: CreativeConcept;
  suggestion?: string;
  style: CreativeStyle;
  moodTags: string[];
  mascotUsage: boolean;
}): Promise<CreativeConcept> {
  const { baseConcept } = opts;

  // Mascot path → never generate; route to the approved asset workflow.
  if (opts.mascotUsage) {
    await latency(300);
    return {
      ...baseConcept,
      rationale:
        "Mascot reference requested — routed to the approved asset workflow. Licensed rendering will be sourced from the asset management system with a human reviewer in the loop.",
      complianceStatus: "needs_review",
      complianceNote:
        "Mascot usage requested — generation blocked. Routed to the approved asset workflow.",
      requiresHumanReview: true,
    };
  }

  const caps = await getClientCapabilities();
  if (!caps.image) {
    throw new ConceptGenerationError(
      "Image generation is not configured — connect an image deployment to regenerate.",
      503,
    );
  }

  const basePrompt = baseConcept.promptUsed?.trim() || baseConcept.title;
  const prompt = opts.suggestion?.trim()
    ? `${basePrompt}. Adjustment for this revision: ${opts.suggestion.trim()}`
    : basePrompt;

  let res: Response;
  try {
    res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: getActiveTenantId(),
        title: baseConcept.title,
        prompt,
        style: opts.style,
        moodTags: opts.moodTags,
        mascotUsage: false,
        size: "1536x1024",
        quality: "high",
      }),
    });
  } catch (e) {
    throw new ConceptGenerationError(
      (e as Error).message || "Network error contacting the image service.",
      0,
    );
  }

  let data: ImageApiResponse & { message?: string };
  try {
    data = (await res.json()) as ImageApiResponse & { message?: string };
  } catch {
    throw new ConceptGenerationError(
      `Unexpected response from the image service (HTTP ${res.status}).`,
      res.status,
    );
  }

  if (!res.ok) {
    const msg =
      res.status === 429
        ? "Rate limited (429). Wait a moment, then try again."
        : data?.message || `Image generation failed (HTTP ${res.status}).`;
    throw new ConceptGenerationError(msg, res.status);
  }

  if (!data.images || data.images.length === 0) {
    throw new ConceptGenerationError("No image was returned. Try again.", 502);
  }

  return {
    ...baseConcept,
    promptUsed: data.promptUsed ?? prompt,
    rationale: data.rationale || baseConcept.rationale,
    complianceStatus: data.complianceStatus ?? "needs_review",
    complianceNote: data.complianceNote ?? baseConcept.complianceNote,
    requiresHumanReview: true,
    imageDataUrl: data.images[0].dataUrl,
  };
}

export async function requestApprovedAsset(conceptId: string): Promise<{
  routedTo: string;
  ticketId: string;
}> {
  await latency(400);
  return {
    routedTo: "Approved Asset Workflow • Studio Concept Gateway",
    ticketId: `AAW-${conceptId.toUpperCase().slice(-6)}`,
  };
}
