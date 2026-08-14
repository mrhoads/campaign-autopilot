"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  PlugZap,
  Image as ImageIcon,
  Video,
  Download,
  Film,
  RefreshCw,
} from "lucide-react";
import type {
  CampaignBrief,
  CampaignChannel,
  CreativeConcept,
  CreativeStyle,
  CreativeToolStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { creativeToolGateway } from "@/lib/services";
import { PageHeader } from "@/components/shared/PageHeader";
import { RegeneratePanel } from "@/components/creative/RegeneratePanel";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getClientCapabilities } from "@/lib/services/status";
import { useTenant } from "@/lib/tenants/context";

const STYLES: CreativeStyle[] = [
  "Editorial",
  "Cinematic",
  "Photoreal",
  "Illustrative",
  "Documentary",
  "Minimal",
];

const CHANNEL_OPTIONS: CampaignChannel[] = [
  "Paid Social",
  "Email",
  "Landing Page",
  "Display Ads",
  "Connected TV",
  "Out of Home",
];

const MOOD_LIBRARY = [
  "warm",
  "community",
  "trustworthy",
  "cinematic",
  "modern",
  "expansive",
  "optimistic",
  "inclusive",
  "energetic",
  "calm",
];

interface VideoState {
  status:
    | "idle"
    | "submitting"
    | "queued"
    | "preprocessing"
    | "running"
    | "succeeded"
    | "failed"
    | "routed";
  jobId?: string;
  promptUsed?: string;
  dataUrl?: string;
  error?: string;
  routedNote?: string;
  /** True while a new render is in flight but the previous video still shows. */
  regenerating?: boolean;
}

export function CreativeWorkspace({
  initialConcepts,
  initialToolStatus,
  brief,
}: {
  initialConcepts: CreativeConcept[];
  initialToolStatus: CreativeToolStatus;
  brief: CampaignBrief;
}) {
  const { tenant } = useTenant();
  const [concepts, setConcepts] = React.useState(initialConcepts);
  const [toolStatus, setToolStatus] = React.useState(initialToolStatus);
  /** Per-concept regeneration state, keyed by concept id. */
  const [regen, setRegen] = React.useState<
    Record<string, { loading: boolean; error?: string }>
  >({});
  const [prompt, setPrompt] = React.useState(
    tenant.content.creativeConcepts[0]?.promptUsed ??
      "Editorial photograph of a warm, modern lifestyle scene at golden hour, shallow depth of field, no overlay text, no logos.",
  );
  const [style, setStyle] = React.useState<CreativeStyle>("Editorial");
  const [channels, setChannels] = React.useState<CampaignChannel[]>([
    "Paid Social",
    "Landing Page",
  ]);
  const [moods, setMoods] = React.useState<string[]>([
    "warm",
    "community",
    "trustworthy",
  ]);
  const [approvedOnly, setApprovedOnly] = React.useState(true);
  const [mascotUsage, setMascotUsage] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [caps, setCaps] = React.useState<{ image: boolean; video: boolean }>({
    image: true,
    video: true,
  });

  // Video state
  const [videoPrompt, setVideoPrompt] = React.useState(
    tenant.sanitizer.videoFallbackPrompt,
  );
  const [videoSeconds, setVideoSeconds] = React.useState<4 | 8 | 12>(4);
  const [videoAspect, setVideoAspect] = React.useState<"16:9" | "9:16" | "1:1">(
    "16:9",
  );
  const [video, setVideo] = React.useState<VideoState>({ status: "idle" });
  const pollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    getClientCapabilities().then((c) =>
      setCaps({ image: c.image, video: c.video }),
    );
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const toggleChannel = (c: CampaignChannel) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const toggleMood = (m: string) =>
    setMoods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const runGeneration = async () => {
    setGenerating(true);
    try {
      const result = await creativeToolGateway.generateConcepts({
        brief,
        conceptPrompt: prompt,
        style,
        channels,
        moodTags: moods,
        approvedAssetsOnly: approvedOnly,
        mascotUsage,
      });
      setConcepts(result);
      setToolStatus({ ...toolStatus, lastSyncIso: new Date().toISOString() });
    } finally {
      setGenerating(false);
    }
  };

  /** Regenerate a single concept in place, keeping the other two untouched. */
  const regenerateOne = async (conceptId: string, suggestion: string) => {
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;
    setRegen((s) => ({ ...s, [conceptId]: { loading: true } }));
    try {
      const updated = await creativeToolGateway.regenerateConcept({
        brief,
        baseConcept: concept,
        suggestion,
        style,
        moodTags: moods,
        mascotUsage,
      });
      setConcepts((prev) =>
        prev.map((c) => (c.id === conceptId ? updated : c)),
      );
      setRegen((s) => ({ ...s, [conceptId]: { loading: false } }));
    } catch (e) {
      // Keep the previous image; surface the error (e.g., 429) on the card.
      setRegen((s) => ({
        ...s,
        [conceptId]: { loading: false, error: (e as Error).message },
      }));
    }
  };

  const fetchConceptSuggestions = React.useCallback(
    (conceptId: string) => {
      const concept = concepts.find((c) => c.id === conceptId);
      return creativeToolGateway.getRegenerationSuggestions({
        kind: "image",
        brief,
        basePrompt: concept?.promptUsed ?? "",
        title: concept?.title,
      });
    },
    [concepts, brief],
  );

  const fetchVideoSuggestions = React.useCallback(
    () =>
      creativeToolGateway.getRegenerationSuggestions({
        kind: "video",
        brief,
        basePrompt: videoPrompt,
        title: "Motion concept",
      }),
    [brief, videoPrompt],
  );

  const runVideo = async (suggestion?: string) => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const effectivePrompt = suggestion?.trim()
      ? `${videoPrompt}\n\nAdjustment for this revision: ${suggestion.trim()}`
      : videoPrompt;
    // If a finished video already exists, keep it on screen while we re-render.
    setVideo((prev) =>
      prev.status === "succeeded" && prev.dataUrl
        ? { ...prev, regenerating: true }
        : { status: "submitting" },
    );
    try {
      const sub = await creativeToolGateway.submitVideoConcept({
        brief,
        prompt: effectivePrompt,
        style,
        moodTags: moods,
        mascotUsage,
        seconds: videoSeconds,
        aspect: videoAspect,
      });
      if ("routed" in sub) {
        setVideo({
          status: "routed",
          routedNote: sub.complianceNote,
        });
        return;
      }
      setVideo((prev) => ({
        status: (sub.status as VideoState["status"]) || "queued",
        jobId: sub.jobId,
        promptUsed: sub.promptUsed,
        // Preserve the prior render (if any) so it stays visible while polling.
        dataUrl: prev.regenerating ? prev.dataUrl : undefined,
        regenerating: prev.regenerating,
      }));
      pollVideoLoop(sub.jobId);
    } catch (e) {
      setVideo((prev) => ({
        ...prev,
        status: "failed",
        regenerating: false,
        error: (e as Error).message || "Video generation unavailable.",
      }));
    }
  };

  const pollVideoLoop = (jobId: string) => {
    const tick = async () => {
      try {
        const r = await creativeToolGateway.pollVideo(jobId);
        if (r.status === "succeeded") {
          setVideo((prev) => ({
            ...prev,
            status: "succeeded",
            dataUrl: r.dataUrl,
            regenerating: false,
          }));
          return;
        }
        if (r.status === "failed" || r.status === "cancelled") {
          setVideo((prev) => ({
            ...prev,
            status: "failed",
            regenerating: false,
            error: r.failureReason ?? "Job did not complete.",
          }));
          return;
        }
        setVideo((prev) => ({
          ...prev,
          status: r.status as VideoState["status"],
        }));
        pollTimer.current = setTimeout(tick, 5000);
      } catch (e) {
        setVideo((prev) => ({
          ...prev,
          status: "failed",
          regenerating: false,
          error: (e as Error).message,
        }));
      }
    };
    pollTimer.current = setTimeout(tick, 3000);
  };

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Visual concepts"
        title="Creative concept studio"
        description="Compose a prompt, calibrate the style, and request a concept set through the MCP-connected creative gateway. Mascot or logo work is routed through the approved asset workflow — never generated."
        actions={
          <>
            <Badge variant="info">
              <Sparkles className="h-3 w-3" />
              {brief.title}
            </Badge>
            <Button onClick={runGeneration} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate concept set
            </Button>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6 grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
        {/* Request panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md space-y-5">
            <div>
              <Label htmlFor="prompt">Concept prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="mt-1.5"
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Mood, composition, and avoidance language are encoded into the
                prompt that ships to {caps.image ? "your Azure image model" : "the (currently mocked) image model"}.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Style</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        "text-xs rounded-full border px-3 py-1 transition-all",
                        style === s
                          ? "border-brand-400/60 bg-brand-500/15 text-brand-100 shadow-glow"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Channels</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CHANNEL_OPTIONS.map((c) => {
                    const active = channels.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleChannel(c)}
                        className={cn(
                          "text-xs rounded-full border px-3 py-1 transition-all",
                          active
                            ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <Label>Visual mood</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MOOD_LIBRARY.map((m) => {
                  const active = moods.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMood(m)}
                      className={cn(
                        "text-xs rounded-full border px-3 py-1 transition-all",
                        active
                          ? "border-amber-300/50 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                      )}
                    >
                      #{m}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <ToggleRow
                title="Approved assets only"
                description="Limit composition to assets sourced from the approved asset management system."
                checked={approvedOnly}
                onCheckedChange={setApprovedOnly}
              />
              {tenant.mascot && (
                <ToggleRow
                  title={`Include ${tenant.mascot.shortName.toLowerCase()} reference`}
                  description={`Routes the concept through the approved asset workflow. Generative ${tenant.mascot.shortName.toLowerCase()} likeness is never produced.`}
                  checked={mascotUsage}
                  onCheckedChange={setMascotUsage}
                  accent="amber"
                />
              )}
              <AnimatePresence>
                {mascotUsage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Use only approved brand mascot assets.
                    </div>
                    <div className="mt-1 text-amber-100/90">
                      Do not generate unapproved mascot likeness. This request
                      will be routed to the approved asset workflow with a
                      reviewer in the loop.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <McpGatewayCard
            status={toolStatus}
            onGenerate={runGeneration}
            generating={generating}
          />
        </motion.div>

        {/* Concept results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
                Returned concepts
              </div>
              <div className="text-lg font-semibold text-white">
                {concepts.length} direction
                {concepts.length === 1 ? "" : "s"} from the studio gateway
              </div>
            </div>
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              Human review enforced
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {generating
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ConceptSkeleton key={`skel-${i}`} />
                  ))
                : concepts.map((c, i) => (
                    <ConceptCard
                      concept={c}
                      key={c.id}
                      delay={i * 0.05}
                      canRegenerate={caps.image || mascotUsage}
                      regenState={regen[c.id]}
                      onRegenerate={(s) => regenerateOne(c.id, s)}
                      fetchSuggestions={() => fetchConceptSuggestions(c.id)}
                    />
                  ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Video concept generator */}
      <div className="px-4 md:px-6 lg:px-8 mt-10">
        <VideoConceptStudio
          available={caps.video}
          mascotUsage={mascotUsage}
          videoPrompt={videoPrompt}
          setVideoPrompt={setVideoPrompt}
          videoSeconds={videoSeconds}
          setVideoSeconds={setVideoSeconds}
          videoAspect={videoAspect}
          setVideoAspect={setVideoAspect}
          video={video}
          onRun={runVideo}
          fetchSuggestions={fetchVideoSuggestions}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  accent,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
  accent?: "amber";
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
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function McpGatewayCard({
  status,
  onGenerate,
  generating,
}: {
  status: CreativeToolStatus;
  onGenerate: () => void;
  generating: boolean;
}) {
  const conn =
    status.connectionStatus === "connected"
      ? { color: "text-emerald-300", label: "Connected", dot: "bg-emerald-400" }
      : status.connectionStatus === "degraded"
        ? { color: "text-amber-300", label: "Degraded", dot: "bg-amber-400" }
        : { color: "text-red-300", label: "Disconnected", dot: "bg-red-400" };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80 flex items-center gap-1.5">
            <PlugZap className="h-3 w-3" />
            MCP integration
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {status.serviceName}
          </div>
          <div className="text-xs text-slate-400">{status.vendor}</div>
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs", conn.color)}>
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulseGlow", conn.dot)} />
          {conn.label}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {status.availableTools.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] text-brand-200 font-mono">
                {t.name}
              </code>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              {t.description}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Last sync · {formatRelativeTime(status.lastSyncIso)}</span>
        <Button size="sm" onClick={onGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Request concept set
        </Button>
      </div>
    </div>
  );
}

function ConceptCard({
  concept,
  delay,
  canRegenerate,
  regenState,
  onRegenerate,
  fetchSuggestions,
}: {
  concept: CreativeConcept;
  delay: number;
  canRegenerate: boolean;
  regenState?: { loading: boolean; error?: string };
  onRegenerate: (suggestion: string) => void;
  fetchSuggestions: () => Promise<string[]>;
}) {
  const [showRegen, setShowRegen] = React.useState(false);
  const loading = Boolean(regenState?.loading);
  const error = regenState?.error;
  const comp =
    concept.complianceStatus === "ready"
      ? { tone: "success" as const, label: "Compliance ready" }
      : concept.complianceStatus === "needs_review"
        ? { tone: "warning" as const, label: "Needs review" }
        : { tone: "danger" as const, label: "Blocked" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-md"
    >
      <div
        className={cn(
          "relative aspect-[16/10] w-full overflow-hidden",
          !concept.imageDataUrl && cn("bg-gradient-to-br", concept.thumbnailHue),
        )}
      >
        {concept.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={concept.imageDataUrl}
            alt={concept.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-grid-faint bg-[length:24px_24px] opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                Concept reference · connect image deployment for live render
              </div>
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          <Badge variant="info">{concept.style}</Badge>
          {concept.imageDataUrl && (
            <Badge variant="success">
              <Sparkles className="h-2.5 w-2.5" />
              Generated
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={comp.tone}>{comp.label}</Badge>
        </div>

        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/70 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-brand-300 animate-spin mx-auto" />
              <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-brand-200/90">
                Regenerating…
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="text-base font-semibold text-white">
          {concept.title}
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {concept.rationale}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {concept.moodTags.map((m) => (
            <Badge key={m} variant="outline">#{m}</Badge>
          ))}
        </div>

        <details className="text-xs text-slate-400 group/details">
          <summary className="cursor-pointer text-brand-200/90 hover:text-brand-200 select-none">
            Show prompt used
          </summary>
          <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] text-slate-300 leading-relaxed">
            {concept.promptUsed}
          </div>
        </details>

        {concept.complianceNote && (
          <div className="mt-2 rounded-lg border border-amber-300/20 bg-amber-500/10 p-3 text-[11px] text-amber-100">
            <div className="flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3 w-3" />
              Compliance note
            </div>
            <div className="mt-0.5">{concept.complianceNote}</div>
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-[11px] text-red-100">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {error}{" "}
              <button
                type="button"
                onClick={() => setShowRegen(true)}
                className="underline hover:text-white"
              >
                Try again
              </button>
            </span>
          </div>
        )}

        <div className="pt-2 flex items-center gap-2 flex-wrap">
          {concept.imageDataUrl && (
            <a
              href={concept.imageDataUrl}
              download={`${concept.title.replace(/\s+/g, "-").toLowerCase()}.png`}
            >
              <Button size="sm" variant="secondary">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          )}
          {canRegenerate && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowRegen((v) => !v)}
              disabled={loading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
              Regenerate
            </Button>
          )}
          <Button size="sm" className="ml-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            Request review
          </Button>
        </div>

        <AnimatePresence>
          {showRegen && (
            <RegeneratePanel
              kind="image"
              busy={loading}
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
    </motion.div>
  );
}

function ConceptSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft">
      <div className="aspect-[16/10] w-full bg-white/[0.03] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:700px_100%]" />
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-white/[0.05]" />
        <div className="h-3 w-full rounded bg-white/[0.05]" />
        <div className="h-3 w-5/6 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video Concept Studio
// ---------------------------------------------------------------------------

const VIDEO_DURATIONS: (4 | 8 | 12)[] = [4, 8, 12];
const ASPECT_OPTIONS: { value: "16:9" | "9:16" | "1:1"; label: string }[] = [
  { value: "16:9", label: "16:9 · CTV / web" },
  { value: "9:16", label: "9:16 · Reels / TikTok" },
  { value: "1:1", label: "1:1 · Feed" },
];

function VideoConceptStudio({
  available,
  mascotUsage,
  videoPrompt,
  setVideoPrompt,
  videoSeconds,
  setVideoSeconds,
  videoAspect,
  setVideoAspect,
  video,
  onRun,
  fetchSuggestions,
}: {
  available: boolean;
  mascotUsage: boolean;
  videoPrompt: string;
  setVideoPrompt: (s: string) => void;
  videoSeconds: 4 | 8 | 12;
  setVideoSeconds: (s: 4 | 8 | 12) => void;
  videoAspect: "16:9" | "9:16" | "1:1";
  setVideoAspect: (s: "16:9" | "9:16" | "1:1") => void;
  video: VideoState;
  onRun: (suggestion?: string) => void;
  fetchSuggestions: () => Promise<string[]>;
}) {
  const [showRegen, setShowRegen] = React.useState(false);
  const inFlight =
    video.status === "submitting" ||
    video.status === "queued" ||
    video.status === "preprocessing" ||
    video.status === "running";
  const hasResult =
    video.status === "succeeded" || video.status === "failed";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-md">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="relative p-5 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-rose-200/80 flex items-center gap-1.5">
              <Film className="h-3 w-3" />
              Motion concepts · Sora
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              Generate a video direction
            </div>
            <div className="mt-1 text-xs text-slate-400 max-w-xl">
              Submit a 5–20 second motion concept through the Azure Sora preview
              endpoint. Outputs ship as MP4 with the same compliance posture as
              still concepts — human review required, no generative restricted assets.
            </div>
          </div>
          {available ? (
            <Badge variant="info">
              <Sparkles className="h-3 w-3" />
              Sora connected
            </Badge>
          ) : (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3" />
              Sora not configured
            </Badge>
          )}
        </div>
      </div>

      <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="video-prompt">Motion prompt</Label>
            <Textarea
              id="video-prompt"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={5}
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Duration</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {VIDEO_DURATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setVideoSeconds(s)}
                    className={cn(
                      "text-xs rounded-full border px-3 py-1 transition-all",
                      videoSeconds === s
                        ? "border-rose-300/60 bg-rose-500/15 text-rose-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                    )}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Aspect</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ASPECT_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setVideoAspect(a.value)}
                    className={cn(
                      "text-xs rounded-full border px-3 py-1 transition-all",
                      videoAspect === a.value
                        ? "border-rose-300/60 bg-rose-500/15 text-rose-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {mascotUsage && (
            <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mascot reference is on
              </div>
              <div className="mt-1 text-amber-100/90">
                The video request will be routed to the approved asset workflow
                — Sora will not be called. Turn off mascot reference to generate
                directly.
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => (hasResult ? setShowRegen((v) => !v) : onRun())}
                disabled={inFlight || !available}
              >
                {inFlight ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasResult ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {inFlight
                  ? "Working…"
                  : hasResult
                    ? "Regenerate"
                    : "Generate video concept"}
              </Button>
              {video.jobId && (
                <Badge variant="secondary">job · {video.jobId.slice(-8)}</Badge>
              )}
            </div>

            <AnimatePresence>
              {showRegen && (
                <RegeneratePanel
                  kind="video"
                  accent="rose"
                  busy={inFlight}
                  fetchSuggestions={fetchSuggestions}
                  onSubmit={(s) => {
                    setShowRegen(false);
                    onRun(s);
                  }}
                  onClose={() => setShowRegen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <VideoPreview video={video} aspect={videoAspect} available={available} />
      </div>
    </div>
  );
}

function VideoPreview({
  video,
  aspect,
  available,
}: {
  video: VideoState;
  aspect: "16:9" | "9:16" | "1:1";
  available: boolean;
}) {
  const { tenant } = useTenant();
  const aspectClass =
    aspect === "9:16"
      ? "aspect-[9/16] max-h-[420px] mx-auto"
      : aspect === "1:1"
        ? "aspect-square"
        : "aspect-video";

  // Regenerating: keep the previous render visible under a spinner overlay.
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
                Keeping your current concept until the new one is ready.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (video.status === "routed") {
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4" />
          Routed to approved asset workflow
        </div>
        <div className="mt-1 text-amber-100/90">
          {video.routedNote ??
            "Mascot reference is on — this request is being handled by the approved studio workflow."}
        </div>
      </div>
    );
  }

  if (!available && video.status === "idle") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-slate-300">
        <div className="flex items-center gap-2 font-medium text-white">
          <Video className="h-4 w-4 text-rose-300" />
          Sora not connected
        </div>
        <div className="mt-1 text-xs text-slate-400 leading-relaxed">
          Set <code>AZURE_OPENAI_VIDEO_DEPLOYMENT</code> in <code>.env.local</code> to a Sora
          deployment in a supported region (e.g., East US 2, Sweden Central) to
          enable motion generation. The rest of the workspace runs without it.
        </div>
      </div>
    );
  }

  if (video.status === "succeeded" && video.dataUrl) {
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
            controls
            autoPlay
            loop
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2">
          <a href={video.dataUrl} download={`${tenant.prompts.videoDownloadStem}-motion-concept.mp4`}>
            <Button size="sm" variant="secondary">
              <Download className="h-3.5 w-3.5" />
              Download MP4
            </Button>
          </a>
          <Button size="sm" className="ml-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            Request review
          </Button>
        </div>
      </div>
    );
  }

  if (video.status === "failed") {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" />
          Video generation failed
        </div>
        <div className="mt-1 text-red-100/90 text-xs">
          {video.error ??
            "The Sora endpoint returned an error. Check the deployment + region in Azure Foundry."}
        </div>
      </div>
    );
  }

  if (
    video.status === "submitting" ||
    video.status === "queued" ||
    video.status === "preprocessing" ||
    video.status === "running"
  ) {
    return (
      <div className="space-y-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950",
            aspectClass,
          )}
        >
          <div className="absolute inset-0 bg-grid-faint bg-[length:32px_32px] opacity-30" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-rose-300 animate-spin mx-auto" />
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-200/90">
                {video.status === "submitting" ? "Submitting" : video.status}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Sora jobs typically complete in 30s – 3 min.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // idle, available
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
          <Video className="h-6 w-6 text-rose-300 mx-auto" />
          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-200/90">
            Ready
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tap “Generate video concept” to ship a Sora job.
          </div>
        </div>
      </div>
    </div>
  );
}
