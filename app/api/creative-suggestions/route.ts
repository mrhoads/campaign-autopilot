import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief } from "@/types";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";
import { brandComplianceBlock } from "@/lib/server/tenantPrompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Regeneration suggestion helper.
 *
 * When a marketer wants to re-roll a single image or the video concept, this
 * endpoint proposes 1-3 short, on-brand ways they might change it. It is
 * deliberately best-effort: any failure (or no chat deployment) falls back to
 * a curated static set so the regenerate UI always has something to show.
 */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["suggestions"],
  properties: {
    suggestions: { type: "array", items: { type: "string" } },
  },
};

interface SuggestionBody {
  tenantId?: string;
  kind?: "image" | "video";
  title?: string;
  basePrompt?: string;
  brief?: Partial<CampaignBrief>;
}

const FALLBACK: Record<"image" | "video", string[]> = {
  image: [
    "Warmer golden-hour palette, softer light",
    "Tighter crop on a single hero subject",
    "Shift to an evening community setting",
  ],
  video: [
    "Open on a close-up, then pull back",
    "Slow the pacing for a more emotional tone",
    "Warmer color grade, gentle camera push-in",
  ],
};

function buildSystemPrompt(tenant: Tenant, kind: "image" | "video"): string {
  return `You are ${tenant.persona.creativeDirectorTitle}. A marketer wants to regenerate a ${kind} concept and may want to change it.

Given the current concept prompt and the campaign brief, propose 1-3 SHORT, specific, on-brand ways they might adjust the ${kind} for the next render.

Each suggestion:
- is an imperative directive under 12 words (e.g., "Tighter crop on a single hero subject")
- changes something concrete: composition, palette, lighting, subject, setting, mood${kind === "video" ? ", or pacing/camera movement" : ""}
- stays brand-safe and production-realistic
- must NOT request brand logos, mascots, insignia, or political/national symbolism

${brandComplianceBlock(tenant)}

Return JSON {"suggestions": string[]} with 1-3 items. No commentary.`;
}

export async function POST(req: NextRequest) {
  let body: SuggestionBody;
  try {
    body = (await req.json()) as SuggestionBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind: "image" | "video" = body.kind === "video" ? "video" : "image";
  const tenant = getTenant(body.tenantId);

  // No chat deployment → return curated defaults.
  if (!getCapabilities().chat) {
    return NextResponse.json({ suggestions: FALLBACK[kind] });
  }

  try {
    const raw = await structuredCompletion<{ suggestions: string[] }>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant, kind) },
        {
          role: "user",
          content: `CURRENT ${kind.toUpperCase()} PROMPT:\n${
            body.basePrompt?.trim() || "(none provided)"
          }\n\nCAMPAIGN BRIEF (partial JSON):\n${JSON.stringify(
            body.brief ?? {},
            null,
            2,
          )}\n\nSuggest 1-3 adjustments now.`,
        },
      ],
      temperature: 0.9,
      maxTokens: 300,
      jsonSchema: { name: "regen_suggestions", schema: SCHEMA },
    });

    const suggestions = (raw.suggestions ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({
      suggestions: suggestions.length ? suggestions : FALLBACK[kind],
    });
  } catch (e) {
    // Non-critical — never hard-fail the regenerate flow.
    if (e instanceof AzureOpenAIError) {
      return NextResponse.json({ suggestions: FALLBACK[kind] });
    }
    return NextResponse.json({ suggestions: FALLBACK[kind] });
  }
}
