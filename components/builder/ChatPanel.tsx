"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Wand2 } from "lucide-react";
import type { ChatMessage, CampaignBrief } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  pending: boolean;
  suggestions: string[];
  onSend: (text: string) => void;
  brief: CampaignBrief;
}

export function ChatPanel({
  messages,
  pending,
  suggestions,
  onSend,
  brief,
}: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const handleSubmit = (text: string) => {
    const value = text.trim();
    if (!value || pending) return;
    onSend(value);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center ring-1 ring-white/20 shadow-glow">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="absolute inset-0 rounded-xl bg-aurora opacity-50" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">
            Campaign Orchestrator
          </div>
          <div className="text-[11px] text-slate-400">
            Foundry agent · streams brief patches as you chat
          </div>
        </div>
        <Badge variant="success">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulseGlow" />
          Connected
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="px-5 py-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {pending && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <BubbleAvatar role="assistant" />
                <div className="rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-slate-200 inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-300" />
                  <span className="text-slate-300">Drafting brief updates…</span>
                  <div className="flex gap-1 ml-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-brand-300/80"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.18,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="border-t border-white/5 p-4 space-y-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSubmit(s)}
                disabled={pending}
                className="text-xs rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 px-3 py-1 transition-colors disabled:opacity-40"
              >
                <Wand2 className="h-3 w-3 inline mr-1 text-brand-300" />
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="relative"
        >
          <div className="relative rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-brand-400/60 focus-within:ring-2 focus-within:ring-brand-400/20 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(input);
                }
              }}
              rows={2}
              placeholder={`Ask the agent to refine "${brief.title}" — e.g., add a teen driver angle, swap the launch window, or generate a creative brief snapshot.`}
              className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-2 right-2 h-9 w-9"
              disabled={pending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Press <kbd className="px-1 rounded bg-white/5 border border-white/10">Enter</kbd> to send · <kbd className="px-1 rounded bg-white/5 border border-white/10">Shift+Enter</kbd> for new line
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <BubbleAvatar role={message.role} />
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-soft border",
            isUser
              ? "bg-gradient-to-b from-brand-500 to-brand-700 text-white border-brand-400/30 rounded-br-md"
              : "bg-white/[0.05] text-slate-100 border-white/10 rounded-bl-md",
          )}
        >
          <MarkdownLite text={message.content} />
        </div>
        {message.briefPatchSummary && message.briefPatchSummary.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.briefPatchSummary.map((p, i) => (
              <Badge key={i} variant="info">
                {p}
              </Badge>
            ))}
          </div>
        )}
        <div
          className={cn(
            "mt-1 text-[10px] text-slate-500",
            isUser ? "text-right" : "text-left",
          )}
        >
          {formatRelativeTime(message.timestampIso)}
        </div>
      </div>
    </motion.div>
  );
}

function BubbleAvatar({ role }: { role: ChatMessage["role"] }) {
  if (role === "user") {
    return (
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 grid place-items-center text-[11px] font-semibold text-slate-900 ring-1 ring-white/20">
        JP
      </div>
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center ring-1 ring-white/20 shadow-glow relative overflow-hidden">
      <Sparkles className="h-3.5 w-3.5 text-white relative" />
      <span className="absolute inset-0 bg-aurora opacity-50" />
    </div>
  );
}

/** Tiny markdown subset: **bold** and line breaks. */
function MarkdownLite({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {parts.map((line, i) => {
        const segments = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {segments.map((seg, j) =>
              seg.startsWith("**") && seg.endsWith("**") ? (
                <strong key={j} className="font-semibold text-white">
                  {seg.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{seg}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
