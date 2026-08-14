import type {
  CampaignBrief,
  CampaignChannel,
  ChatMessage,
} from "@/types";
import { getActiveTenant, getActiveTenantId } from "@/lib/tenants/active";
import { generateId } from "@/lib/utils";
import { getClientCapabilities } from "./status";

/**
 * Campaign Orchestrator client.
 *
 * Real path: POST /api/orchestrator -> Azure OpenAI (GPT-4o) with structured
 * brief patches.
 *
 * Fallback path: a deterministic pattern-matching simulator that mutates the
 * brief in plausible ways. Triggered when the backend reports the chat
 * deployment is not configured, or when the API call fails.
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface OrchestratorTurn {
  reply: ChatMessage;
  briefPatch?: Partial<CampaignBrief>;
  followUpSuggestions?: string[];
}

export async function getInitialBrief(): Promise<CampaignBrief> {
  return getActiveTenant().content.primaryBrief;
}

export async function listSavedBriefs(): Promise<CampaignBrief[]> {
  return getActiveTenant().content.briefs;
}

export async function sendMessage(
  history: ChatMessage[],
  userMessage: string,
  currentBrief: CampaignBrief,
): Promise<OrchestratorTurn> {
  const caps = await getClientCapabilities();
  if (!caps.chat) return mockTurn(history, userMessage, currentBrief);

  try {
    const res = await fetch("/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: getActiveTenantId(),
        history,
        message: userMessage,
        brief: currentBrief,
      }),
    });
    if (!res.ok) throw new Error(`Orchestrator HTTP ${res.status}`);
    const data = (await res.json()) as {
      reply: string;
      patchSummary: string[];
      followUps: string[];
      briefPatch: Partial<CampaignBrief>;
    };
    return {
      reply: {
        id: generateId("msg"),
        role: "assistant",
        content: data.reply,
        timestampIso: new Date().toISOString(),
        briefPatchSummary: data.patchSummary?.length ? data.patchSummary : undefined,
      },
      briefPatch: data.briefPatch && Object.keys(data.briefPatch).length
        ? data.briefPatch
        : undefined,
      followUpSuggestions: data.followUps,
    };
  } catch (e) {
    console.warn("[orchestrator] falling back to mock:", e);
    return mockTurn(history, userMessage, currentBrief);
  }
}

export function welcomeMessage(): ChatMessage {
  return {
    id: generateId("msg"),
    role: "assistant",
    content: getActiveTenant().prompts.welcome,
    timestampIso: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock fallback (kept from original demo for offline / unconfigured cases)
// ---------------------------------------------------------------------------

const FOLLOW_UPS_BY_PHASE: Record<number, string[]> = {
  0: [
    "Add SMS as a channel",
    "Stretch goal: include Connected TV",
    "Lean more young professional",
  ],
  1: [
    "Add a teen driver safety angle",
    "Tighten the launch window by 3 days",
    "Add a bundle cross-sell hook",
  ],
  2: [
    "Run validation now",
    "Generate paid social variants",
    "Draft the creative concept set",
  ],
};

async function mockTurn(
  history: ChatMessage[],
  userMessage: string,
  currentBrief: CampaignBrief,
): Promise<OrchestratorTurn> {
  await latency(700 + Math.random() * 400);

  const userTurns = history.filter((m) => m.role === "user").length;
  const phase = Math.min(userTurns, 2);
  const lower = userMessage.toLowerCase();

  const patch: Partial<CampaignBrief> = {};
  const patchSummary: string[] = [];

  const channelMap: Record<string, CampaignChannel> = {
    email: "Email",
    "paid social": "Paid Social",
    social: "Paid Social",
    "landing page": "Landing Page",
    landing: "Landing Page",
    display: "Display Ads",
    sms: "SMS",
    ctv: "Connected TV",
    "connected tv": "Connected TV",
    ooh: "Out of Home",
    billboard: "Out of Home",
  };
  const newChannels = new Set<CampaignChannel>(currentBrief.channels);
  for (const [needle, channel] of Object.entries(channelMap)) {
    if (lower.includes(needle)) newChannels.add(channel);
  }
  if (newChannels.size !== currentBrief.channels.length) {
    patch.channels = Array.from(newChannels);
    patchSummary.push(`Updated channels: ${patch.channels.join(", ")}`);
  }

  if (lower.includes("teen") || lower.includes("young driver")) {
    patch.audiences = [
      ...currentBrief.audiences,
      {
        label: "Households with Teen Drivers",
        description:
          "Parents with newly licensed drivers; receptive to safety + tools messaging.",
        estimatedReach: "1.8M",
      },
    ];
    patchSummary.push("Added 'Households with Teen Drivers' audience");
  }

  if (lower.includes("patriotic") || lower.includes("memorial")) {
    patch.creativeNotes = Array.from(
      new Set([
        ...currentBrief.creativeNotes,
        "Lean community-first patriotism; avoid flag-dominant hero shots.",
      ]),
    );
    patchSummary.push("Reinforced trust-forward patriotic guidance");
  }

  let replyText = "";
  if (phase === 0) {
    replyText = `Got it. I've drafted a working brief for **${currentBrief.title}** anchored on your positioning, with an emphasis on trust and a modern, brand-safe tone.\n\nA few quick confirmations before I expand:\n• Are you targeting national reach, or should I scope to a specific set of states?\n• Should I include an SMS variant for existing opt-in audiences?\n• Any hard launch date I should pin the timeline to?`;
  } else if (phase === 1) {
    replyText = `Applied your updates and tightened the brief. I've kept the brand-safe creative motif and added the channels you mentioned.\n\nNext, I can either:\n• Run a full brand & compliance validation pass\n• Generate channel-specific copy variants\n• Draft 3 visual concept directions for studio handoff\n\nWhich would you like first?`;
  } else {
    replyText = `Locked in. The brief is at **${Math.round(
      Math.min(1, currentBrief.completeness + 0.05) * 100,
    )}% completeness**. I'd recommend running a validation pass now — it surfaces any disclaimer or savings-claim risks before we generate content.\n\nWhenever you're ready, hit **Run validation** on the right or jump straight to **Generate content**.`;
  }

  return {
    reply: {
      id: generateId("msg"),
      role: "assistant",
      content: replyText,
      timestampIso: new Date().toISOString(),
      briefPatchSummary: patchSummary.length ? patchSummary : undefined,
    },
    briefPatch: Object.keys(patch).length ? patch : undefined,
    followUpSuggestions: FOLLOW_UPS_BY_PHASE[phase],
  };
}
