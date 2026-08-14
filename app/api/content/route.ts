import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief, CampaignChannel, ContentVariant } from "@/types";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";
import { brandComplianceBlock } from "@/lib/server/tenantPrompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const CHANNEL_GUIDANCE: Record<CampaignChannel, string> = {
  Email:
    "Subject-line worthy headline (<60 chars). Subheadline (<80 chars). 60-90 word body in friendly second-person voice. CTA: 2-4 words. Always end with rate-variation disclaimer in the audience/compliance note context, never inline in the body.",
  "Paid Social":
    "Tight scroll-stopping headline (<40 chars). 1-2 sentence body (<140 chars total). Action-oriented CTA. Avoid flag-dominant imagery; community-first only.",
  "Landing Page":
    "Hero headline + supporting subheadline. Body should describe the page sections (hero band, trust band, social proof, footer disclaimers). 80-120 words.",
  "Display Ads":
    "Short headline (<30 chars). Concise body describing visual + benefit chip + CTA. CTA <3 words. 30-50 words total.",
  SMS:
    "Body MUST include opt-in + STOP/HELP language. Keep under 160 chars. CTA points to a link the recipient already consented to.",
  "Connected TV":
    "Treat as a 15s spot brief. Headline = spot title. Body = visual + voiceover description. CTA = verbal call to action.",
  "Out of Home":
    "Single short headline. Body = one-line creative direction. CTA optional. Highway-scanable only.",
};

function buildSystemPrompt(tenant: Tenant): string {
  return `You are ${tenant.persona.contentTitle}.

Given a campaign brief and a target channel, you produce a single high-quality variant.

You must:
- match the brief's product line, audiences, and tone
- write for ${tenant.name} (${tenant.vocabulary.industry}); never reference any other company or brand
- ensure compliance flags surface in the complianceNote field
- write in the voice the brief prescribes (warm, modern, trustworthy by default)
- avoid lorem ipsum, never fabricate statistics

${brandComplianceBlock(tenant)}

Return JSON matching the supplied schema.`;
}

const VARIANT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "label",
    "headline",
    "subheadline",
    "body",
    "cta",
    "audienceNote",
    "complianceNote",
    "tone",
  ],
  properties: {
    label: { type: "string" },
    headline: { type: "string" },
    subheadline: { type: ["string", "null"] },
    body: { type: "string" },
    cta: { type: "string" },
    audienceNote: { type: "string" },
    complianceNote: { type: "string" },
    tone: { type: "string" },
  },
};

interface RawVariant {
  label: string;
  headline: string;
  subheadline?: string | null;
  body: string;
  cta: string;
  audienceNote: string;
  complianceNote: string;
  tone: string;
}

export async function POST(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.chat) {
    return NextResponse.json({ error: "chat_disabled" }, { status: 503 });
  }

  let brief: CampaignBrief;
  let channel: CampaignChannel;
  let variationHint: string | undefined;
  let tenant: Tenant = getTenant(undefined);
  try {
    const body = (await req.json()) as {
      brief: CampaignBrief;
      channel: CampaignChannel;
      variationHint?: string;
      tenantId?: string;
    };
    brief = body.brief;
    channel = body.channel;
    variationHint = body.variationHint;
    tenant = getTenant(body.tenantId);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const guidance = CHANNEL_GUIDANCE[channel] ?? "";

  try {
    const raw = await structuredCompletion<RawVariant>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant) },
        {
          role: "user",
          content: `BRIEF (JSON):\n${JSON.stringify(brief, null, 2)}\n\nTARGET CHANNEL: ${channel}\nCHANNEL GUIDANCE: ${guidance}\nVARIATION HINT: ${variationHint ?? "Produce a fresh, distinctive variant."}\n\nWrite the variant now.`,
        },
      ],
      temperature: 0.85,
      maxTokens: 900,
      jsonSchema: { name: "content_variant", schema: VARIANT_SCHEMA },
    });

    const variant: ContentVariant = {
      id: `cv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      channel,
      label: raw.label || `${channel} • Variant`,
      headline: raw.headline,
      subheadline: raw.subheadline ?? undefined,
      body: raw.body,
      cta: raw.cta,
      audienceNote: raw.audienceNote,
      complianceNote: raw.complianceNote,
      tone: raw.tone,
    };

    return NextResponse.json(variant);
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
