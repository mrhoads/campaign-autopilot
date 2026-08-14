"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  History,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { ApprovalPackage } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { approvalWorkflow } from "@/lib/services";
import { formatRelativeTime, cn } from "@/lib/utils";

export function ApprovalCenter({
  initialPackages,
}: {
  initialPackages: ApprovalPackage[];
}) {
  const [packages, setPackages] = React.useState(initialPackages);
  const [selectedId, setSelectedId] = React.useState(initialPackages[0]?.id);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const selected = packages.find((p) => p.id === selectedId) ?? packages[0];

  const submitDecision = async (decision: "approve" | "request_changes") => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await approvalWorkflow.recordDecision(
        selected.id,
        "Renee Olson",
        decision,
        comment ||
          (decision === "approve"
            ? "Looks good — approved."
            : "Please address the noted updates."),
      );
      if (updated) {
        setPackages((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        setComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Approval center"
        title="Review & sign off"
        description="Every package carries validation, content, and creative status in one place. Approve, request changes, or open the timeline for context."
        actions={
          <>
            <Badge variant="info">
              <ShieldCheck className="h-3 w-3" />
              {packages.length} package{packages.length === 1 ? "" : "s"} in queue
            </Badge>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6 grid gap-6 lg:grid-cols-[1fr_1.8fr]">
        <div className="space-y-3">
          {packages.map((pkg, i) => (
            <PackageRow
              key={pkg.id}
              pkg={pkg}
              selected={pkg.id === selectedId}
              onSelect={() => setSelectedId(pkg.id)}
              delay={i * 0.04}
            />
          ))}
        </div>

        {selected && (
          <PackageDetail
            pkg={selected}
            comment={comment}
            onCommentChange={setComment}
            onDecision={submitDecision}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

function PackageRow({
  pkg,
  selected,
  onSelect,
  delay,
}: {
  pkg: ApprovalPackage;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const statusTone =
    pkg.status === "approved"
      ? "success"
      : pkg.status === "changes_requested"
        ? "warning"
        : pkg.status === "in_review"
          ? "info"
          : "secondary";

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onSelect}
      className={cn(
        "w-full text-left relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition-all",
        selected
          ? "border-brand-400/60 bg-white/[0.05] shadow-glow"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
      )}
    >
      {selected && (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-gradient-to-b from-brand-300 to-brand-500" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {pkg.campaignTitle}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Submitted by {pkg.submittedBy} · {formatRelativeTime(pkg.submittedAtIso)}
          </div>
        </div>
        <Badge variant={statusTone}>
          {pkg.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric
          label="Score"
          value={pkg.validationSummary.score}
          tone={pkg.validationSummary.score >= 90 ? "success" : "warning"}
        />
        <Metric
          label="Blockers"
          value={pkg.validationSummary.blockers}
          tone={pkg.validationSummary.blockers === 0 ? "success" : "danger"}
        />
        <Metric
          label="Warnings"
          value={pkg.validationSummary.warnings}
          tone={pkg.validationSummary.warnings === 0 ? "success" : "warning"}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <Sparkles className="h-3 w-3 text-brand-300" />
        {pkg.contentVariantIds.length} content variant
        {pkg.contentVariantIds.length === 1 ? "" : "s"} ·{" "}
        {pkg.conceptIds.length} concept
        {pkg.conceptIds.length === 1 ? "" : "s"}
      </div>
    </motion.button>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-sm font-semibold",
          tone === "success" && "text-emerald-300",
          tone === "warning" && "text-amber-300",
          tone === "danger" && "text-red-300",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PackageDetail({
  pkg,
  comment,
  onCommentChange,
  onDecision,
  submitting,
}: {
  pkg: ApprovalPackage;
  comment: string;
  onCommentChange: (v: string) => void;
  onDecision: (d: "approve" | "request_changes") => void;
  submitting: boolean;
}) {
  return (
    <motion.div
      key={pkg.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
              Package
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {pkg.campaignTitle}
            </h3>
            <div className="mt-1 text-xs text-slate-400">
              Submitted by {pkg.submittedBy} · {formatRelativeTime(pkg.submittedAtIso)}
            </div>
          </div>
          <Badge
            variant={
              pkg.status === "approved"
                ? "success"
                : pkg.status === "changes_requested"
                  ? "warning"
                  : "info"
            }
            className="capitalize"
          >
            {pkg.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <DetailStat
            label="Validation score"
            value={pkg.validationSummary.score.toString()}
            sub={`${pkg.validationSummary.blockers} blockers · ${pkg.validationSummary.warnings} warnings`}
            tone="brand"
          />
          <DetailStat
            label="Content variants"
            value={pkg.contentVariantIds.length.toString()}
            sub={`${pkg.conceptIds.length} visual concepts attached`}
            tone="amber"
          />
          <DetailStat
            label="Reviewers"
            value={pkg.reviewers.length.toString()}
            sub={`${pkg.reviewers.filter((r) => r.decision === "approve").length} approved`}
            tone="emerald"
          />
        </div>
      </div>

      {/* Reviewers */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
        <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
          Reviewers
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {pkg.reviewers.map((r) => (
            <div
              key={r.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 flex items-center justify-between"
            >
              <div>
                <div className="text-sm text-white">{r.name}</div>
                <div className="text-[11px] text-slate-400">{r.role}</div>
              </div>
              <Badge
                variant={
                  r.decision === "approve"
                    ? "success"
                    : r.decision === "request_changes"
                      ? "warning"
                      : "secondary"
                }
              >
                {r.decision === "approve"
                  ? "Approved"
                  : r.decision === "request_changes"
                    ? "Requested changes"
                    : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-300" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
            Reviewer comments
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {pkg.comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">
                  {c.author}
                  <span className="ml-2 text-[11px] text-slate-400 font-normal">
                    {c.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatRelativeTime(c.timestampIso)}
                </div>
              </div>
              <div className="mt-1 text-sm text-slate-200">{c.message}</div>
              {c.decision && (
                <div className="mt-1.5">
                  <Badge
                    variant={
                      c.decision === "approve"
                        ? "success"
                        : c.decision === "request_changes"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {c.decision.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            placeholder="Add a reviewer note — context, requested edits, or rationale for sign-off."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="success"
              onClick={() => onDecision("approve")}
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDecision("request_changes")}
              disabled={submitting}
            >
              <XCircle className="h-4 w-4" />
              Request changes
            </Button>
            <Button variant="secondary" className="ml-auto" disabled={submitting}>
              <Send className="h-4 w-4" />
              Comment only
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand-300" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
            History
          </div>
        </div>
        <ol className="mt-4 relative border-l border-white/10 pl-4 space-y-4">
          {pkg.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 ring-2 ring-slate-950" />
              <div className="text-sm text-white">{h.label}</div>
              <div className="text-[11px] text-slate-400">
                {new Date(h.timestampIso).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-300">{h.description}</div>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}

function DetailStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "amber" | "emerald";
}) {
  const accents = {
    brand: "from-brand-500/30",
    amber: "from-amber-500/30",
    emerald: "from-emerald-500/30",
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div
        className={cn(
          "absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl bg-gradient-to-br to-transparent opacity-50",
          accents[tone],
        )}
      />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
        <div className="mt-1 text-[11px] text-slate-400">{sub}</div>
      </div>
    </div>
  );
}
