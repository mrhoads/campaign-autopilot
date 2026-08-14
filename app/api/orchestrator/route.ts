import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief, ChatMessage } from "@/types";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";
import { brandComplianceBlock } from "@/lib/server/tenantPrompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface OrchestratorPayload {
  history: ChatMessage[];
  message: string;
  brief: CampaignBrief;
  tenantId?: string;
}

function buildSystemPrompt(tenant: Tenant): string {
  return `You are ${tenant.persona.orchestratorTitle}.

Your job each turn is to:
1. Read the marketer's message in the context of the working campaign brief.
2. Decide what (if anything) on the brief should change.
3. Reply conversationally — concise, modern, professional. Use ** for emphasis. Use bullet lines starting with "• " when listing.
4. Ask clarifying questions ONLY if a brand, compliance, or planning gap would otherwise block the next step.

${brandComplianceBlock(tenant)}

You must ALWAYS return a JSON object that matches the supplied schema:
- "reply": the assistant's natural-language reply (markdown-lite ok)
- "briefPatch": only fields you actually changed — omit unchanged fields. Channels must be one of: Email, Paid Social, Landing Page, Display Ads, SMS, Connected TV, Out of Home.
- "patchSummary": short human-readable bullets describing the changes (or empty array)
- "followUps": 2-3 short suggested next prompts the marketer might want to try`;
}

const ORCHESTRATOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "briefPatch", "patchSummary", "followUps"],
  properties: {
    reply: { type: "string" },
    patchSummary: { type: "array", items: { type: "string" } },
    followUps: { type: "array", items: { type: "string" } },
    briefPatch: {
      type: "object",
      additionalProperties: false,
      required: [
        "objective",
        "audiences",
        "keyMessages",
        "channels",
        "ctaOptions",
        "kpis",
        "risks",
        "requiredDisclaimers",
        "creativeNotes",
      ],
      properties: {
        objective: { type: ["string", "null"] },
        audiences: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "description", "estimatedReach"],
            properties: {
              label: { type: "string" },
              description: { type: "string" },
              estimatedReach: { type: ["string", "null"] },
            },
          },
        },
        keyMessages: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "rationale"],
            properties: {
              headline: { type: "string" },
              rationale: { type: "string" },
            },
          },
        },
        channels: {
          type: ["array", "null"],
          items: {
            type: "string",
            enum: [
              "Email",
              "Paid Social",
              "Landing Page",
              "Display Ads",
              "SMS",
              "Connected TV",
              "Out of Home",
            ],
          },
        },
        ctaOptions: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "destination"],
            properties: {
              label: { type: "string" },
              destination: { type: "string" },
            },
          },
        },
        kpis: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "target", "rationale"],
            properties: {
              name: { type: "string" },
              target: { type: "string" },
              rationale: { type: "string" },
            },
          },
        },
        risks: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "severity", "mitigation"],
            properties: {
              title: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
              mitigation: { type: "string" },
            },
          },
        },
        requiredDisclaimers: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        creativeNotes: {
          type: ["array", "null"],
          items: { type: "string" },
        },
      },
    },
  },
};

interface OrchestratorResult {
  reply: string;
  patchSummary: string[];
  followUps: string[];
  briefPatch: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.chat) {
    return NextResponse.json(
      { error: "chat_disabled", message: "Azure OpenAI chat deployment is not configured." },
      { status: 503 },
    );
  }

  let payload: OrchestratorPayload;
  try {
    payload = (await req.json()) as OrchestratorPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tenant = getTenant(payload.tenantId);

  const briefContext = JSON.stringify(
    {
      title: payload.brief.title,
      objective: payload.brief.objective,
      productLine: payload.brief.productLine,
      audiences: payload.brief.audiences,
      keyMessages: payload.brief.keyMessages,
      channels: payload.brief.channels,
      ctaOptions: payload.brief.ctaOptions,
      timeline: payload.brief.timeline,
      kpis: payload.brief.kpis,
      risks: payload.brief.risks,
      requiredDisclaimers: payload.brief.requiredDisclaimers,
      creativeNotes: payload.brief.creativeNotes,
      completeness: payload.brief.completeness,
    },
    null,
    2,
  );

  const transcript = payload.history
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  try {
    const result = await structuredCompletion<OrchestratorResult>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant) },
        {
          role: "user",
          content: `CURRENT BRIEF (JSON):\n${briefContext}\n\nRECENT TRANSCRIPT:\n${transcript}\n\nNEW MARKETER MESSAGE:\n${payload.message}`,
        },
      ],
      temperature: 0.6,
      maxTokens: 1400,
      jsonSchema: { name: "orchestrator_turn", schema: ORCHESTRATOR_SCHEMA },
    });

    // Strip null entries from briefPatch so the client just merges what changed.
    const briefPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(result.briefPatch ?? {})) {
      if (v !== null && v !== undefined) briefPatch[k] = v;
    }

    return NextResponse.json({
      reply: result.reply,
      patchSummary: result.patchSummary ?? [],
      followUps: result.followUps ?? [],
      briefPatch,
    });
  } catch (e) {
    if (e instanceof AzureOpenAIError) {
      return NextResponse.json(
        { error: "azure_error", message: e.message, detail: e.detail },
        { status: e.status },
      );
    }
    return NextResponse.json(
      { error: "internal_error", message: (e as Error).message },
      { status: 500 },
    );
  }
}
