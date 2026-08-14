"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  children,
  actions,
  className,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-md overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start gap-3 p-5 border-b border-white/5">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-brand-200/80">
            {title}
          </div>
          {description && (
            <div className="mt-1 text-sm text-slate-300">{description}</div>
          )}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
