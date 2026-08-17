import {
  creativeToolStatus,
  dashboardKpis,
  laborDayBrief,
  laborDayValidation,
  recentCampaigns,
  seedApprovalPackages,
  seedBriefs,
  seedContentVariants,
  seedCreativeConcepts,
} from "@/data/seed";
import { brandRules } from "@/data/brandRules";
import type { Tenant } from "./types";

/**
 * Contoso Financial Services — the sample brand shipped with this app.
 *
 * Fictional. Contoso is Microsoft's standard sample company name; the brand
 * rules, campaigns, people, and metrics below are illustrative only and do not
 * represent any real organization. The seed content pack lives in `data/`.
 *
 * Use this file as the template for your own brand — see the README section
 * "Grounding it on your own content".
 */
export const contosoTenant: Tenant = {
  id: "contoso",
  name: "Contoso",
  legalName: "Contoso Financial Services",
  shortName: "Contoso",
  appName: "Contoso Financial Services — Marketing Campaign Agent",
  workspaceLabel: "Contoso Marketing",
  sidebarLabel: "Contoso • Marketing",
  tagline: "Auto & property insurance · marketing operations",
  vocabulary: {
    industry: "auto insurance",
    primaryProductLine: "Auto Insurance",
    productNoun: "auto coverage",
    ctaVerb: "Quote",
    ctaPhrase: "Start your quote",
  },
  mascot: {
    name: "the Contoso Otter",
    shortName: "Otter",
    description: "a friendly, expressive amber-and-cream cartoon otter character",
    toggleLabel: "Include mascot reference",
    toggleDescription:
      "Lets the creative-director agent feature a stylized otter character in image + video prompts. All outputs are flagged 'reference concept' — production assets still require the approved asset workflow.",
    blockedNote:
      "Mascot usage requested — generation blocked. Routed to approved asset / studio workflow for licensed mascot motion design.",
  },
  persona: {
    strategistTitle: "Contoso's senior marketing strategist AI",
    orchestratorTitle:
      "the Contoso Marketing Campaign Orchestrator — an AI marketing strategist embedded inside an internal workspace used by Contoso marketers",
    validatorTitle: "the Contoso Brand & Compliance Validator",
    contentTitle: "the Contoso Channel Content Generator",
    creativeDirectorTitle: "a senior creative director at Contoso",
    brandValues: "trust, clarity, and value",
    audienceContext:
      "Modern American households shopping auto insurance — families and value-driven young professionals.",
    complianceMustNever: [
      "imply unrestricted mascot or logo generation",
      "promise specific savings amounts without referencing an approved citation",
      "omit the rate variation disclaimer when premium / quote / savings language is used",
    ],
    complianceMustAlways: [
      "use 'could save' framing rather than absolute savings claims",
      "include the rate-variation disclaimer whenever premium, quote, or savings language appears",
    ],
  },
  sanitizer: {
    brandReplacements: [
      { match: "the\\s+Contoso\\s+otter", replacement: "a friendly amber-and-cream cartoon otter character" },
      { match: "Contoso\\s+otter", replacement: "a friendly amber-and-cream cartoon otter character" },
      { match: "\\bContoso\\b", replacement: "the brand" },
    ],
    mascotTerms: [
      "otter",
      "mascot",
      "cartoon character",
      "animated character",
      "anthropomorphic",
    ],
    videoFallbackPrompt:
      "Cinematic montage of a multigenerational family loading their car for a long weekend road trip at golden hour. Warm summer light, suburban driveway, kids laughing, gentle camera push-in. (Audio: upbeat, optimistic summer music.)",
  },
  prompts: {
    builderSample:
      "I want to build a Labor Day campaign for Contoso auto insurance focused on families and young professionals. I need paid social copy, email copy, a landing page concept, and 3 visual directions. Keep it patriotic, modern, and trustworthy.",
    autopilotDefault:
      "Build me a Labor Day campaign for Contoso auto insurance focused on families and young professionals. I need paid social copy, email copy, a landing page concept, three visual directions, and a 12-second hero video for connected TV. Keep it patriotic, modern, and trustworthy — community-first, not flag-forward.",
    welcome:
      "Welcome to Campaign Autopilot. Describe the campaign you want to build — product line, audience, timing, channels, tone — and I'll draft a brief alongside you. I'll only ask clarifying questions when something would unblock a brand or compliance check.",
    videoDownloadStem: "contoso-hero",
  },
  content: {
    brandRules,
    briefs: seedBriefs,
    primaryBrief: laborDayBrief,
    contentVariants: seedContentVariants,
    creativeConcepts: seedCreativeConcepts,
    approvalPackages: seedApprovalPackages,
    primaryValidation: laborDayValidation,
    dashboardKpis,
    recentCampaigns,
    creativeToolStatus,
    brandPulse: [
      {
        label: "Rate variation disclaimer",
        detail: "Auto-applied to Labor Day package",
        status: "ok",
      },
      {
        label: "Mascot generation policy",
        detail: "Routed via approved asset workflow",
        status: "review",
      },
      {
        label: "Patriotic tone balance",
        detail: "Trust attributes prioritized — passing review",
        status: "warn",
      },
      {
        label: "SMS opt-in language",
        detail: "STOP/HELP language present in variants",
        status: "ok",
      },
      {
        label: "Visual asset human review",
        detail: "Awaiting Brand Director sign-off",
        status: "pending",
      },
    ],
    primaryUser: { name: "Mike Rhoads", initials: "MR", role: "Sr. Marketing PM" },
    dashboardGreeting: "Welcome back, Mike",
    dashboardDescription:
      "Three campaigns are awaiting your review and the Labor Day package is one approval away from trafficking. Here's where the workspace stands today.",
  },
};
