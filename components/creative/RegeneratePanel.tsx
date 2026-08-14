"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Lightbulb, X, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Reusable regenerate panel.
 *
 * Fetches 1-3 short, on-brand adjustment suggestions from the creative-director
 * agent (rendered as clickable chips), plus a free-text box. Used by both the
 * Creative studio and the Auto-Pilot pipeline to re-roll a single image or the
 * video concept without disturbing the other assets.
 */
export function RegeneratePanel({
  kind,
  busy,
  accent = "brand",
  fetchSuggestions,
  onSubmit,
  onClose,
}: {
  kind: "image" | "video";
  busy: boolean;
  accent?: "brand" | "rose";
  fetchSuggestions: () => Promise<string[]>;
  onSubmit: (suggestion: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetchSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [fetchSuggestions]);

  const ring =
    accent === "rose"
      ? "border-rose-300/30 bg-rose-500/[0.06]"
      : "border-brand-300/30 bg-brand-500/[0.06]";
  const chip =
    accent === "rose"
      ? "border-rose-300/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
      : "border-brand-300/40 bg-brand-500/10 text-brand-100 hover:bg-brand-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("overflow-hidden rounded-xl border p-3 space-y-2.5", ring)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-300">
          <Lightbulb className="h-3 w-3" />
          Suggested adjustments
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Asking the creative director for ideas…
        </div>
      ) : suggestions.length ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              className={cn(
                "flex items-start gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug text-left transition-colors max-w-full",
                chip,
              )}
            >
              <span className="shrink-0 leading-snug">+</span>
              <span className="min-w-0">{s}</span>
            </button>
          ))}
        </div>
      ) : null}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Describe what to change (optional) — or tap a suggestion above. Leave blank to simply re-roll."
        className="text-xs"
      />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onSubmit(text)} disabled={busy}>
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Regenerate {kind === "video" ? "video" : "image"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
