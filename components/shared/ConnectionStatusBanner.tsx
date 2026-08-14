"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Sparkles, Cable } from "lucide-react";
import {
  getClientCapabilities,
  type ClientCapabilities,
} from "@/lib/services/status";
import { Badge } from "@/components/ui/badge";

/**
 * Compact strip that reflects which Azure deployments are wired up.
 *
 * Hidden entirely when everything is connected, surfaced as an amber strip
 * when any provider is missing so the marketer (and CMO) can see at a glance
 * which capability would fall back to mocks.
 */
export function ConnectionStatusBanner() {
  const [caps, setCaps] = React.useState<ClientCapabilities | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getClientCapabilities(true).then((c) => mounted && setCaps(c));
    return () => {
      mounted = false;
    };
  }, []);

  if (!caps) return null;

  const allReady = caps.chat && caps.image && caps.video;
  const noneReady = !caps.chat && !caps.image && !caps.video;

  if (allReady) {
    return (
      <div className="px-4 md:px-6 lg:px-8 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-100"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          <span className="font-medium">All AI services live</span>
          <span className="text-emerald-100/70">·</span>
          <span className="text-emerald-100/80">
            Chat <code className="text-emerald-200">{caps.chatDeployment}</code> ·
            Image <code className="text-emerald-200">{caps.imageDeployment}</code> ·
            Video <code className="text-emerald-200">{caps.videoDeployment}</code>
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100"
      >
        {noneReady ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-medium">Demo mode</span>
            <span className="text-amber-100/80">
              · No Azure deployments configured. All AI calls fall back to
              curated mocks. Add deployments to <code>.env.local</code> to go
              live.
            </span>
          </>
        ) : (
          <>
            <Cable className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-medium">Partial connectivity</span>
            <CapBadge label="Chat" on={caps.chat} dep={caps.chatDeployment} />
            <CapBadge label="Image" on={caps.image} dep={caps.imageDeployment} />
            <CapBadge label="Video" on={caps.video} dep={caps.videoDeployment} />
            <span className="text-amber-100/70">
              · Off services use mock fallbacks.
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
}

function CapBadge({
  label,
  on,
  dep,
}: {
  label: string;
  on: boolean;
  dep: string | null;
}) {
  return (
    <Badge variant={on ? "success" : "warning"} className="ml-1">
      <Sparkles className="h-2.5 w-2.5" />
      {label} {on ? `· ${dep}` : "off"}
    </Badge>
  );
}
