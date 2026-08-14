"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  icon: LucideIcon;
  accent?: "brand" | "amber" | "rose" | "emerald";
}

const ACCENTS = {
  brand: "from-brand-500/40 via-brand-700/10 to-transparent text-brand-100",
  amber: "from-amber-500/40 via-amber-700/10 to-transparent text-amber-100",
  rose: "from-rose-500/40 via-rose-700/10 to-transparent text-rose-100",
  emerald:
    "from-emerald-500/40 via-emerald-700/10 to-transparent text-emerald-100",
};

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "brand",
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-md"
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-50 bg-gradient-to-br",
          ACCENTS[accent].split(" ").slice(0, 3).join(" "),
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
          {label}
        </div>
        <div
          className={cn(
            "h-8 w-8 rounded-lg grid place-items-center ring-1 ring-white/10 bg-gradient-to-br",
            ACCENTS[accent],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-3 flex items-baseline gap-2">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold text-white tracking-tight"
        >
          {value}
        </motion.div>
        {delta && (
          <Badge
            variant={
              delta.trend === "up"
                ? "success"
                : delta.trend === "down"
                  ? "warning"
                  : "secondary"
            }
            className="ml-1"
          >
            {delta.trend === "up" ? "▲" : delta.trend === "down" ? "▼" : "—"}{" "}
            {delta.value}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
