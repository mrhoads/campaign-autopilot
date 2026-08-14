import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief } from "@/types";
import { generateId } from "@/lib/utils";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";
import { brandComplianceBlock } from "@/lib/server/tenantPrompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * One-shot brief planner.
 *
 * Takes a raw natural-language campaign request and returns a complete,
 * production-quality CampaignBrief in a single LLM call. This is the entry
 * point for the auto-pilot pipeline — no clarifying turn, no incremental
 * patches.
 */

function buildSystemPrompt(tenant: Tenant): string {
  return `You are ${tenant.persona.strategistTitle}. Given a single natural-language campaign request, draft a complete, production-quality campaign brief.

Be bold, specific, and confident. The marketer is showing this to a CMO — generic boilerplate will not do.

Requirements:
- Every key message must feel distinctive and on-brand for ${tenant.name} (${tenant.vocabulary.industry}).
- Audiences must include realistic estimated reach figures (e.g., "4.6M", "2.1M").
- KPIs must include a measurable target and a one-sentence rationale.
- Risks must include severity (low/medium/high) and a concrete mitigation.
- Required disclaimers must reflect this brand's mandatory disclosures.
- Creative notes must be specific enough that a studio team could brief from them.
- Timeline ISO strings — use realistic future-dated values relative to the campaign.

${brandComplianceBlock(tenant)}

Return JSON matching the supplied schema exactly.`;
}

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "objective",
    "productLine",
    "audiences",
    "keyMessages",
    "channels",
    "ctaOptions",
    "timeline",
    "kpis",
    "risks",
    "requiredDisclaimers",
    "creativeNotes",
  ],
  properties: {
    title: { type: "string" },
    objective: { type: "string" },
    productLine: { type: "string" },
    audiences: {
      type: "array",
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
      type: "array",
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
      type: "array",
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
      type: "array",
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
    timeline: {
      type: "object",
      additionalProperties: false,
      required: ["kickoff", "launch", "wrap"],
      properties: {
        kickoff: { type: "string" },
        launch: { type: "string" },
        wrap: { type: "string" },
      },
    },
    kpis: {
      type: "array",
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
      type: "array",
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
    requiredDisclaimers: { type: "array", items: { type: "string" } },
    creativeNotes: { type: "array", items: { type: "string" } },
  },
};

interface RawPlan {
  title: string;
  objective: string;
  productLine: string;
  audiences: CampaignBrief["audiences"];
  keyMessages: CampaignBrief["keyMessages"];
  channels: CampaignBrief["channels"];
  ctaOptions: CampaignBrief["ctaOptions"];
  timeline: CampaignBrief["timeline"];
  kpis: CampaignBrief["kpis"];
  risks: CampaignBrief["risks"];
  requiredDisclaimers: string[];
  creativeNotes: string[];
}

export async function POST(req: NextRequest) {
  if (!getCapabilities().chat) {
    return NextResponse.json({ error: "chat_disabled" }, { status: 503 });
  }

  let prompt: string;
  let tenant: Tenant = getTenant(undefined);
  try {
    const body = (await req.json()) as { prompt: string; tenantId?: string };
    prompt = body.prompt;
    tenant = getTenant(body.tenantId);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
  }

  try {
    const raw = await structuredCompletion<RawPlan>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant) },
        {
          role: "user",
          content: `MARKETER REQUEST:\n${prompt}\n\nDraft the full brief now.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
      jsonSchema: { name: "campaign_plan", schema: PLAN_SCHEMA },
    });

    const briefId = generateId("brief");
    const brief: CampaignBrief = {
      id: briefId,
      requestId: generateId("req"),
      title: raw.title,
      objective: raw.objective,
      productLine: raw.productLine,
      audiences: raw.audiences ?? [],
      keyMessages: raw.keyMessages ?? [],
      channels: raw.channels ?? [],
      ctaOptions: raw.ctaOptions ?? [],
      timeline: raw.timeline,
      kpis: raw.kpis ?? [],
      risks: raw.risks ?? [],
      requiredDisclaimers: raw.requiredDisclaimers ?? [],
      creativeNotes: raw.creativeNotes ?? [],
      status: "draft",
      updatedAt: new Date().toISOString(),
      completeness: 0.9,
    };

    return NextResponse.json(brief);
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
