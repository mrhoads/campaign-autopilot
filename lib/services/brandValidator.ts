import type {
  BrandRule,
  CampaignBrief,
  ValidationFinding,
  ValidationResult,
  ValidationSeverity,
} from "@/types";
import { getActiveTenant, getActiveTenantId } from "@/lib/tenants/active";
import { generateId } from "@/lib/utils";
import { getClientCapabilities } from "./status";

/**
 * Brand & Compliance Validator client.
 *
 * Real path: POST /api/validate -> LLM-graded findings against the rule lib.
 * Fallback path: heuristic evaluation against the local brief text.
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SEVERITY_WEIGHT: Record<ValidationSeverity, number> = {
  passed: 0,
  info: 1,
  warning: 6,
  approval_required: 8,
  blocker: 20,
};

export async function listRules(): Promise<BrandRule[]> {
  await latency(40);
  return getActiveTenant().content.brandRules;
}

export async function validateBrief(brief: CampaignBrief): Promise<ValidationResult> {
  const caps = await getClientCapabilities();
  if (caps.chat) {
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: getActiveTenantId(), brief }),
      });
      if (!res.ok) throw new Error(`Validate HTTP ${res.status}`);
      const data = (await res.json()) as ValidationResult;
      return data;
    } catch (e) {
      console.warn("[validator] falling back to mock:", e);
    }
  }
  return mockValidate(brief);
}

async function mockValidate(brief: CampaignBrief): Promise<ValidationResult> {
  await latency(900 + Math.random() * 300);
  const tenant = getActiveTenant();
  if (brief.id === tenant.content.primaryValidation.briefId) {
    return {
      ...tenant.content.primaryValidation,
      generatedAt: new Date().toISOString(),
    };
  }

  const findings: ValidationFinding[] = tenant.content.brandRules.map((rule) => {
    const baseFinding: ValidationFinding = {
      id: generateId("vf"),
      ruleId: rule.id,
      ruleTitle: rule.title,
      category: rule.category,
      severity: "passed",
      message: `No issues detected for ${rule.title.toLowerCase()}.`,
      remediation: rule.remediation,
      confidence: "high",
    };

    const briefText = [
      brief.objective,
      ...brief.keyMessages.map((m) => m.headline),
      ...brief.creativeNotes,
      ...brief.requiredDisclaimers,
    ]
      .join(" ")
      .toLowerCase();

    if (rule.category === "claims" && /guaranteed|always saves|lowest rate/.test(briefText)) {
      return {
        ...baseFinding,
        severity: "blocker",
        message: "Brief contains absolute savings language that requires revision.",
        evidence: "‘Guaranteed’ / ‘always saves’ phrasing detected in messaging.",
      };
    }
    if (
      rule.category === "disclaimer" &&
      !/rates? vary|vary by state|terms vary|savings vary|not available in all states/.test(
        briefText,
      )
    ) {
      return {
        ...baseFinding,
        severity: "approval_required",
        message: "Required variation / availability disclaimer not yet referenced in the brief.",
      };
    }
    if (
      rule.category === "mascot" &&
      /mascot|otter|jingle|logo|wordmark|emblem|insignia/.test(briefText)
    ) {
      return {
        ...baseFinding,
        severity: "warning",
        message:
          "Protected brand mark or mascot referenced — confirm only approved licensed assets are used; no generative likeness.",
      };
    }
    if (rule.category === "channel" && brief.channels.includes("SMS")) {
      return {
        ...baseFinding,
        severity: "warning",
        message:
          "SMS in channel mix — ensure opt-in, frequency, and STOP/HELP language is present.",
      };
    }
    if (
      rule.category === "tone" &&
      /patriotic|memorial|holiday|seasonal|back to school|back-to-school/.test(briefText)
    ) {
      return {
        ...baseFinding,
        severity: "warning",
        message: "Seasonal / holiday motif present — keep trust attributes dominant.",
      };
    }
    if (rule.category === "review") {
      return {
        ...baseFinding,
        severity: "approval_required",
        message: "Visual assets must be reviewed by a brand creative lead.",
      };
    }
    return baseFinding;
  });

  const score = Math.max(
    0,
    100 - findings.reduce((acc, f) => acc + SEVERITY_WEIGHT[f.severity], 0),
  );
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const overallStatus =
    blockers > 0 ? "blocked" : score >= 90 ? "ready" : "review_needed";

  return {
    briefId: brief.id,
    generatedAt: new Date().toISOString(),
    overallStatus,
    score,
    findings,
    approvalsRequired: findings
      .filter((f) => f.severity === "approval_required")
      .map((f) => f.ruleTitle),
  };
}
