"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  FolderOpen,
  Wand2,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroPanel() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 shadow-glow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700/40 via-brand-900/30 to-slate-950" />
      <div className="absolute inset-0 bg-aurora opacity-60" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl animate-pulseGlow" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="absolute inset-0 bg-grid-faint bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] opacity-60" />

      <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 p-8 md:p-10">
        <div className="min-w-0">
          <Badge variant="info" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Marketing Operations · AI Workspace
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight"
          >
            From campaign idea to brand-validated, channel-ready package.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-3 max-w-xl text-slate-300"
          >
            Describe what you want to run. The agent drafts a structured brief
            alongside you, runs a brand &amp; compliance pass, generates
            channel-specific content, and routes visual concepts through the
            approved creative workflow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            <Link href="/auto">
              <Button size="lg" className="group">
                <Rocket className="h-4 w-4" />
                Run Auto-Pilot pipeline
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/builder">
              <Button size="lg" variant="secondary">
                <Sparkles className="h-4 w-4" />
                Start new campaign
              </Button>
            </Link>
            <Link href="/approvals">
              <Button size="lg" variant="outline">
                <CheckSquare className="h-4 w-4" />
                Review approvals
              </Button>
            </Link>
            <Link href="/validation">
              <Button size="lg" variant="ghost">
                <ShieldCheck className="h-4 w-4" />
                Brand rule status
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Mini live agent panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-2xl border border-white/15 bg-slate-950/60 p-5 backdrop-blur-xl shadow-soft overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulseGlow" />
            Agent online
          </div>
          <div className="mt-3 space-y-2.5">
            <AgentLine
              label="Orchestrator"
              text="Drafting brief from prompt"
              tone="brand"
            />
            <AgentLine
              label="Brand validator"
              text="Checking disclaimers & claims"
              tone="info"
            />
            <AgentLine
              label="Content generator"
              text="Composing channel variants"
              tone="amber"
            />
            <AgentLine
              label="MCP creative gateway"
              text="Lumen Studio • connected"
              tone="emerald"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5 text-brand-300" />
            <div className="text-xs text-slate-300">
              Foundry orchestration · 3 agents · 4 MCP tools
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AgentLine({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "brand" | "info" | "amber" | "emerald";
}) {
  const dot = {
    brand: "bg-brand-400",
    info: "bg-sky-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulseGlow`} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          {label}
        </div>
        <div className="text-xs text-slate-100 truncate">{text}</div>
      </div>
      <span className="text-[10px] text-slate-500">live</span>
    </div>
  );
}
