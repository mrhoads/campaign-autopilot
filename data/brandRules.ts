import type { BrandRule } from "@/types";

/**
 * Mock brand & compliance rule library.
 *
 * In production this would be sourced from an enterprise brand rules store
 * (e.g., a governed knowledge base in Azure AI Foundry, a CMS, or an LLM-
 * indexed brand portal). Every rule below is labeled as a demo placeholder
 * unless explicitly noted, since we do not assume access to Contoso's
 * confidential brand rules.
 */
export const brandRules: BrandRule[] = [
  {
    id: "rule_claims_savings",
    category: "claims",
    title: "No unsupported savings claims",
    description:
      "Savings figures must be backed by an internal data source approved within the last 12 months. Avoid absolutes like ‘always saves’ or ‘guaranteed lowest rate’.",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Replace absolute language with ‘could save’ and reference the most recent approved savings study citation.",
  },
  {
    id: "rule_disclaimer_rate_variation",
    category: "disclaimer",
    title: "Insurance rate variation disclaimer required",
    description:
      "Any quote, savings, or premium reference must include a clear disclaimer that rates vary by state, coverage, and underwriting profile.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation:
      "Append the standard rate-variation disclaimer to the footer of all customer-facing assets.",
  },
  {
    id: "rule_mascot_usage",
    category: "mascot",
    title: "Approved mascot assets only",
    description:
      "Brand mascot likeness may only be sourced from the approved asset library. Generative recreation of the mascot is not permitted.",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Route mascot creative through the approved asset management system and request a licensed render.",
  },
  {
    id: "rule_tone_patriotic_balance",
    category: "tone",
    title: "Patriotic themes must remain trust-forward",
    description:
      "Holiday or patriotic themes should not overshadow Contoso's core trust, clarity, and value attributes. Avoid imagery or copy that politicizes the brand.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Reframe patriotic motifs as community, family, and service-oriented while preserving trust cues.",
  },
  {
    id: "rule_accessibility_color_contrast",
    category: "accessibility",
    title: "Accessibility reminders for visual concepts",
    description:
      "All visual concepts must respect WCAG AA color contrast and provide accessible text alternatives in production assets.",
    demoPlaceholder: true,
    severity: "info",
    remediation:
      "Add alt text drafts and verify foreground/background contrast ≥ 4.5:1 for body copy.",
  },
  {
    id: "rule_review_visual_human",
    category: "review",
    title: "Human review required for visual assets",
    description:
      "Generative visual concepts must be reviewed by a brand creative lead before production handoff or external publishing.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation: "Send concept package to Creative Director queue in Approval Center.",
  },
  {
    id: "rule_channel_sms_optin",
    category: "channel",
    title: "SMS messages require opt-in language",
    description:
      "SMS variants must reference prior opt-in, frequency, and STOP/HELP instructions in line with carrier and TCPA expectations.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Append ‘Reply STOP to opt out, HELP for help. Msg & data rates may apply.’ to the variant.",
  },
  {
    id: "rule_legal_state_eligibility",
    category: "claims",
    title: "State availability footnote",
    description:
      "Promotions or product references must clarify availability is subject to state and underwriting eligibility.",
    demoPlaceholder: true,
    severity: "warning",
    remediation: "Add availability footnote near product references.",
  },
];
