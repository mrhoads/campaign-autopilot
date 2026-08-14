"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/lib/tenants/context";

/**
 * Demo customer switcher.
 *
 * Lets the presenter re-skin the entire workspace for a specific customer
 * (brand name, voice, mascot policy, seed content, compliance posture). The
 * choice persists across refreshes via the tenant context.
 */
export function TenantSwitcher() {
  const { tenant, tenants, setTenantId } = useTenant();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 h-9 text-slate-100 hover:border-white/20 hover:bg-white/[0.07] transition-all"
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand-400 to-brand-700 ring-1 ring-white/20">
          <Building2 className="h-3 w-3 text-white" />
        </span>
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {tenant.name}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 p-1.5 shadow-glow-lg backdrop-blur-xl"
          >
            <li className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Switch demo customer
            </li>
            {tenants.map((t) => {
              const active = t.id === tenant.id;
              return (
                <li key={t.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      setTenantId(t.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-white/[0.07]" : "hover:bg-white/[0.05]",
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand-400 to-brand-700 ring-1 ring-white/20 text-[11px] font-semibold text-white">
                      {t.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white truncate">
                        {t.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate">
                        {t.tagline}
                      </span>
                    </span>
                    {active && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
