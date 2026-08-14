import { NextRequest, NextResponse } from "next/server";
import {
  structuredCompletion,
  AzureOpenAIError,
} from "@/lib/server/azureOpenAI";
import { getCapabilities } from "@/lib/config";
import type { CampaignBrief, ValidationResult } from "@/types";
import { getTenant } from "@/lib/tenants/registry";
import type { Tenant } from "@/lib/tenants/types";
import { brandComplianceBlock } from "@/lib/server/tenantPrompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function buildSystemPrompt(tenant: Tenant): string {
  return `You are ${tenant.persona.validatorTitle}.

You evaluate a campaign brief against a fixed list of brand rules and produce structured findings.

For each rule you receive, you must produce exactly one finding with:
- "severity": one of "passed", "info", "warning", "blocker", "approval_required"
- "message": one-sentence specific finding grounded in the brief
- "evidence": optional short quote or paraphrase from the brief
- "remediation": optional concrete fix
- "confidence": "low" | "medium" | "high"

Then compute:
- "overallStatus": "ready" | "review_needed" | "blocked"
- "score": 0-100 (subtract for severity: warning ~6, approval_required ~8, blocker ~20)
- "approvalsRequired": list of role names that must sign off (e.g., "Brand Director", "Creative Lead", "Legal & Compliance")

Grade strictly against each supplied rule, using its category and description. Treat any rule with severity "blocker" as a hard gate when the brief violates it. Visual-asset / review rules should be approval_required by default for any campaign with visual concepts.

${brandComplianceBlock(tenant)}`;
}

const VALIDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overallStatus", "score", "findings", "approvalsRequired"],
  properties: {
    overallStatus: {
      type: "string",
      enum: ["ready", "review_needed", "blocked"],
    },
    score: { type: "integer", minimum: 0, maximum: 100 },
    approvalsRequired: { type: "array", items: { type: "string" } },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ruleId", "severity", "message", "evidence", "remediation", "confidence"],
        properties: {
          ruleId: { type: "string" },
          severity: {
            type: "string",
            enum: [
              "passed",
              "info",
              "warning",
              "blocker",
              "approval_required",
            ],
          },
          message: { type: "string" },
          evidence: { type: ["string", "null"] },
          remediation: { type: ["string", "null"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
  },
};

interface RawFinding {
  ruleId: string;
  severity: ValidationResult["findings"][number]["severity"];
  message: string;
  evidence?: string | null;
  remediation?: string | null;
  confidence: ValidationResult["findings"][number]["confidence"];
}

interface RawResult {
  overallStatus: ValidationResult["overallStatus"];
  score: number;
  approvalsRequired: string[];
  findings: RawFinding[];
}

export async function POST(req: NextRequest) {
  const caps = getCapabilities();
  if (!caps.chat) {
    return NextResponse.json(
      { error: "chat_disabled" },
      { status: 503 },
    );
  }

  let brief: CampaignBrief;
  let tenant: Tenant = getTenant(undefined);
  try {
    const body = await req.json();
    brief = body.brief as CampaignBrief;
    tenant = getTenant(body.tenantId as string | undefined);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rules = tenant.content.brandRules;

  const ruleSummary = rules
    .map(
      (r) =>
        `- id="${r.id}", category=${r.category}, defaultSeverity=${r.severity}, title="${r.title}", description="${r.description}"`,
    )
    .join("\n");

  const briefContext = JSON.stringify(brief, null, 2);

  try {
    const raw = await structuredCompletion<RawResult>({
      messages: [
        { role: "system", content: buildSystemPrompt(tenant) },
        {
          role: "user",
          content: `RULES:\n${ruleSummary}\n\nBRIEF (JSON):\n${briefContext}\n\nProduce one finding per rule above (use the exact ruleId).`,
        },
      ],
      temperature: 0.1,
      maxTokens: 2200,
      jsonSchema: { name: "validation_result", schema: VALIDATION_SCHEMA },
    });

    // Hydrate ruleTitle / category from the local library.
    const hydrated: ValidationResult = {
      briefId: brief.id,
      generatedAt: new Date().toISOString(),
      overallStatus: raw.overallStatus,
      score: raw.score,
      approvalsRequired: raw.approvalsRequired ?? [],
      findings: raw.findings.map((f, i) => {
        const rule = rules.find((r) => r.id === f.ruleId);
        return {
          id: `vf_${Date.now()}_${i}`,
          ruleId: f.ruleId,
          ruleTitle: rule?.title ?? f.ruleId,
          category: rule?.category ?? "tone",
          severity: f.severity,
          message: f.message,
          evidence: f.evidence ?? undefined,
          remediation: f.remediation ?? rule?.remediation,
          confidence: f.confidence,
        };
      }),
    };

    return NextResponse.json(hydrated);
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
