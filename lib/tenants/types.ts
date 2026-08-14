import type {
  ApprovalPackage,
  BrandRule,
  CampaignBrief,
  ContentVariant,
  CreativeConcept,
  CreativeToolStatus,
  DashboardKpis,
  RecentCampaignSummary,
  ValidationResult,
} from "@/types";

/**
 * Multi-tenant branding model.
 *
 * A `Tenant` is the single source of truth for everything brand-specific in
 * the demo: display strings, product vocabulary, mascot policy, sample
 * prompts, server-side persona/compliance language, the generation prompt
 * sanitizer config, and the full seed content pack shown across the app.
 *
 * Adding a new demo customer = adding one `Tenant` object to the registry.
 * No UI code needs to change.
 */

/** Mascot policy. `null` when a brand has no mascot (e.g. a bank). */
export interface TenantMascot {
  /** How the brand refers to the mascot, e.g. "the Otter". */
  name: string;
  /** One-word label, e.g. "Otter". */
  shortName: string;
  /** Neutral visual description used when a stylized reference is allowed. */
  description: string;
  /** Label for the "include mascot" toggle. */
  toggleLabel: string;
  /** Helper text under the toggle. */
  toggleDescription: string;
  /** Note shown when mascot generation is blocked and routed to assets. */
  blockedNote: string;
}

export interface TenantVocabulary {
  /** e.g. "auto insurance" / "banking & lending". */
  industry: string;
  /** Primary product line label, e.g. "Auto Insurance" / "Auto Loans". */
  primaryProductLine: string;
  /** Short product noun, e.g. "auto coverage" / "an auto loan". */
  productNoun: string;
  /** Primary CTA verb, e.g. "Quote" / "Apply". */
  ctaVerb: string;
  /** Full primary CTA phrase, e.g. "Start your quote" / "Start your application". */
  ctaPhrase: string;
}

/** Strings injected into server-side system prompts to brand the agents. */
export interface TenantServerPersona {
  /** e.g. "Contoso's senior marketing strategist AI". */
  strategistTitle: string;
  /** e.g. "the Contoso Marketing Campaign Orchestrator". */
  orchestratorTitle: string;
  /** e.g. "the Contoso Brand & Compliance Validator". */
  validatorTitle: string;
  /** e.g. "the Contoso Channel Content Generator". */
  contentTitle: string;
  /** e.g. "a senior creative director at Contoso". */
  creativeDirectorTitle: string;
  /** Core brand values phrase, e.g. "trust, clarity, and value". */
  brandValues: string;
  /** Short audience/positioning context for prompts. */
  audienceContext: string;
  /** Hard "never do" compliance rules for this brand. */
  complianceMustNever: string[];
  /** Standing "always do" compliance rules for this brand. */
  complianceMustAlways: string[];
}

/** Config that drives the server-side generation prompt sanitizer. */
export interface TenantSanitizerConfig {
  /**
   * Brand-name → neutral replacement pairs. `match` is a case-insensitive
   * regex source string (no flags).
   */
  brandReplacements: { match: string; replacement: string }[];
  /**
   * Words that identify a mascot/character in a sentence. When present,
   * the video sanitizer drops the sentence. Empty when the brand has no
   * mascot.
   */
  mascotTerms: string[];
  /** Fallback video prompt when sanitizing strips too much. */
  videoFallbackPrompt: string;
}

/** The full seed content pack rendered across the workspace for a tenant. */
export interface TenantContent {
  brandRules: BrandRule[];
  briefs: CampaignBrief[];
  /** The hero brief used as the default across builder/content/creative. */
  primaryBrief: CampaignBrief;
  contentVariants: ContentVariant[];
  creativeConcepts: CreativeConcept[];
  approvalPackages: ApprovalPackage[];
  primaryValidation: ValidationResult;
  dashboardKpis: DashboardKpis;
  recentCampaigns: RecentCampaignSummary[];
  creativeToolStatus: CreativeToolStatus;
  /** Compliance pulse items shown on the dashboard BrandStatusPanel. */
  brandPulse: BrandPulseItem[];
  /** Person shown in the top bar. */
  primaryUser: { name: string; initials: string; role: string };
  /** Dashboard greeting + sub-description. */
  dashboardGreeting: string;
  dashboardDescription: string;
}

export interface BrandPulseItem {
  label: string;
  detail: string;
  status: "ok" | "warn" | "review" | "pending";
}

export interface Tenant {
  /** Stable id, used as the localStorage value and API token. */
  id: string;
  /** Display name, e.g. "Contoso". */
  name: string;
  /** Legal/full name, e.g. "Northwind Credit Union". */
  legalName: string;
  /** Short conversational name, e.g. "Northwind". */
  shortName: string;
  /** Full app title (browser tab / metadata). */
  appName: string;
  /** Top-bar breadcrumb label, e.g. "Contoso Marketing". */
  workspaceLabel: string;
  /** Sidebar eyebrow, e.g. "Contoso • Marketing". */
  sidebarLabel: string;
  /** Short tagline shown in the switcher. */
  tagline: string;
  vocabulary: TenantVocabulary;
  mascot: TenantMascot | null;
  persona: TenantServerPersona;
  sanitizer: TenantSanitizerConfig;
  prompts: {
    /** Builder workspace starter prompt. */
    builderSample: string;
    /** Auto-Pilot default prompt. */
    autopilotDefault: string;
    /** First assistant message in the builder chat. */
    welcome: string;
    /** Download filename stem for generated video (no extension). */
    videoDownloadStem: string;
  };
  content: TenantContent;
}
