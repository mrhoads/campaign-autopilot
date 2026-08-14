/**
 * Centralized type definitions for Campaign Autopilot.
 *
 * These shapes are deliberately framework-agnostic. The mock services in
 * `lib/services/*` return data conforming to these types so that swapping
 * mock implementations for real Azure AI Foundry / MCP-backed services
 * is a drop-in change.
 */

export type CampaignChannel =
  | "Email"
  | "Paid Social"
  | "Landing Page"
  | "Display Ads"
  | "SMS"
  | "Connected TV"
  | "Out of Home";

export type CampaignStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "needs_changes"
  | "live"
  | "archived";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ValidationSeverity =
  | "passed"
  | "info"
  | "warning"
  | "blocker"
  | "approval_required";

export interface CampaignRequest {
  id: string;
  prompt: string;
  product: "auto" | "home" | "renters" | "bundle" | "life" | "other";
  goals: string[];
  audiences: string[];
  channels: CampaignChannel[];
  toneKeywords: string[];
  timeframe?: string;
  budgetTier?: "scout" | "core" | "tentpole";
  createdAt: string;
  createdBy: string;
}

export interface AudienceSegment {
  label: string;
  description: string;
  estimatedReach?: string;
}

export interface KeyMessage {
  headline: string;
  rationale: string;
}

export interface CtaOption {
  label: string;
  destination: string;
  channelHint?: CampaignChannel;
}

export interface KpiTarget {
  name: string;
  target: string;
  rationale: string;
}

export interface RiskItem {
  title: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface CampaignBrief {
  id: string;
  requestId: string;
  title: string;
  objective: string;
  productLine: string;
  audiences: AudienceSegment[];
  keyMessages: KeyMessage[];
  channels: CampaignChannel[];
  ctaOptions: CtaOption[];
  timeline: {
    kickoff: string;
    launch: string;
    wrap: string;
  };
  kpis: KpiTarget[];
  risks: RiskItem[];
  requiredDisclaimers: string[];
  creativeNotes: string[];
  status: CampaignStatus;
  updatedAt: string;
  completeness: number; // 0..1 indicates how complete the brief is
}

export type BrandRuleCategory =
  | "claims"
  | "disclaimer"
  | "tone"
  | "mascot"
  | "accessibility"
  | "review"
  | "channel";

export interface BrandRule {
  id: string;
  category: BrandRuleCategory;
  title: string;
  description: string;
  /** When true, this rule is illustrative for the demo only. */
  demoPlaceholder: boolean;
  severity: ValidationSeverity;
  /** Optional remediation hints surfaced in the UI. */
  remediation?: string;
}

export interface ValidationFinding {
  id: string;
  ruleId: string;
  ruleTitle: string;
  category: BrandRuleCategory;
  severity: ValidationSeverity;
  message: string;
  evidence?: string;
  remediation?: string;
  confidence: ConfidenceLevel;
}

export interface ValidationResult {
  briefId: string;
  generatedAt: string;
  overallStatus: "ready" | "review_needed" | "blocked";
  score: number; // 0..100
  findings: ValidationFinding[];
  approvalsRequired: string[];
}

export interface ContentVariant {
  id: string;
  channel: CampaignChannel;
  label: string;
  headline: string;
  subheadline?: string;
  body: string;
  cta: string;
  audienceNote: string;
  complianceNote: string;
  tone: string;
  /** Soft-locked variants are pinned by the marketer. */
  pinned?: boolean;
}

export type CreativeStyle =
  | "Editorial"
  | "Cinematic"
  | "Photoreal"
  | "Illustrative"
  | "Documentary"
  | "Minimal";

export interface CreativeConcept {
  id: string;
  title: string;
  rationale: string;
  promptUsed: string;
  style: CreativeStyle;
  channels: CampaignChannel[];
  moodTags: string[];
  complianceStatus: "ready" | "needs_review" | "blocked";
  complianceNote?: string;
  thumbnailHue: string; // used to render a gradient placeholder
  requiresHumanReview: boolean;
  /** Populated when a real image was generated. */
  imageDataUrl?: string;
}

export interface CreativeToolStatus {
  serviceName: string;
  vendor: string;
  connectionStatus: "connected" | "degraded" | "disconnected";
  lastSyncIso: string;
  availableTools: {
    name: string;
    description: string;
  }[];
}

export interface ApprovalComment {
  id: string;
  author: string;
  role: string;
  timestampIso: string;
  message: string;
  decision?: "approve" | "request_changes" | "comment";
}

export interface ApprovalPackage {
  id: string;
  briefId: string;
  campaignTitle: string;
  submittedBy: string;
  submittedAtIso: string;
  status: "pending" | "in_review" | "approved" | "changes_requested";
  contentVariantIds: string[];
  conceptIds: string[];
  validationSummary: {
    score: number;
    blockers: number;
    warnings: number;
  };
  reviewers: {
    name: string;
    role: string;
    decision?: "approve" | "request_changes" | "pending";
  }[];
  comments: ApprovalComment[];
  history: {
    timestampIso: string;
    label: string;
    description: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestampIso: string;
  /** Optional structured patch the assistant applied to the brief. */
  briefPatchSummary?: string[];
}

export interface DashboardKpis {
  campaignsInDraft: number;
  awaitingApproval: number;
  brandIssuesFlagged: number;
  contentPackagesGenerated: number;
}

export interface RecentCampaignSummary {
  id: string;
  title: string;
  productLine: string;
  status: CampaignStatus;
  channels: CampaignChannel[];
  updatedAtIso: string;
  owner: string;
  validationScore: number;
}
