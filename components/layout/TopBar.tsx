"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Bell, Sparkles, Command } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantSwitcher } from "@/components/layout/TenantSwitcher";
import { useTenant } from "@/lib/tenants/context";

export function TopBar() {
  const [query, setQuery] = React.useState("");
  const { tenant } = useTenant();
  const user = tenant.content.primaryUser;

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 md:px-6 lg:px-8 h-14">
        <div className="flex items-center gap-2.5 text-sm">
          <TenantSwitcher />
          <Badge variant="info">Demo</Badge>
        </div>

        <div className="ml-auto flex items-center gap-2 w-full max-w-xl">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns, briefs, rules, approvals…"
              className="w-full pl-9 pr-16 h-9 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-500">
              <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 flex items-center gap-0.5">
                <Command className="h-2.5 w-2.5" /> K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.div whileHover={{ scale: 1.04 }}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-300" />
              Ask the agent
            </Button>
          </motion.div>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
            <div className="text-right leading-tight hidden md:block">
              <div className="text-xs text-white">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.role}</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
