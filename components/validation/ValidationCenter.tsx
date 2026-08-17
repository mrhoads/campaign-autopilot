"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import type {
  BrandRule,
  ValidationFinding,
  ValidationResult,
  ValidationSeverity,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { brandValidator } from "@/lib/services";
import { useTenant } from "@/lib/tenants/context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  ValidationSeverity,
  { label: string; tone: "success" | "warning" | "danger" | "info"; Icon: typeof CheckCircle2 }
> = {
  passed: { label: "Passed", tone: "success", Icon: CheckCircle2 },
  info: { label: "Info", tone: "info", Icon: Info },
  warning: { label: "Warning", tone: "warning", Icon: AlertTriangle },
  approval_required: { label: "Approval required", tone: "info", Icon: ShieldCheck },
  blocker: { label: "Blocker", tone: "danger", Icon: XCircle },
};

export function ValidationCenter({
  initialResult,
  rules,
}: {
  initialResult: ValidationResult;
  rules: BrandRule[];
}) {
  const [result, setResult] = React.useState(initialResult);
  const [running, setRunning] = React.useState(false);
  const { tenant } = useTenant();

  const rerun = async () => {
    setRunning(true);
    try {
      const next = await brandValidator.validateBrief(tenant.content.primaryBrief);
      setResult(next);
    } finally {
      setRunning(false);
    }
  };

  const counts = countSeverities(result.findings);

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Brand & compliance"
        title="Validation control center"
        description="Findings are grounded in the active brand rule library and the live campaign brief. Re-run anytime to refresh against the latest brief state."
        actions={
          <>
            <Badge variant="info">
              <Sparkles className="h-3 w-3" />
              Labor Day Auto · Brief
            </Badge>
            <Button onClick={rerun} disabled={running}>
              <PlayCircle className="h-4 w-4" />
              {running ? "Re-running…" : "Re-run validation"}
            </Button>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <ScoreCard score={result.score} status={result.overallStatus} />
          <CountCard
            label="Findings"
            stats={[
              { key: "Passed", count: counts.passed, tone: "success" },
              { key: "Warnings", count: counts.warning, tone: "warning" },
              { key: "Blockers", count: counts.blocker, tone: "danger" },
              { key: "Info", count: counts.info, tone: "info" },
            ]}
          />
          <ApprovalsCard approvals={result.approvalsRequired} />
        </div>

        <Tabs defaultValue="findings">
          <TabsList>
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="rules">Rule library</TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <div className="grid gap-3">
              {result.findings.map((f, i) => (
                <FindingRow key={f.id} finding={f} delay={i * 0.03} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules">
            <div className="grid gap-3 md:grid-cols-2">
              {rules.map((r, i) => (
                <RuleCard key={r.id} rule={r} delay={i * 0.03} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function countSeverities(findings: ValidationFinding[]) {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    { passed: 0, warning: 0, blocker: 0, info: 0, approval_required: 0 } as Record<
      ValidationSeverity,
      number
    >,
  );
}

function ScoreCard({
  score,
  status,
}: {
  score: number;
  status: ValidationResult["overallStatus"];
}) {
  const tone =
    status === "ready"
      ? { ring: "ring-emerald-400/30", text: "text-emerald-300", glow: "from-emerald-500/30" }
      : status === "review_needed"
        ? { ring: "ring-amber-400/30", text: "text-amber-300", glow: "from-amber-500/30" }
        : { ring: "ring-red-400/30", text: "text-red-300", glow: "from-red-500/30" };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md")}>
      <div
        className={cn(
          "absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl bg-gradient-to-br",
          tone.glow,
          "to-transparent opacity-60",
        )}
      />
      <div className="relative flex items-center gap-5">
        <div
          className={cn(
            "relative h-24 w-24 rounded-full grid place-items-center ring-2",
            tone.ring,
          )}
          style={{
            background: `conic-gradient(rgba(99,130,255,0.9) ${score * 3.6}deg, rgba(255,255,255,0.06) 0)`,
          }}
        >
          <div className="absolute inset-1 rounded-full bg-slate-950 grid place-items-center">
            <div className="text-3xl font-semibold text-white">{score}</div>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Compliance score
          </div>
          <div className={cn("mt-1 text-lg font-semibold", tone.text)}>
            {status === "ready"
              ? "Ready for approval"
              : status === "review_needed"
                ? "Review needed"
                : "Blocked"}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Weighted across {7} active rules · last run just now
          </div>
        </div>
      </div>
    </div>
  );
}

function CountCard({
  label,
  stats,
}: {
  label: string;
  stats: { key: string; count: number; tone: "success" | "warning" | "danger" | "info" }[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.key}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">{s.key}</span>
              <Badge variant={s.tone}>{s.count}</Badge>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  s.tone === "success" && "bg-emerald-400",
                  s.tone === "warning" && "bg-amber-400",
                  s.tone === "danger" && "bg-red-400",
                  s.tone === "info" && "bg-sky-400",
                )}
                style={{ width: `${Math.min(100, s.count * 18)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalsCard({ approvals }: { approvals: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        Approvals required
      </div>
      <div className="mt-3 space-y-2">
        {approvals.length === 0 ? (
          <div className="text-sm text-slate-400">
            No outstanding approvals.
          </div>
        ) : (
          approvals.map((a) => (
            <div
              key={a}
              className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 flex items-center justify-between"
            >
              <span className="text-sm text-slate-100">{a}</span>
              <Badge variant="info">Routed</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FindingRow({
  finding,
  delay,
}: {
  finding: ValidationFinding;
  delay: number;
}) {
  const M = SEVERITY_META[finding.severity];
  const Icon = M.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-xl grid place-items-center ring-1 ring-white/10",
            M.tone === "success" && "bg-emerald-500/10 text-emerald-300",
            M.tone === "warning" && "bg-amber-500/10 text-amber-300",
            M.tone === "danger" && "bg-red-500/10 text-red-300",
            M.tone === "info" && "bg-sky-500/10 text-sky-300",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={M.tone}>{M.label}</Badge>
            <Badge variant="secondary" className="capitalize">
              {finding.category}
            </Badge>
            <Badge variant="outline" className="capitalize">
              confidence: {finding.confidence}
            </Badge>
            <div className="text-sm font-medium text-white">
              {finding.ruleTitle}
            </div>
          </div>
          <div className="mt-1 text-sm text-slate-300">{finding.message}</div>
          {finding.evidence && (
            <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
              <span className="text-slate-500 mr-2">Evidence:</span>
              {finding.evidence}
            </div>
          )}
          {finding.remediation && (
            <div className="mt-2 text-xs text-slate-300">
              <span className="text-brand-200 mr-1">Suggested fix:</span>
              {finding.remediation}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RuleCard({ rule, delay }: { rule: BrandRule; delay: number }) {
  const M = SEVERITY_META[rule.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="capitalize">
          {rule.category}
        </Badge>
        <Badge variant={M.tone}>{M.label}</Badge>
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{rule.title}</div>
      <div className="mt-1 text-xs text-slate-300 leading-relaxed">
        {rule.description}
      </div>
      {rule.remediation && (
        <div className="mt-2 text-[11px] text-slate-400">
          <span className="text-brand-200 mr-1">Remediation:</span>
          {rule.remediation}
        </div>
      )}
      {rule.demoPlaceholder && (
        <div className="mt-3">
          <Badge variant="outline" className="text-[10px]">
            Demo placeholder rule
          </Badge>
        </div>
      )}
    </motion.div>
  );
}
