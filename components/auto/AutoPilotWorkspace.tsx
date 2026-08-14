"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  PenTool,
  Wand2,
  Image as ImageIcon,
  Film,
  PackageCheck,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Rocket,
  Megaphone,
  Pause,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { RegeneratePanel } from "@/components/creative/RegeneratePanel";
import { creativeToolGateway } from "@/lib/services";
import { cn } from "@/lib/utils";
import type {
  CampaignBrief,
  CampaignChannel,
  ContentVariant,
  ValidationResult,
} from "@/types";
import { useTenant } from "@/lib/tenants/context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepId =
  | "plan"
  | "validate"
  | "content"
  | "creative_prompts"
  | "images"
  | "video"
  | "package";

type StepStatus = "pending" | "running" | "done" | "error" | "paused";

interface StepState {
  status: StepStatus;
  startedAt?: number;
  endedAt?: number;
  error?: string;
}

interface ImagePromptSpec {
  title: string;
  prompt: string;
  moodTags: string[];
}

interface CreativePromptsResult {
  imagePrompts: ImagePromptSpec[];
  videoPrompt: string;
  videoTitle: string;
  videoDurationSec: 4 | 8 | 12;
  videoAspect: "16:9" | "9:16" | "1:1";
  voiceoverScript?: string;
  voiceoverDirection?: string;
  musicAndSfx?: string;
  rationale: string;
  allowMascot: boolean;
}

interface GeneratedImage {
  title: string;
  /** Original creative-director prompt — kept so regenerate can build on it. */
  basePrompt: string;
  moodTags?: string[];
  promptUsed: string;
  rationale?: string;
  dataUrl?: string;
  loading: boolean;
  error?: string;
  /** Re-rolling in place — keep the previous image visible under an overlay. */
  regenerating?: boolean;
}

interface VideoOutput {
  jobId?: string;
  status:
    | "idle"
    | "submitting"
    | "queued"
    | "preprocessing"
    | "running"
    | "succeeded"
    | "failed";
  dataUrl?: string;
  error?: string;
  /** Re-rolling in place — keep the previous video visible under an overlay. */
  regenerating?: boolean;
}

// ---------------------------------------------------------------------------
// Default prompt
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function AutoPilotWorkspace() {
  const { tenant } = useTenant();
  const [prompt, setPrompt] = React.useState(tenant.prompts.autopilotDefault);
  const [allowMascot, setAllowMascot] = React.useState(Boolean(tenant.mascot));
  const [hitlMode, setHitlMode] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const [steps, setSteps] = React.useState<Record<StepId, StepState>>({
    plan: { status: "pending" },
    validate: { status: "pending" },
    content: { status: "pending" },
    creative_prompts: { status: "pending" },
    images: { status: "pending" },
    video: { status: "pending" },
    package: { status: "pending" },
  });

  const [brief, setBrief] = React.useState<CampaignBrief | null>(null);
  const [validation, setValidation] = React.useState<ValidationResult | null>(
    null,
  );
  const [variants, setVariants] = React.useState<ContentVariant[]>([]);
  const [creativePrompts, setCreativePrompts] =
    React.useState<CreativePromptsResult | null>(null);
  const [images, setImages] = React.useState<GeneratedImage[]>([]);
  const [video, setVideo] = React.useState<VideoOutput>({ status: "idle" });

  /**
   * Which step's output is currently displayed in the right pane.
   * Auto-follows the running step but the user can pin a different one by
   * clicking on a step row.
   */
  const [focusedStep, setFocusedStep] = React.useState<StepId>("plan");
  const [autoFollow, setAutoFollow] = React.useState(true);

  const pollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseRef = React.useRef<{
    resolve: () => void;
    reject: () => void;
  } | null>(null);

  React.useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const updateStep = (id: StepId, patch: Partial<StepState>) => {
    setSteps((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    // Auto-follow: when a step starts running (or is paused for approval),
    // move focus there so the right pane mirrors the pipeline.
    if (
      autoFollow &&
      (patch.status === "running" || patch.status === "paused")
    ) {
      setFocusedStep(id);
    }
  };

  const onStepClick = (id: StepId) => {
    // Manual click pins focus; turn off autoFollow until the user resets.
    setAutoFollow(false);
    setFocusedStep(id);
  };

  const resumeAutoFollow = () => {
    setAutoFollow(true);
    // Snap to current running/paused step if any.
    const active = (Object.keys(steps) as StepId[]).find(
      (k) => steps[k].status === "running" || steps[k].status === "paused",
    );
    if (active) setFocusedStep(active);
  };

  /** When HITL is on, waits for the user to click "Approve & continue". */
  const waitForApproval = (id: StepId): Promise<void> => {
    if (!hitlMode) return Promise.resolve();
    updateStep(id, { status: "paused" });
    return new Promise((resolve, reject) => {
      pauseRef.current = { resolve, reject };
    });
  };

  const releasePause = () => {
    if (pauseRef.current) {
      pauseRef.current.resolve();
      pauseRef.current = null;
    }
  };

  const reset = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (pauseRef.current) {
      pauseRef.current.reject();
      pauseRef.current = null;
    }
    setRunning(false);
    setBrief(null);
    setValidation(null);
    setVariants([]);
    setCreativePrompts(null);
    setImages([]);
    setVideo({ status: "idle" });
    setFocusedStep("plan");
    setAutoFollow(true);
    setSteps({
      plan: { status: "pending" },
      validate: { status: "pending" },
      content: { status: "pending" },
      creative_prompts: { status: "pending" },
      images: { status: "pending" },
      video: { status: "pending" },
      package: { status: "pending" },
    });
  };

  const run = async () => {
    reset();
    setRunning(true);

    try {
      // ============ STEP 1: PLAN ============
      updateStep("plan", { status: "running", startedAt: Date.now() });
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, prompt }),
      });
      if (!planRes.ok) throw new Error("Brief planning failed.");
      const newBrief = (await planRes.json()) as CampaignBrief;
      setBrief(newBrief);
      updateStep("plan", { status: "done", endedAt: Date.now() });
      await waitForApproval("plan");
      updateStep("plan", { status: "done" });

      // ============ STEP 2: VALIDATE ============
      updateStep("validate", { status: "running", startedAt: Date.now() });
      const vRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, brief: newBrief }),
      });
      if (!vRes.ok) throw new Error("Validation failed.");
      const vr = (await vRes.json()) as ValidationResult;
      setValidation(vr);
      updateStep("validate", { status: "done", endedAt: Date.now() });
      await waitForApproval("validate");
      updateStep("validate", { status: "done" });

      // ============ STEP 3: CONTENT (parallel across channels) ============
      updateStep("content", { status: "running", startedAt: Date.now() });
      const channelsToGenerate = (
        newBrief.channels.length
          ? newBrief.channels
          : (["Email", "Paid Social", "Landing Page", "SMS"] as CampaignChannel[])
      ).slice(0, 4);
      const contentResults = await Promise.all(
        channelsToGenerate.map((channel) =>
          fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: tenant.id, brief: newBrief, channel }),
          }).then(async (r) => {
            if (!r.ok) throw new Error(`Content gen failed for ${channel}.`);
            return (await r.json()) as ContentVariant;
          }),
        ),
      );
      setVariants(contentResults);
      updateStep("content", { status: "done", endedAt: Date.now() });
      await waitForApproval("content");
      updateStep("content", { status: "done" });

      // ============ STEP 4: CREATIVE PROMPTS ============
      updateStep("creative_prompts", {
        status: "running",
        startedAt: Date.now(),
      });
      const cpRes = await fetch("/api/creative-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, brief: newBrief, allowMascot }),
      });
      if (!cpRes.ok) throw new Error("Creative prompt generation failed.");
      const cp = (await cpRes.json()) as CreativePromptsResult;
      setCreativePrompts(cp);
      updateStep("creative_prompts", { status: "done", endedAt: Date.now() });
      await waitForApproval("creative_prompts");
      updateStep("creative_prompts", { status: "done" });

      // ===== STEPS 5 & 6: IMAGES + VIDEO (run concurrently) =====
      // The video (sora-2) is the slowest asset, so we submit it immediately
      // and let it render in the background while the images generate in
      // parallel. Total wall-clock time becomes ~max(images, video) instead of
      // images + video — a big win for the live demo.

      // Mark both steps running (images last so the pane auto-focuses there).
      updateStep("video", { status: "running", startedAt: Date.now() });
      updateStep("images", { status: "running", startedAt: Date.now() });

      // Kick off the video job now. Self-contained: it manages its own step +
      // output state and never rejects, so an image-side issue can't abort it
      // and a video failure can't abort the pipeline.
      const videoPromise = (async () => {
        try {
          setVideo({ status: "submitting" });
          const vidRes = await fetch("/api/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: tenant.id,
              prompt: cp.videoPrompt,
              seconds: cp.videoDurationSec,
              aspect: cp.videoAspect,
              allowMascot,
              voiceoverScript: cp.voiceoverScript,
              voiceoverDirection: cp.voiceoverDirection,
              musicAndSfx: cp.musicAndSfx,
            }),
          });
          if (!vidRes.ok) throw new Error("Video submit failed.");
          const sub = await vidRes.json();
          const jobId = sub.jobId as string;
          setVideo({ status: "queued", jobId });
          const finalVideo = await pollUntilDone(jobId, (status) =>
            setVideo({ status, jobId }),
          );
          setVideo({ status: "succeeded", jobId, dataUrl: finalVideo });
          updateStep("video", { status: "done", endedAt: Date.now() });
        } catch (e) {
          setVideo({
            status: "failed",
            error: (e as Error).message || "Video generation failed.",
          });
          updateStep("video", {
            status: "error",
            endedAt: Date.now(),
            error: (e as Error).message || "Video generation failed.",
          });
        }
      })();

      // Generate the still concepts in parallel.
      setImages(
        cp.imagePrompts.map((p) => ({
          title: p.title,
          basePrompt: p.prompt,
          moodTags: p.moodTags,
          promptUsed: p.prompt,
          loading: true,
        })),
      );

      await Promise.all(
        cp.imagePrompts.map(async (p, i) => {
          try {
            const r = await fetch("/api/image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tenantId: tenant.id,
                title: p.title,
                prompt: p.prompt,
                moodTags: p.moodTags,
                style: "Editorial",
                size: "1024x1024",
                quality: "medium",
                allowMascot,
              }),
            });
            const data = await r.json();
            if (!r.ok || !data?.images?.[0]?.dataUrl) {
              throw new Error(
                r.status === 429
                  ? "Rate limited (429). Use Regenerate to retry this image."
                  : data?.message ?? "Image gen failed",
              );
            }
            setImages((prev) => {
              const next = [...prev];
              next[i] = {
                ...next[i],
                title: data.title ?? p.title,
                promptUsed: data.promptUsed ?? p.prompt,
                rationale: data.rationale,
                dataUrl: data.images[0].dataUrl,
                loading: false,
              };
              return next;
            });
          } catch (e) {
            setImages((prev) => {
              const next = [...prev];
              next[i] = {
                ...next[i],
                loading: false,
                error: (e as Error).message,
              };
              return next;
            });
          }
        }),
      );
      updateStep("images", { status: "done", endedAt: Date.now() });
      await waitForApproval("images");
      updateStep("images", { status: "done" });

      // Wait for the video to finish (it has been rendering in the background
      // this whole time — often already done by now).
      await videoPromise;

      // ============ STEP 7: PACKAGE ============
      updateStep("package", { status: "running", startedAt: Date.now() });
      // No backend call — this just signifies bundling on the UI side.
      await new Promise((r) => setTimeout(r, 600));
      updateStep("package", { status: "done", endedAt: Date.now() });
    } catch (e) {
      const message = (e as Error).message || "Pipeline failed.";
      setSteps((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next) as StepId[]) {
          if (next[k].status === "running") {
            next[k] = { ...next[k], status: "error", error: message };
          }
        }
        return next;
      });
    } finally {
      setRunning(false);
    }
  };

  const pollUntilDone = (
    jobId: string,
    onStatus: (s: VideoOutput["status"]) => void,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const r = await fetch(`/api/video?id=${encodeURIComponent(jobId)}`, {
            cache: "no-store",
          });
          if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            throw new Error(d?.message ?? `Poll HTTP ${r.status}`);
          }
          const data = await r.json();
          if (data.status === "succeeded" && data.dataUrl) {
            resolve(data.dataUrl);
            return;
          }
          if (data.status === "failed") {
            reject(new Error(data.failureReason ?? "Video job failed."));
            return;
          }
          onStatus(data.status as VideoOutput["status"]);
          pollRef.current = setTimeout(tick, 5000);
        } catch (e) {
          reject(e);
        }
      };
      pollRef.current = setTimeout(tick, 3000);
    });
  };

  /** Regenerate a single concept image in place, keeping the other two. */
  const regenerateAutoImage = async (i: number, suggestion: string) => {
    const img = images[i];
    if (!img) return;
    const base = img.basePrompt || img.promptUsed || img.title;
    const prompt = suggestion.trim()
      ? `${base}. Adjustment for this revision: ${suggestion.trim()}`
      : base;
    setImages((prev) => {
      const next = [...prev];
      if (next[i]) next[i] = { ...next[i], regenerating: true, error: undefined };
      return next;
    });
    try {
      const r = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          title: img.title,
          prompt,
          moodTags: img.moodTags,
          style: "Editorial",
          size: "1024x1024",
          quality: "medium",
          allowMascot,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.images?.[0]?.dataUrl) {
        throw new Error(
          r.status === 429
            ? "Rate limited (429). Wait a moment, then try again."
            : data?.message ?? "Image gen failed",
        );
      }
      setImages((prev) => {
        const next = [...prev];
        if (next[i])
          next[i] = {
            ...next[i],
            promptUsed: data.promptUsed ?? prompt,
            rationale: data.rationale ?? next[i].rationale,
            dataUrl: data.images[0].dataUrl,
            loading: false,
            regenerating: false,
            error: undefined,
          };
        return next;
      });
    } catch (e) {
      setImages((prev) => {
        const next = [...prev];
        if (next[i])
          next[i] = {
            ...next[i],
            regenerating: false,
            error: (e as Error).message,
          };
        return next;
      });
    }
  };

  const fetchImageSuggestions = (i: number): Promise<string[]> => {
    const img = images[i];
    if (!brief) return Promise.resolve([]);
    return creativeToolGateway.getRegenerationSuggestions({
      kind: "image",
      brief,
      basePrompt: img?.basePrompt ?? img?.promptUsed ?? "",
      title: img?.title,
    });
  };

  /**
   * Regenerate the hero video. Re-submits the sora-2 job with an optional
   * suggestion appended. If a finished video already exists it stays on screen
   * under a "Regenerating…" overlay; on failure we keep the prior good video.
   */
  const regenerateAutoVideo = async (suggestion: string) => {
    if (!creativePrompts) return;
    if (pollRef.current) clearTimeout(pollRef.current);
    const hadVideo = video.status === "succeeded" && Boolean(video.dataUrl);
    const oldUrl = video.dataUrl;
    const base = creativePrompts.videoPrompt;
    const effectivePrompt = suggestion.trim()
      ? `${base}\n\nAdjustment for this revision: ${suggestion.trim()}`
      : base;

    if (hadVideo) {
      setVideo({ status: "succeeded", dataUrl: oldUrl, regenerating: true });
    } else {
      setVideo({ status: "submitting" });
    }

    try {
      const vidRes = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          prompt: effectivePrompt,
          seconds: creativePrompts.videoDurationSec,
          aspect: creativePrompts.videoAspect,
          allowMascot,
          voiceoverScript: creativePrompts.voiceoverScript,
          voiceoverDirection: creativePrompts.voiceoverDirection,
          musicAndSfx: creativePrompts.musicAndSfx,
        }),
      });
      if (!vidRes.ok) throw new Error("Video submit failed.");
      const sub = await vidRes.json();
      const jobId = sub.jobId as string;
      if (!hadVideo) setVideo({ status: "queued", jobId });
      const finalVideo = await pollUntilDone(jobId, (status) => {
        // While a prior video is on screen, keep it; otherwise show progress.
        if (!hadVideo) setVideo({ status, jobId });
      });
      setVideo({ status: "succeeded", jobId, dataUrl: finalVideo });
    } catch (e) {
      const message = (e as Error).message || "Video generation failed.";
      if (hadVideo) {
        // Keep the previous good video; surface the error inline.
        setVideo({ status: "succeeded", dataUrl: oldUrl, error: message });
      } else {
        setVideo({ status: "failed", error: message });
      }
    }
  };

  const fetchVideoSuggestions = (): Promise<string[]> => {
    if (!brief) return Promise.resolve([]);
    return creativeToolGateway.getRegenerationSuggestions({
      kind: "video",
      brief,
      basePrompt: creativePrompts?.videoPrompt ?? "",
      title: creativePrompts?.videoTitle ?? "Motion concept",
    });
  };

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Auto-Pilot · Multi-agent pipeline"
        title="One prompt, seven agents, one finished campaign."
        description="Type a campaign idea, hit Run. The agents draft a brief, validate it against brand rules, write channel copy, author image + video prompts, render concepts on gpt-image-2, and produce a sora-2 hero video — all live."
        actions={
          <>
            {!running && brief && (
              <Button variant="secondary" onClick={reset}>
                Reset
              </Button>
            )}
            <Button onClick={run} disabled={running}>
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {running ? "Pipeline running…" : brief ? "Run again" : "Run the pipeline"}
            </Button>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6 grid gap-6 xl:grid-cols-[1fr_1.45fr]">
        {/* Left: prompt + options + timeline */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
            <Label htmlFor="auto-prompt">Campaign request</Label>
            <Textarea
              id="auto-prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1.5"
              disabled={running}
            />
            <div className="mt-3 flex flex-col gap-2.5">
              {tenant.mascot && (
                <ToggleRow
                  title={`Allow ${tenant.mascot.shortName.toLowerCase()} reference in creative prompts`}
                  description={tenant.mascot.toggleDescription}
                  checked={allowMascot}
                  onCheckedChange={setAllowMascot}
                  accent="amber"
                  disabled={running}
                />
              )}
              <ToggleRow
                title="Pause between steps (HITL)"
                description="Each step waits for an 'Approve & continue' before moving on. Best for live walkthroughs."
                checked={hitlMode}
                onCheckedChange={setHitlMode}
                disabled={running}
              />
            </div>
          </div>

          {/* Pipeline timeline */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Agent pipeline
              </div>
              {!autoFollow && (
                <button
                  onClick={resumeAutoFollow}
                  className="text-[10px] uppercase tracking-[0.16em] text-brand-200/80 hover:text-brand-100 transition-colors"
                >
                  Resume auto-follow
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {STEP_META.map((meta, i) => (
                <StepRow
                  key={meta.id}
                  idx={i + 1}
                  id={meta.id}
                  Icon={meta.Icon}
                  label={meta.label}
                  sub={meta.sub}
                  state={steps[meta.id]}
                  focused={focusedStep === meta.id}
                  onClick={() => onStepClick(meta.id)}
                  onContinue={releasePause}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: focused output canvas (single pane) */}
        <div className="min-w-0">
          <FocusedOutputPane
            focusedStep={focusedStep}
            onChangeStep={onStepClick}
            steps={steps}
            brief={brief}
            validation={validation}
            variants={variants}
            creativePrompts={creativePrompts}
            images={images}
            video={video}
            allowMascot={allowMascot}
            onRegenerateImage={regenerateAutoImage}
            fetchImageSuggestions={fetchImageSuggestions}
            onRegenerateVideo={regenerateAutoVideo}
            fetchVideoSuggestions={fetchVideoSuggestions}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step metadata (single source of truth used by both the timeline and
// the focused output pane).
// ---------------------------------------------------------------------------

interface StepMeta {
  id: StepId;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}

const STEP_META: StepMeta[] = [
  {
    id: "plan",
    Icon: Brain,
    label: "Campaign Orchestrator",
    sub: "Drafts the structured brief from your prompt.",
  },
  {
    id: "validate",
    Icon: ShieldCheck,
    label: "Brand & Compliance Validator",
    sub: "LLM-graded findings against the rule library.",
  },
  {
    id: "content",
    Icon: PenTool,
    label: "Content Generator",
    sub: "Channel-specific copy variants in parallel.",
  },
  {
    id: "creative_prompts",
    Icon: Wand2,
    label: "Creative Director",
    sub: "Writes image + video prompts for the rendering agents.",
  },
  {
    id: "images",
    Icon: ImageIcon,
    label: "Image Studio · gpt-image-2",
    sub: "Renders 3 still concepts in parallel — alongside the video.",
  },
  {
    id: "video",
    Icon: Film,
    label: "Motion Studio · sora-2",
    sub: "Renders the hero video concurrently with the images.",
  },
  {
    id: "package",
    Icon: PackageCheck,
    label: "Approval Package",
    sub: "Bundles brief, content, concepts, and video.",
  },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  accent,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
  accent?: "amber";
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium",
            accent === "amber" ? "text-amber-100" : "text-white",
          )}
        >
          {title}
        </div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function StepRow({
  idx,
  id,
  Icon,
  label,
  sub,
  state,
  focused,
  onClick,
  onContinue,
}: {
  idx: number;
  id: StepId;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  state: StepState;
  focused: boolean;
  onClick: () => void;
  onContinue: () => void;
}) {
  const tone =
    state.status === "done"
      ? "text-emerald-300 bg-emerald-500/10 ring-emerald-400/30"
      : state.status === "running"
        ? "text-sky-200 bg-sky-500/15 ring-sky-400/30"
        : state.status === "paused"
          ? "text-amber-200 bg-amber-500/15 ring-amber-400/40"
          : state.status === "error"
            ? "text-red-200 bg-red-500/15 ring-red-400/30"
            : "text-slate-400 bg-white/[0.03] ring-white/10";

  // Click on the row body (but not on inner buttons) to focus.
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't steal clicks from buttons inside the row.
    if ((e.target as HTMLElement).closest("button")) return;
    onClick();
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]",
        state.status === "running" && "border-sky-400/20 bg-sky-500/[0.04]",
        state.status === "paused" && "border-amber-400/30 bg-amber-500/[0.05]",
        state.status === "done" && "border-emerald-400/20",
        state.status === "error" && "border-red-400/30 bg-red-500/[0.05]",
        focused && "ring-2 ring-brand-400/40 shadow-glow",
      )}
    >
      {focused && (
        <span className="absolute -left-1.5 top-3 bottom-3 w-1 rounded-r bg-gradient-to-b from-brand-300 to-brand-500" />
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-8 w-8 rounded-lg grid place-items-center ring-1 shrink-0",
            tone,
          )}
        >
          {state.status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state.status === "done" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : state.status === "paused" ? (
            <Pause className="h-4 w-4" />
          ) : state.status === "error" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Step {idx}
            </div>
            <Badge
              variant={
                state.status === "done"
                  ? "success"
                  : state.status === "running"
                    ? "info"
                    : state.status === "paused"
                      ? "warning"
                      : state.status === "error"
                        ? "danger"
                        : "secondary"
              }
              className="capitalize"
            >
              {state.status === "running"
                ? "Running"
                : state.status === "paused"
                  ? "Awaiting approval"
                  : state.status === "error"
                    ? "Error"
                    : state.status === "done"
                      ? "Done"
                      : "Pending"}
            </Badge>
            {state.status === "done" && state.startedAt && state.endedAt && (
              <span className="text-[10px] text-slate-500">
                {Math.max(1, Math.round((state.endedAt - state.startedAt) / 1000))}s
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm font-medium text-white">{label}</div>
          <div className="text-[11px] text-slate-400">{sub}</div>
          {state.error && (
            <div className="mt-1 text-[11px] text-red-300">{state.error}</div>
          )}
        </div>
        {state.status === "paused" && (
          <Button size="sm" onClick={onContinue}>
            <ArrowRight className="h-3.5 w-3.5" />
            Approve &amp; continue
          </Button>
        )}
      </div>
    </div>
  );
}

// ============ Output cards ============

function FocusedOutputPane({
  focusedStep,
  onChangeStep,
  steps,
  brief,
  validation,
  variants,
  creativePrompts,
  images,
  video,
  allowMascot,
  onRegenerateImage,
  fetchImageSuggestions,
  onRegenerateVideo,
  fetchVideoSuggestions,
}: {
  focusedStep: StepId;
  onChangeStep: (id: StepId) => void;
  steps: Record<StepId, StepState>;
  brief: CampaignBrief | null;
  validation: ValidationResult | null;
  variants: ContentVariant[];
  creativePrompts: CreativePromptsResult | null;
  images: GeneratedImage[];
  video: VideoOutput;
  allowMascot: boolean;
  onRegenerateImage: (i: number, suggestion: string) => void;
  fetchImageSuggestions: (i: number) => Promise<string[]>;
  onRegenerateVideo: (suggestion: string) => void;
  fetchVideoSuggestions: () => Promise<string[]>;
}) {
  const idx = STEP_META.findIndex((m) => m.id === focusedStep);
  const meta = STEP_META[idx];
  const prev = idx > 0 ? STEP_META[idx - 1] : null;
  const next = idx < STEP_META.length - 1 ? STEP_META[idx + 1] : null;
  const state = steps[focusedStep];

  return (
    <motion.div
      key={focusedStep}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-md sticky top-20"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500/40 to-brand-700/40 ring-1 ring-white/10 grid place-items-center">
          <meta.Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-200/80">
            Step {idx + 1} of {STEP_META.length}
          </div>
          <div className="text-sm font-semibold text-white">{meta.label}</div>
        </div>
        {state.status === "running" && (
          <Badge variant="info">
            <Loader2 className="h-3 w-3 animate-spin" />
            Live
          </Badge>
        )}
        {state.status === "done" && (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </Badge>
        )}
        {state.status === "paused" && (
          <Badge variant="warning">
            <Pause className="h-3 w-3" />
            HITL pause
          </Badge>
        )}
        {state.status === "error" && (
          <Badge variant="danger">
            <AlertTriangle className="h-3 w-3" />
            Error
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => prev && onChangeStep(prev.id)}
            disabled={!prev}
            aria-label="Previous step"
            className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed grid place-items-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-200" />
          </button>
          <button
            onClick={() => next && onChangeStep(next.id)}
            disabled={!next}
            aria-label="Next step"
            className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed grid place-items-center transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Body — animated swap between focused step bodies */}
      <div className="p-5 max-h-[calc(100vh-260px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={focusedStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {state.status === "pending" ? (
              <PendingPlaceholder meta={meta} />
            ) : focusedStep === "plan" ? (
              <PlanBody brief={brief} state={state} />
            ) : focusedStep === "validate" ? (
              <ValidationBody validation={validation} state={state} />
            ) : focusedStep === "content" ? (
              <ContentBody variants={variants} state={state} />
            ) : focusedStep === "creative_prompts" ? (
              <CreativePromptsBody
                prompts={creativePrompts}
                allowMascot={allowMascot}
                state={state}
              />
            ) : focusedStep === "images" ? (
              <ImagesBody
                images={images}
                state={state}
                onRegenerate={onRegenerateImage}
                fetchSuggestions={fetchImageSuggestions}
              />
            ) : focusedStep === "video" ? (
              <VideoBody
                video={video}
                durationSec={creativePrompts?.videoDurationSec ?? 12}
                aspect={creativePrompts?.videoAspect ?? "16:9"}
                title={creativePrompts?.videoTitle}
                allowMascot={allowMascot}
                state={state}
                onRegenerate={onRegenerateVideo}
                fetchSuggestions={fetchVideoSuggestions}
              />
            ) : (
              <PackageBody
                state={state}
                ready={state.status === "done"}
                brief={brief}
                video={video}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer step nav strip */}
      <div className="border-t border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto">
        {STEP_META.map((m, i) => {
          const s = steps[m.id].status;
          const active = m.id === focusedStep;
          return (
            <button
              key={m.id}
              onClick={() => onChangeStep(m.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors shrink-0",
                active
                  ? "bg-brand-500/20 text-brand-100 ring-1 ring-brand-400/40"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  s === "done" && "bg-emerald-400",
                  s === "running" && "bg-sky-400 animate-pulseGlow",
                  s === "paused" && "bg-amber-400",
                  s === "error" && "bg-red-400",
                  s === "pending" && "bg-slate-600",
                )}
              />
              {i + 1}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function PendingPlaceholder({ meta }: { meta: StepMeta }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 grid place-items-center text-center">
      <div className="h-10 w-10 rounded-lg bg-white/[0.04] ring-1 ring-white/10 grid place-items-center">
        <meta.Icon className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-3 text-sm font-medium text-white">{meta.label}</div>
      <div className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
        {meta.sub}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
        Waiting on earlier steps…
      </div>
    </div>
  );
}

function PlanBody({ brief, state }: { brief: CampaignBrief | null; state: StepState }) {
  if (state.status === "running" || !brief) return <Shimmer lines={6} />;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">{brief.productLine}</Badge>
        {brief.channels.slice(0, 5).map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
      </div>
      <div className="text-lg font-semibold text-white leading-tight">
        {brief.title}
      </div>
      <div className="text-slate-300 leading-relaxed">{brief.objective}</div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Audiences
          </div>
          <ul className="mt-1.5 space-y-1">
            {brief.audiences.map((a) => (
              <li key={a.label} className="text-xs">
                <span className="text-white">{a.label}</span>
                {a.estimatedReach && (
                  <span className="ml-1 text-slate-400">· {a.estimatedReach}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Key messages
          </div>
          <ul className="mt-1.5 space-y-1">
            {brief.keyMessages.slice(0, 3).map((m, i) => (
              <li key={i} className="text-xs text-slate-200">
                {m.headline}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ValidationBody({
  validation,
  state,
}: {
  validation: ValidationResult | null;
  state: StepState;
}) {
  if (state.status === "running" || !validation) return <Shimmer lines={4} />;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          className="relative h-16 w-16 rounded-full grid place-items-center ring-2 ring-emerald-400/30"
          style={{
            background: `conic-gradient(rgba(99,130,255,0.9) ${validation.score * 3.6}deg, rgba(255,255,255,0.06) 0)`,
          }}
        >
          <div className="absolute inset-1 rounded-full bg-slate-950 grid place-items-center">
            <div className="text-xl font-semibold text-white">
              {validation.score}
            </div>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-white font-medium capitalize">
            {validation.overallStatus.replace("_", " ")}
          </div>
          <div className="text-xs text-slate-400">
            {validation.findings.length} findings ·{" "}
            {validation.approvalsRequired.length} approval
            {validation.approvalsRequired.length === 1 ? "" : "s"} required
          </div>
        </div>
      </div>
      <div className="grid gap-1.5 pr-1">
        {validation.findings.map((f) => (
          <div
            key={f.id}
            className="flex items-start gap-2 text-xs rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <Badge
              variant={
                f.severity === "blocker"
                  ? "danger"
                  : f.severity === "warning"
                    ? "warning"
                    : f.severity === "approval_required"
                      ? "info"
                      : f.severity === "info"
                        ? "info"
                        : "success"
              }
              className="shrink-0"
            >
              {f.severity.replace("_", " ")}
            </Badge>
            <div className="min-w-0">
              <div className="text-white">{f.ruleTitle}</div>
              <div className="text-slate-400">{f.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentBody({
  variants,
  state,
}: {
  variants: ContentVariant[];
  state: StepState;
}) {
  if (state.status === "running" || variants.length === 0)
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Shimmer lines={3} />
        <Shimmer lines={3} />
      </div>
    );
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {variants.map((v) => (
        <div
          key={v.id}
          className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
        >
          <div className="flex items-center gap-1.5">
            <Megaphone className="h-3 w-3 text-brand-300" />
            <Badge variant="secondary">{v.channel}</Badge>
          </div>
          <div className="mt-1.5 text-sm font-semibold text-white leading-snug">
            {v.headline}
          </div>
          {v.subheadline && (
            <div className="text-xs text-slate-300">{v.subheadline}</div>
          )}
          <div className="mt-1.5 text-[11px] text-slate-400 whitespace-pre-line">
            {v.body}
          </div>
          <div className="mt-2">
            <Badge variant="info">CTA · {v.cta}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreativePromptsBody({
  prompts,
  allowMascot,
  state,
}: {
  prompts: CreativePromptsResult | null;
  allowMascot: boolean;
  state: StepState;
}) {
  if (state.status === "running" || !prompts) return <Shimmer lines={5} />;
  return (
    <div className="space-y-3 text-sm">
      {allowMascot && (
        <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-3 text-[11px] text-amber-100 leading-relaxed">
          Mascot reference enabled — the agent authored stylized character
          prompts for stills. The video prompt stays people-and-environment
          only (sora-2 doesn&apos;t accept character+people combos; the mascot
          is composited in post).
        </div>
      )}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Rationale
        </div>
        <div className="mt-1 text-xs text-slate-300 leading-relaxed">
          {prompts.rationale}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-brand-200/80">
          Image prompts (3 directions)
        </div>
        {prompts.imagePrompts.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{p.title}</Badge>
              {p.moodTags.slice(0, 4).map((m) => (
                <Badge key={m} variant="outline">
                  #{m}
                </Badge>
              ))}
            </div>
            <div className="mt-1.5 text-xs text-slate-300 font-mono leading-relaxed">
              {p.prompt}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-rose-200/80">
          Video prompt · {prompts.videoDurationSec}s · {prompts.videoAspect}
        </div>
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/[0.05] p-3">
          <div className="text-sm font-medium text-white">
            {prompts.videoTitle}
          </div>
          <div className="mt-1.5 text-xs text-slate-200 font-mono leading-relaxed">
            {prompts.videoPrompt}
          </div>
        </div>
      </div>
      {(prompts.voiceoverScript ||
        prompts.voiceoverDirection ||
        prompts.musicAndSfx) && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/80">
            Audio direction (rendered natively by sora-2)
          </div>
          <div className="rounded-lg border border-amber-300/20 bg-amber-500/[0.05] p-3 space-y-2">
            {prompts.voiceoverScript && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70">
                  Voiceover script
                </div>
                <div className="mt-1 text-sm text-white italic leading-relaxed">
                  &ldquo;{prompts.voiceoverScript}&rdquo;
                </div>
              </div>
            )}
            {prompts.voiceoverDirection && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70">
                  Voice
                </div>
                <div className="mt-0.5 text-xs text-slate-200">
                  {prompts.voiceoverDirection}
                </div>
              </div>
            )}
            {prompts.musicAndSfx && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70">
                  Music &amp; SFX
                </div>
                <div className="mt-0.5 text-xs text-slate-200">
                  {prompts.musicAndSfx}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ImagesBody({
  images,
  state,
  onRegenerate,
  fetchSuggestions,
}: {
  images: GeneratedImage[];
  state: StepState;
  onRegenerate: (i: number, suggestion: string) => void;
  fetchSuggestions: (i: number) => Promise<string[]>;
}) {
  if (state.status === "running" && images.length === 0)
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <ImageSkeleton />
        <ImageSkeleton />
        <ImageSkeleton />
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {images.map((img, i) => (
        <AutoImageCard
          key={i}
          index={i}
          img={img}
          onRegenerate={onRegenerate}
          fetchSuggestions={fetchSuggestions}
        />
      ))}
    </div>
  );
}

function AutoImageCard({
  index,
  img,
  onRegenerate,
  fetchSuggestions,
}: {
  index: number;
  img: GeneratedImage;
  onRegenerate: (i: number, suggestion: string) => void;
  fetchSuggestions: (i: number) => Promise<string[]>;
}) {
  const [showRegen, setShowRegen] = React.useState(false);
  const busy = Boolean(img.loading || img.regenerating);
  const canRegenerate = !img.loading; // available once the first render settles

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
      <div className="aspect-square relative bg-slate-900">
        {img.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.dataUrl}
            alt={img.title}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              img.regenerating && "opacity-40",
            )}
          />
        ) : null}

        {img.loading && !img.dataUrl ? (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="h-5 w-5 text-brand-300 animate-spin" />
          </div>
        ) : null}

        {img.regenerating ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/40">
            <div className="text-center">
              <Loader2 className="h-5 w-5 text-brand-300 animate-spin mx-auto" />
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-brand-200/90">
                Regenerating…
              </div>
            </div>
          </div>
        ) : null}

        {img.error && !img.dataUrl && !img.regenerating ? (
          <div className="absolute inset-0 grid place-items-center text-[10px] text-red-200 px-3 text-center">
            {img.error}
          </div>
        ) : null}
      </div>

      <div className="p-2.5 space-y-1.5">
        <div className="text-xs font-semibold text-white">{img.title}</div>
        {img.rationale && (
          <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
            {img.rationale}
          </div>
        )}

        {img.error && img.dataUrl && (
          <div className="flex items-start gap-1 text-[10px] text-red-200">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{img.error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          {img.dataUrl && (
            <a
              href={img.dataUrl}
              download={`concept-${index + 1}.png`}
              className="inline-flex items-center gap-1 text-[10px] text-brand-200 hover:text-brand-100"
            >
              <Download className="h-3 w-3" />
              Download
            </a>
          )}
          {canRegenerate && (
            <button
              type="button"
              onClick={() => setShowRegen((v) => !v)}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-1 text-[10px] text-brand-200 hover:text-brand-100 disabled:opacity-40"
            >
              <RefreshCw
                className={cn("h-3 w-3", img.regenerating && "animate-spin")}
              />
              Regenerate
            </button>
          )}
        </div>

        <AnimatePresence>
          {showRegen && (
            <RegeneratePanel
              kind="image"
              busy={busy}
              fetchSuggestions={() => fetchSuggestions(index)}
              onSubmit={(s) => {
                setShowRegen(false);
                onRegenerate(index, s);
              }}
              onClose={() => setShowRegen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VideoBody({
  video,
  durationSec,
  aspect,
  title,
  allowMascot,
  state,
  onRegenerate,
  fetchSuggestions,
}: {
  video: VideoOutput;
  durationSec: number;
  aspect: "16:9" | "9:16" | "1:1";
  title?: string;
  allowMascot: boolean;
  state: StepState;
  onRegenerate: (suggestion: string) => void;
  fetchSuggestions: () => Promise<string[]>;
}) {
  const { tenant } = useTenant();
  const [showRegen, setShowRegen] = React.useState(false);
  void durationSec;
  const inFlight =
    state.status === "running" ||
    video.status === "submitting" ||
    video.status === "queued" ||
    video.status === "preprocessing" ||
    video.status === "running";

  const aspectClass =
    aspect === "9:16"
      ? "aspect-[9/16] max-h-[420px] mx-auto"
      : aspect === "1:1"
        ? "aspect-square max-w-[480px] mx-auto"
        : "aspect-video";

  // Regenerating in place: keep the prior render visible under a spinner.
  if (video.regenerating && video.dataUrl) {
    return (
      <div className="space-y-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/10 bg-black",
            aspectClass,
          )}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={video.dataUrl}
            loop
            muted
            autoPlay
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 grid place-items-center bg-slate-950/40">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-rose-300 animate-spin mx-auto" />
              <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-rose-200/90">
                Regenerating…
              </div>
              <div className="mt-1 text-[11px] text-slate-300">
                Keeping your current video until the new one is ready.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (video.status === "succeeded" && video.dataUrl) {
    return (
      <div className="space-y-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-glow-lg",
            aspectClass,
          )}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={video.dataUrl}
            controls
            autoPlay
            loop
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        {video.error && (
          <div className="flex items-start gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-[11px] text-red-100">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Regenerate failed — keeping your current video. {video.error}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {title && <Badge variant="info">{title}</Badge>}
            {allowMascot && (
              <Badge variant="warning">
                <ShieldCheck className="h-3 w-3" />
                Reference concept · approved asset workflow required
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowRegen((v) => !v)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            <a href={video.dataUrl} download={`${tenant.prompts.videoDownloadStem}.mp4`}>
              <Button size="sm" variant="secondary">
                <Download className="h-3.5 w-3.5" />
                Download MP4
              </Button>
            </a>
          </div>
        </div>
        <AnimatePresence>
          {showRegen && (
            <RegeneratePanel
              kind="video"
              accent="rose"
              busy={false}
              fetchSuggestions={fetchSuggestions}
              onSubmit={(s) => {
                setShowRegen(false);
                onRegenerate(s);
              }}
              onClose={() => setShowRegen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
  if (inFlight) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950",
          aspectClass,
        )}
      >
        <div className="absolute inset-0 bg-grid-faint bg-[length:32px_32px] opacity-30" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <Loader2 className="h-7 w-7 text-rose-300 animate-spin mx-auto" />
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-200/90">
              {video.status === "submitting" ? "Submitting" : video.status}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Sora-2 jobs typically complete in 30s – 3 min.
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (video.status === "failed") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Video generation failed
          </div>
          <div className="mt-1 text-red-100/90 text-xs">{video.error}</div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowRegen((v) => !v)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
        <AnimatePresence>
          {showRegen && (
            <RegeneratePanel
              kind="video"
              accent="rose"
              busy={false}
              fetchSuggestions={fetchSuggestions}
              onSubmit={(s) => {
                setShowRegen(false);
                onRegenerate(s);
              }}
              onClose={() => setShowRegen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
  return <Shimmer lines={3} />;
}

function PackageBody({
  state,
  ready,
  brief,
  video,
}: {
  state: StepState;
  ready: boolean;
  brief: CampaignBrief | null;
  video: VideoOutput;
}) {
  const { tenant } = useTenant();
  if (state.status === "running") return <Shimmer lines={4} />;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.06] via-brand-500/[0.04] to-rose-500/[0.06] shadow-glow-lg">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-400/10 blur-3xl" />
      <div className="relative p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-brand-600 ring-1 ring-white/20 shadow-glow grid place-items-center">
            <PackageCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
              Approval-ready package
            </div>
            <div className="text-lg font-semibold text-white">
              {brief?.title ?? "Campaign package"}
            </div>
          </div>
          {ready && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </Badge>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PackageStat label="Brief" value={brief ? "Complete" : "—"} />
          <PackageStat
            label="Hero video"
            value={video.dataUrl ? "Rendered" : "—"}
          />
          <PackageStat label="Reviewers" value="2 pending" />
        </div>
        {ready && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {video.dataUrl && (
              <a href={video.dataUrl} download={`${tenant.prompts.videoDownloadStem}.mp4`}>
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  Download hero video
                </Button>
              </a>
            )}
            <Button>
              <Play className="h-4 w-4" />
              Send to Approval Center
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PackageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function Shimmer({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/[0.04] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:700px_100%]" />
        </div>
      ))}
    </div>
  );
}

function ImageSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="aspect-square bg-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:700px_100%]" />
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
        <div className="h-2 w-full rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}
