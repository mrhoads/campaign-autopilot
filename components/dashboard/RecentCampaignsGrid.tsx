"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { RecentCampaignSummary } from "@/types";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export function RecentCampaignsGrid({
  campaigns,
}: {
  campaigns: RecentCampaignSummary[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.35, ease: "easeOut" }}
          whileHover={{ y: -3 }}
        >
          <Link
            href={`/builder?campaign=${c.id}`}
            className="group block h-full"
          >
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-md transition-all hover:border-white/20 hover:shadow-glow">
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {c.productLine}
                  </div>
                  <div className="mt-1 text-base font-semibold text-white leading-snug line-clamp-2">
                    {c.title}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-brand-200 transition-colors" />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.channels.slice(0, 4).map((ch) => (
                  <Badge key={ch} variant="secondary">
                    {ch}
                  </Badge>
                ))}
                {c.channels.length > 4 && (
                  <Badge variant="outline">+{c.channels.length - 4}</Badge>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <StatusPill status={c.status} />
                <div className="ml-auto text-[11px] text-slate-400">
                  Updated {formatRelativeTime(c.updatedAtIso)}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Validation
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-28 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 via-sky-400 to-emerald-400 transition-all"
                        style={{ width: `${c.validationScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-medium">
                      {c.validationScore}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Owner
                  </div>
                  <div className="mt-1 text-xs text-slate-200">{c.owner}</div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
