"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  FileText,
  Wand2,
  CheckSquare,
  BookOpenCheck,
  Settings2,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/lib/tenants/context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PRIMARY: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Auto-Pilot", href: "/auto", icon: Rocket, badge: "New" },
  { label: "Campaign Builder", href: "/builder", icon: Sparkles, badge: "Agent" },
  { label: "Validation", href: "/validation", icon: ShieldCheck },
  { label: "Content Workspace", href: "/content", icon: FileText },
  { label: "Visual Concepts", href: "/creative", icon: Wand2, badge: "MCP" },
  { label: "Approval Center", href: "/approvals", icon: CheckSquare, badge: "3" },
];

const SECONDARY: NavItem[] = [
  { label: "Brand Rule Library", href: "/validation?tab=rules", icon: BookOpenCheck },
  { label: "Workspace Settings", href: "/settings", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenant } = useTenant();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/80 backdrop-blur-xl">
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow ring-1 ring-white/20 grid place-items-center overflow-hidden">
            <span className="absolute inset-0 bg-aurora opacity-50" />
            <Sparkles className="relative h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              {tenant.sidebarLabel}
            </div>
            <div className="text-sm font-semibold text-white">
              Campaign Agent
            </div>
          </div>
        </Link>
      </div>

      <div className="px-3 mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Workspace
      </div>
      <nav className="flex-1 px-2 mt-2 space-y-1 overflow-y-auto">
        {PRIMARY.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href.split("?")[0]);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/[0.06] text-white shadow-soft"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-gradient-to-b from-brand-300 to-brand-500"
                  />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-brand-200" : "text-slate-400 group-hover:text-slate-200",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant={
                      item.badge === "Agent"
                        ? "info"
                        : item.badge === "MCP"
                          ? "warning"
                          : item.badge === "New"
                            ? "success"
                            : "default"
                    }
                    className="text-[10px] py-0 px-1.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </motion.div>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/5">
          <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Governance
          </div>
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="m-3 rounded-xl border border-white/10 bg-gradient-to-br from-brand-700/30 via-brand-900/30 to-slate-900/30 p-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-400/30 blur-3xl animate-pulseGlow" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-200/90">
            Foundry Status
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            Orchestrator online
          </div>
          <div className="mt-0.5 text-[11px] text-slate-300">
            3 agents · 4 MCP tools · low latency
          </div>
        </div>
      </div>
    </aside>
  );
}
