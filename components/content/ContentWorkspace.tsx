"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  RefreshCw,
  Save,
  Send,
  Pin,
  PinOff,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { CampaignBrief, CampaignChannel, ContentVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { contentGenerator } from "@/lib/services";
import { generateId } from "@/lib/utils";

const TABS: { value: CampaignChannel | "Creative Brief"; label: string }[] = [
  { value: "Email", label: "Email" },
  { value: "Paid Social", label: "Paid Social" },
  { value: "Landing Page", label: "Landing Page" },
  { value: "Display Ads", label: "Display Ads" },
  { value: "SMS", label: "SMS" },
  { value: "Creative Brief", label: "Creative Brief" },
];

export function ContentWorkspace({
  initialVariants,
  brief,
}: {
  initialVariants: ContentVariant[];
  brief: CampaignBrief;
}) {
  const [variants, setVariants] = React.useState<ContentVariant[]>(initialVariants);
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const regenerate = async (channel: CampaignChannel | "Creative Brief") => {
    const targetChannel = channel === "Creative Brief" ? "Email" : channel;
    setGenerating(channel);
    try {
      const v = await contentGenerator.generateVariant(
        brief,
        targetChannel,
        Math.floor(Math.random() * 5),
      );
      // Mark as creative brief variant if channel is creative brief
      const labelled =
        channel === "Creative Brief"
          ? { ...v, label: "Creative Brief • Refreshed", id: generateId("cv") }
          : v;
      setVariants((prev) => [labelled, ...prev]);
    } finally {
      setGenerating(null);
    }
  };

  const togglePin = (id: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, pinned: !v.pinned } : v)),
    );
  };

  const copyText = async (variant: ContentVariant) => {
    const text = [variant.headline, variant.subheadline, variant.body, `CTA: ${variant.cta}`]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(variant.id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {
      /* clipboard not available — silent in demo */
    }
  };

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Content workspace"
        title="Generate, refine, and pin your channel variants"
        description="Every variant carries audience and compliance notes so reviewers see context — not just copy. Pin the ones that survive review and regenerate the rest."
        actions={
          <>
            <Badge variant="info">
              <Sparkles className="h-3 w-3" />
              {brief.title}
            </Badge>
            <Button>
              <Send className="h-4 w-4" />
              Send package to approval
            </Button>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6">
        <Tabs defaultValue="Email">
          <TabsList className="flex flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => {
            const channelVariants =
              t.value === "Creative Brief"
                ? variants.filter((v) =>
                    v.label.toLowerCase().includes("creative brief"),
                  )
                : variants.filter((v) => v.channel === t.value);

            return (
              <TabsContent key={t.value} value={t.value}>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
                      {t.label} variants
                    </div>
                    <div className="text-xs text-slate-400">
                      {channelVariants.length} variant
                      {channelVariants.length === 1 ? "" : "s"} · regenerate to add more
                    </div>
                  </div>
                  <Button
                    onClick={() => regenerate(t.value)}
                    variant="secondary"
                    disabled={generating === t.value}
                  >
                    {generating === t.value ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Regenerate {t.label}
                  </Button>
                </div>

                <AnimatePresence>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {channelVariants.length === 0 && (
                      <EmptyChannel
                        label={t.label}
                        onGenerate={() => regenerate(t.value)}
                        loading={generating === t.value}
                      />
                    )}
                    {channelVariants.map((v, i) => (
                      <motion.div
                        layout
                        key={v.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.04 }}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md"
                      >
                        {v.pinned && (
                          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              {v.label}
                            </div>
                            <div className="mt-1 text-lg font-semibold text-white leading-snug">
                              {v.headline}
                            </div>
                            {v.subheadline && (
                              <div className="mt-1 text-sm text-slate-300">
                                {v.subheadline}
                              </div>
                            )}
                          </div>
                          <Badge variant={v.pinned ? "warning" : "secondary"}>
                            {v.tone}
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                          {v.body}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="info">CTA · {v.cta}</Badge>
                          <Badge variant="secondary">{v.channel}</Badge>
                        </div>

                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              Audience note
                            </div>
                            <div className="mt-0.5 text-xs text-slate-200">
                              {v.audienceNote}
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-amber-200/80">
                              <ShieldCheck className="h-3 w-3" />
                              Compliance note
                            </div>
                            <div className="mt-0.5 text-xs text-slate-200">
                              {v.complianceNote}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyText(v)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedId === v.id ? "Copied" : "Copy"}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Save className="h-3.5 w-3.5" />
                            Save draft
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePin(v.id)}
                          >
                            {v.pinned ? (
                              <>
                                <PinOff className="h-3.5 w-3.5" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5" />
                                Pin
                              </>
                            )}
                          </Button>
                          <Button size="sm" className="ml-auto">
                            <Send className="h-3.5 w-3.5" />
                            Send to approval
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

function EmptyChannel({
  label,
  onGenerate,
  loading,
}: {
  label: string;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 grid place-items-center text-center">
      <Sparkles className="h-6 w-6 text-brand-300" />
      <div className="mt-2 text-sm text-white font-medium">
        No {label.toLowerCase()} variants yet
      </div>
      <div className="mt-1 text-xs text-slate-400 max-w-sm">
        Generate a first pass against the current brief. Variants come with
        audience and compliance notes attached.
      </div>
      <Button className="mt-4" onClick={onGenerate} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generate {label}
      </Button>
    </div>
  );
}
