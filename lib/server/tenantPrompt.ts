import "server-only";
import type { Tenant } from "@/lib/tenants/types";

/**
 * Shared brand + compliance context injected into server-side system prompts
 * so every agent speaks as the active tenant and enforces that brand's rules.
 */
export function brandComplianceBlock(tenant: Tenant): string {
  const never = tenant.persona.complianceMustNever
    .map((s) => `- ${s}`)
    .join("\n");
  const always = tenant.persona.complianceMustAlways
    .map((s) => `- ${s}`)
    .join("\n");
  return `BRAND: ${tenant.name} (${tenant.legalName}) — ${tenant.vocabulary.industry}.
Core brand values: ${tenant.persona.brandValues}.
Audience context: ${tenant.persona.audienceContext}

You must NEVER:
${never}

You must ALWAYS:
${always}`;
}
