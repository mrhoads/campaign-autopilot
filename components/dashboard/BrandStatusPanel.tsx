"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/lib/tenants/context";

const META = {
  ok: { icon: CheckCircle2, color: "text-emerald-400", variant: "success" as const },
  warn: { icon: AlertTriangle, color: "text-amber-300", variant: "warning" as const },
  review: { icon: ShieldCheck, color: "text-sky-300", variant: "info" as const },
  pending: { icon: Clock, color: "text-slate-300", variant: "secondary" as const },
};

export function BrandStatusPanel() {
  const { tenant } = useTenant();
  const items = tenant.content.brandPulse;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
            Brand rule pulse
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            Trust &amp; control center
          </div>
        </div>
        <Badge variant="success">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulseGlow" />
          Live
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item, idx) => {
          const M = META[item.status];
          const Icon = M.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className={`grid place-items-center h-7 w-7 rounded-lg bg-white/[0.04] ring-1 ring-white/10 ${M.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.detail}</div>
              </div>
              <Badge variant={M.variant} className="capitalize">
                {item.status === "ok"
                  ? "Passing"
                  : item.status === "warn"
                    ? "Warning"
                    : item.status === "review"
                      ? "Routed"
                      : "Pending"}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
