"use client";

import { motion } from "framer-motion";
import {
  Target,
  Users,
  MessageSquareQuote,
  Megaphone,
  MousePointerClick,
  CalendarClock,
  Gauge,
  AlertTriangle,
  FileWarning,
  Sparkles,
} from "lucide-react";
import type { CampaignBrief } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatLongDate } from "@/lib/utils";

export function BriefPanel({ brief }: { brief: CampaignBrief }) {
  const completenessPct = Math.round(brief.completeness * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-soft backdrop-blur-md">
      <div className="px-5 py-4 border-b border-white/5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="info">
              <Sparkles className="h-3 w-3" />
              Live brief
            </Badge>
            <StatusPill status={brief.status} />
          </div>
          <h2 className="mt-2 text-lg font-semibold text-white tracking-tight leading-tight">
            {brief.title}
          </h2>
          <div className="mt-1 text-xs text-slate-400">
            {brief.productLine} · last updated {new Date(brief.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="text-right w-44">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
            Completeness
          </div>
          <Progress value={completenessPct} />
          <div className="mt-1 text-xs text-slate-300">{completenessPct}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <SectionCard
          title="Campaign objective"
          delay={0}
          actions={<Target className="h-4 w-4 text-brand-300" />}
        >
          <p className="text-sm text-slate-200 leading-relaxed">
            {brief.objective}
          </p>
        </SectionCard>

        <SectionCard
          title="Target audience"
          delay={0.04}
          actions={<Users className="h-4 w-4 text-brand-300" />}
        >
          <div className="grid gap-2">
            {brief.audiences.map((a) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-white">
                    {a.label}
                  </div>
                  {a.estimatedReach && (
                    <Badge variant="secondary">~{a.estimatedReach}</Badge>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {a.description}
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Key messages"
          delay={0.08}
          actions={<MessageSquareQuote className="h-4 w-4 text-brand-300" />}
        >
          <ul className="space-y-2.5">
            {brief.keyMessages.map((m, i) => (
              <li key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="text-sm text-white">{m.headline}</div>
                <div className="mt-1 text-xs text-slate-400">{m.rationale}</div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard
            title="Channels"
            delay={0.12}
            actions={<Megaphone className="h-4 w-4 text-brand-300" />}
          >
            <div className="flex flex-wrap gap-1.5">
              {brief.channels.map((c) => (
                <Badge key={c} variant="default">
                  {c}
                </Badge>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="CTA options"
            delay={0.14}
            actions={<MousePointerClick className="h-4 w-4 text-brand-300" />}
          >
            <ul className="space-y-1.5">
              {brief.ctaOptions.map((cta) => (
                <li
                  key={cta.label}
                  className="flex items-center justify-between text-sm rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-white">{cta.label}</span>
                  <span className="text-[11px] text-slate-400">
                    {cta.destination}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard
          title="Timeline"
          delay={0.16}
          actions={<CalendarClock className="h-4 w-4 text-brand-300" />}
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Kickoff", date: brief.timeline.kickoff },
              { label: "Launch", date: brief.timeline.launch },
              { label: "Wrap", date: brief.timeline.wrap },
            ].map((t, i) => (
              <div
                key={t.label}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {t.label}
                </div>
                <div className="mt-1 text-sm text-white">
                  {formatLongDate(t.date)}
                </div>
                {i === 1 && (
                  <Badge variant="info" className="mt-1.5">
                    Pinned
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="KPIs"
          delay={0.18}
          actions={<Gauge className="h-4 w-4 text-brand-300" />}
        >
          <div className="grid gap-2 md:grid-cols-2">
            {brief.kpis.map((k) => (
              <div
                key={k.name}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {k.name}
                </div>
                <div className="mt-1 text-sm text-white">{k.target}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {k.rationale}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Risks"
          delay={0.2}
          actions={<AlertTriangle className="h-4 w-4 text-amber-300" />}
        >
          <ul className="space-y-2">
            {brief.risks.map((r) => (
              <li
                key={r.title}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.severity === "high"
                        ? "danger"
                        : r.severity === "medium"
                          ? "warning"
                          : "info"
                    }
                  >
                    {r.severity}
                  </Badge>
                  <div className="text-sm font-medium text-white">
                    {r.title}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {r.mitigation}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Required disclaimers"
          delay={0.22}
          actions={<FileWarning className="h-4 w-4 text-brand-300" />}
        >
          <ul className="space-y-1.5">
            {brief.requiredDisclaimers.map((d, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-300"
              >
                {d}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Notes for creative team" delay={0.24}>
          <ul className="space-y-1.5">
            {brief.creativeNotes.map((n, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
              >
                {n}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
