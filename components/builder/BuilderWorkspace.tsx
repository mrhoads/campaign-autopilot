"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Wand2,
  FileText,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { BriefPanel } from "@/components/builder/BriefPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { campaignOrchestrator } from "@/lib/services";
import type { CampaignBrief, ChatMessage } from "@/types";
import { generateId } from "@/lib/utils";
import { useTenant } from "@/lib/tenants/context";

export function BuilderWorkspace({
  initialBrief,
}: {
  initialBrief: CampaignBrief;
}) {
  const { tenant } = useTenant();
  const [brief, setBrief] = React.useState<CampaignBrief>(initialBrief);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    campaignOrchestrator.welcomeMessage(),
    {
      id: generateId("msg"),
      role: "user",
      content: tenant.prompts.builderSample,
      timestampIso: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    },
    {
      id: generateId("msg"),
      role: "assistant",
      content: `Drafted a working brief for **${initialBrief.title}**. I leaned the tone toward a modern, brand-safe direction and pinned the launch to the campaign window. Three things I'd like to confirm:\n\n• Should we include SMS for opt-in audiences, or keep it to email + social + landing?\n• Are we okay routing visual concepts through the approved creative workflow (no generative restricted-asset art)?\n• Any state-level restrictions I should account for?`,
      timestampIso: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      briefPatchSummary: [
        "Drafted brief skeleton",
        "Pinned launch to the campaign window",
        "Reinforced brand-safe creative guidance",
      ],
    },
  ]);
  const [pending, setPending] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([
    "Add SMS for opt-in audiences",
    "Route visual concepts through approved workflow",
    "Lean more young professional",
  ]);

  const handleSend = async (text: string) => {
    const userMessage: ChatMessage = {
      id: generateId("msg"),
      role: "user",
      content: text,
      timestampIso: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setPending(true);
    try {
      const turn = await campaignOrchestrator.sendMessage(
        nextHistory,
        text,
        brief,
      );
      if (turn.briefPatch) {
        setBrief((prev) => ({
          ...prev,
          ...turn.briefPatch,
          completeness: Math.min(1, prev.completeness + 0.04),
          updatedAt: new Date().toISOString(),
        }));
      }
      setMessages((prev) => [...prev, turn.reply]);
      if (turn.followUpSuggestions) {
        setSuggestions(turn.followUpSuggestions);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Campaign Builder"
        title={brief.title}
        description="Chat with the orchestrator on the left. Your brief assembles itself on the right. When you're ready, hand off to validation, content, or creative."
        actions={
          <>
            <Badge variant="info">
              <Wand2 className="h-3 w-3" />
              Foundry orchestration
            </Badge>
            <Link href="/validation">
              <Button variant="secondary">
                <ShieldCheck className="h-4 w-4" />
                Run validation
              </Button>
            </Link>
            <Link href="/content">
              <Button variant="secondary">
                <FileText className="h-4 w-4" />
                Generate content
              </Button>
            </Link>
            <Link href="/approvals">
              <Button>
                <Send className="h-4 w-4" />
                Send to approval
              </Button>
            </Link>
          </>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 lg:grid-cols-[1fr_1.05fr] xl:grid-cols-[1fr_1.1fr] h-[calc(100vh-220px)] min-h-[680px]"
        >
          <ChatPanel
            messages={messages}
            pending={pending}
            suggestions={suggestions}
            onSend={handleSend}
            brief={brief}
          />
          <BriefPanel brief={brief} />
        </motion.div>

        {/* Sticky bottom action bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky bottom-4 mt-4 z-20"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-glow-lg px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Auto-saving · {brief.audiences.length} audience{brief.audiences.length === 1 ? "" : "s"} · {brief.channels.length} channel{brief.channels.length === 1 ? "" : "s"}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/validation">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Validate
                </Button>
              </Link>
              <Link href="/creative">
                <Button variant="outline" size="sm">
                  <Wand2 className="h-3.5 w-3.5" />
                  Concepts
                </Button>
              </Link>
              <Link href="/content">
                <Button size="sm">
                  <FileText className="h-3.5 w-3.5" />
                  Open content workspace
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
