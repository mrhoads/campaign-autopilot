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
import type { Tenant } from "./types";

/**
 * Northwind Credit Union (NWCU) tenant.
 *
 * A member-owned, not-for-profit credit union serving the armed forces,
 * retirees, DoD, and their families. No mascot. Financial-services
 * compliance posture (NCUA, Equal Housing Lender, membership eligibility,
 * APR/representative-example, restricted uniform imagery).
 *
 * All content below is an illustrative demo placeholder and does not assume
 * access to Northwind's confidential brand guidelines.
 */

const now = Date.now();
const hrs = (h: number) => new Date(now - 1000 * 60 * 60 * h).toISOString();
const inDays = (d: number) => new Date(now + 1000 * 60 * 60 * 24 * d).toISOString();
const agoDays = (d: number) => new Date(now - 1000 * 60 * 60 * 24 * d).toISOString();
const mins = (m: number) => new Date(now - 1000 * 60 * m).toISOString();

const brandRules: BrandRule[] = [
  {
    id: "rule_nwcu_apr_claims",
    category: "claims",
    title: "No guaranteed approval or absolute rate claims",
    description:
      "Lending copy must not promise approval or a guaranteed/lowest rate. APR references require a representative example and qualifying language ('you may qualify', 'could lower your rate').",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Replace guarantees with 'you may qualify' / 'could lower your rate' and attach a representative APR example.",
  },
  {
    id: "rule_nwcu_ncua_disclosure",
    category: "disclaimer",
    title: "NCUA insurance & Equal Housing Lender disclosure required",
    description:
      "Member-facing assets must carry 'Federally insured by NCUA.' Mortgage and home-equity content must also include the Equal Housing Lender statement and logo.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation:
      "Add 'Federally insured by NCUA' to the footer; include Equal Housing Lender on any mortgage content.",
  },
  {
    id: "rule_nwcu_membership_eligibility",
    category: "disclaimer",
    title: "Membership eligibility statement required",
    description:
      "Any product or offer reference must clarify that membership eligibility is required and that terms vary by creditworthiness.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Append 'Membership eligibility required. Terms vary by creditworthiness.' near product references.",
  },
  {
    id: "rule_nwcu_military_respect",
    category: "tone",
    title: "Honor service respectfully — never commercialize sacrifice",
    description:
      "Community Appreciation and community-service-themed creative must lead with honor and service, keep any offer secondary, and never imply employer or government endorsement.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Lead with tribute and member service; make the product offer secondary and tasteful.",
  },
  {
    id: "rule_nwcu_restricted_imagery",
    category: "review",
    title: "No generative uniforms, badges, or official seals",
    description:
      "Generative recreation of public-service seals, insignia, rank, or service uniforms is not permitted and must not imply official endorsement. Use approved licensed assets only.",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Route any uniform/badge/seal imagery through the approved asset management system for a licensed render.",
  },
  {
    id: "rule_nwcu_accessibility",
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
    id: "rule_nwcu_sms_optin",
    category: "channel",
    title: "SMS messages require opt-in language",
    description:
      "SMS variants must reference prior opt-in, frequency, and STOP/HELP instructions in line with carrier and TCPA expectations.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Append 'Reply STOP to opt out, HELP for help. Msg & data rates may apply.' to the variant.",
  },
  {
    id: "rule_nwcu_human_review",
    category: "review",
    title: "Human review required for visual assets",
    description:
      "Generative visual concepts must be reviewed by a member brand creative lead before production handoff or external publishing.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation: "Send concept package to Creative Director queue in Approval Center.",
  },
];

const appreciationRefiBrief: CampaignBrief = {
  id: "brief_nwcu_appreciation_refi",
  requestId: "req_nwcu_appreciation_refi",
  title: "Community Appreciation — Auto Loan Refinance & Tribute",
  objective:
    "Drive a 10% lift in auto loan refinance applications over Community Appreciation weekend by honoring members who served and highlighting potential monthly savings from refinancing — without commercializing public service.",
  productLine: "Auto Loans",
  audiences: [
    {
      label: "Early-Career Public Service 22–34",
      description:
        "Public-service members with an existing auto loan (often financed at the dealer) who could lower their rate by refinancing with their credit union.",
      estimatedReach: "1.8M",
    },
    {
      label: "Public-Service Households 30–50",
      description:
        "Households balancing budgets across moves and deployments, receptive to member value and trusted servicing.",
      estimatedReach: "2.7M",
    },
  ],
  keyMessages: [
    {
      headline: "Refinance your auto loan and keep more of every paycheck.",
      rationale:
        "Leads with concrete member value and the core refinance benefit.",
    },
    {
      headline: "This Community Appreciation, we honor those who serve our communities — and serve those who serve our communities.",
      rationale:
        "Tribute-first framing that reinforces the mission and membership positioning.",
    },
    {
      headline: "Members could lower their rate. See your refinance options in minutes.",
      rationale:
        "Uses qualifying language and avoids guaranteed-rate or guaranteed-approval claims.",
    },
  ],
  channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
  ctaOptions: [
    { label: "Check your rate", destination: "/auto/refinance", channelHint: "Landing Page" },
    { label: "See refinance options", destination: "/auto/refi", channelHint: "Email" },
    { label: "Apply in minutes", destination: "/auto/refi?utm=memorial", channelHint: "Paid Social" },
  ],
  timeline: {
    kickoff: agoDays(3),
    launch: inDays(4),
    wrap: inDays(14),
  },
  kpis: [
    {
      name: "Refinance applications (incremental)",
      target: "+10% vs prior 14-day baseline",
      rationale: "Primary commercial outcome for the holiday window.",
    },
    {
      name: "Email CTR",
      target: "≥ 3.6%",
      rationale: "Benchmarks against last Community Appreciation member program.",
    },
    {
      name: "Cost per funded loan",
      target: "≤ $210",
      rationale: "Efficiency guardrail for paid acquisition.",
    },
    {
      name: "Member favorability lift",
      target: "+2 pts (post-flight survey)",
      rationale: "Tribute tone should strengthen membership, not just performance.",
    },
  ],
  risks: [
    {
      title: "Tribute reads as commercializing service",
      severity: "medium",
      mitigation:
        "Lead with honor and service; keep the refinance offer secondary and tasteful. Avoid flag-only hero shots.",
    },
    {
      title: "Implied guaranteed rate or approval",
      severity: "high",
      mitigation:
        "Use 'could lower your rate' framing with a representative APR example and membership-eligibility note.",
    },
    {
      title: "Unauthorized use of public-service insignia in visuals",
      severity: "high",
      mitigation:
        "Route any uniform/badge/seal imagery through approved asset management. No generative recreation.",
    },
  ],
  requiredDisclaimers: [
    "Federally insured by NCUA.",
    "Membership eligibility required. APR and terms vary by creditworthiness, loan term, and model year.",
    "Refinance savings depend on your current rate, term, and balance; not all applicants will qualify.",
  ],
  creativeNotes: [
    "Warm, respectful tone; feature real members and families, not staged heroics.",
    "Subtle service-and-community motifs; avoid flag-dominant or uniform-forward compositions.",
    "No generative recreation of public-service seals, insignia, or uniforms — approved licensed assets only.",
  ],
  status: "in_review",
  updatedAt: mins(14),
  completeness: 0.9,
};

const moveSeasonBrief: CampaignBrief = {
  id: "brief_nwcu_move_season",
  requestId: "req_nwcu_move_season",
  title: "Summer Move Season — Household Moves Made Easier",
  objective:
    "Support members during Permanent Change of Station (PCS) season with relocation, mortgage, and auto resources, increasing engagement with the household move toolkit.",
  productLine: "Mortgages & Moving",
  audiences: [
    {
      label: "Relocating Public-Service Members",
      description:
        "Members with orders to relocate in the next 60–120 days, navigating housing and vehicle logistics.",
      estimatedReach: "900K",
    },
    {
      label: "Public-Service Households Managing Moves",
      description:
        "Spouses coordinating household finances and timelines during a move.",
      estimatedReach: "1.1M",
    },
  ],
  keyMessages: [
    {
      headline: "Relocation orders? We move with you.",
      rationale: "Empathy-led message anchored in the member's reality.",
    },
    {
      headline: "Tools, checklists, and lending built for household moves.",
      rationale: "Positions the toolkit and products as practical utility.",
    },
  ],
  channels: ["Email", "Landing Page", "SMS"],
  ctaOptions: [
    { label: "Open the relocation toolkit", destination: "/members/relocation" },
    { label: "Explore home loans", destination: "/mortgage" },
  ],
  timeline: {
    kickoff: agoDays(2),
    launch: inDays(10),
    wrap: inDays(45),
  },
  kpis: [
    {
      name: "Toolkit engagement",
      target: "+18% page depth",
      rationale: "Indicates relocation content is resonating.",
    },
    {
      name: "Mortgage pre-qual starts",
      target: "+8% vs baseline",
      rationale: "Tracks conversion intent during summer move season.",
    },
  ],
  risks: [
    {
      title: "Tone reads as stressful rather than supportive",
      severity: "medium",
      mitigation: "Balance logistics with reassurance; lead with support, not urgency.",
    },
  ],
  requiredDisclaimers: [
    "Federally insured by NCUA. Equal Housing Lender.",
    "Membership eligibility required. Standard SMS opt-in, frequency, and STOP/HELP instructions required.",
  ],
  creativeNotes: [
    "Show partnership and steadiness through a move, not chaos.",
    "Daylight, real-home imagery preferred; avoid uniform-forward compositions.",
  ],
  status: "draft",
  updatedAt: hrs(5),
  completeness: 0.72,
};

const memberFirstCardBrief: CampaignBrief = {
  id: "brief_nwcu_first_card",
  requestId: "req_nwcu_first_card",
  title: "Member First — Early-Career Members Credit Card",
  objective:
    "Grow first credit card adoption among early-career members members with a no-annual-fee starter card paired with financial education.",
  productLine: "Credit Cards",
  audiences: [
    {
      label: "Early-Career Members 18–25",
      description:
        "Members early in their service and credit journey, building history responsibly.",
      estimatedReach: "1.3M",
    },
  ],
  keyMessages: [
    {
      headline: "Build credit on your terms — no annual fee.",
      rationale: "Reinforces accessibility and member-first value.",
    },
    {
      headline: "A starter card backed by people who serve you.",
      rationale: "Connects the product to membership and trust.",
    },
  ],
  channels: ["Email", "Paid Social", "Connected TV"],
  ctaOptions: [
    { label: "See the card", destination: "/cards/starter" },
    { label: "Become a member", destination: "/join" },
  ],
  timeline: {
    kickoff: agoDays(6),
    launch: agoDays(1),
    wrap: inDays(30),
  },
  kpis: [
    { name: "Card applications", target: "+22%", rationale: "Primary KPI." },
    {
      name: "Member retention lift",
      target: "+1.4 pts",
      rationale: "Tracks first-product relationship value.",
    },
  ],
  risks: [
    {
      title: "Implied guaranteed approval",
      severity: "high",
      mitigation:
        "Use 'you may qualify' language with membership-eligibility and representative-terms notes.",
    },
  ],
  requiredDisclaimers: [
    "Federally insured by NCUA.",
    "Membership eligibility required. Credit approval and terms vary by creditworthiness.",
  ],
  creativeNotes: [
    "Modern, optimistic, mobile-first; show everyday member moments.",
  ],
  status: "approved",
  updatedAt: hrs(24),
  completeness: 1,
};

const briefs: CampaignBrief[] = [
  appreciationRefiBrief,
  moveSeasonBrief,
  memberFirstCardBrief,
];

const recentCampaigns: RecentCampaignSummary[] = [
  {
    id: "cmp_nwcu_appreciation_refi",
    title: "Community Appreciation — Auto Loan Refinance & Tribute",
    productLine: "Auto Loans",
    status: "in_review",
    channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
    updatedAtIso: mins(42),
    owner: "Dana Brooks",
    validationScore: 88,
  },
  {
    id: "cmp_nwcu_move_season",
    title: "Summer Move Season — Household Moves Made Easier",
    productLine: "Mortgages & Moving",
    status: "draft",
    channels: ["Email", "Landing Page", "SMS"],
    updatedAtIso: hrs(6),
    owner: "Luis Romero",
    validationScore: 73,
  },
  {
    id: "cmp_nwcu_first_card",
    title: "Member First — Early-Career Members Credit Card",
    productLine: "Credit Cards",
    status: "approved",
    channels: ["Email", "Paid Social", "Connected TV"],
    updatedAtIso: hrs(27),
    owner: "Marcus Webb",
    validationScore: 95,
  },
  {
    id: "cmp_nwcu_member_refi",
    title: "Home Loan Refinance — Long-Tenure Member Homeowners",
    productLine: "Mortgages",
    status: "needs_changes",
    channels: ["Email", "Display Ads"],
    updatedAtIso: hrs(51),
    owner: "Priya Anand",
    validationScore: 64,
  },
  {
    id: "cmp_nwcu_savings_grad",
    title: "New Graduate Savings",
    productLine: "Savings",
    status: "live",
    channels: ["Email", "Connected TV", "Out of Home"],
    updatedAtIso: hrs(96),
    owner: "Sofia Reyes",
    validationScore: 92,
  },
  {
    id: "cmp_nwcu_smallbiz",
    title: "Public-Service Household Small Business Banking",
    productLine: "Business",
    status: "draft",
    channels: ["Landing Page", "Paid Social"],
    updatedAtIso: hrs(110),
    owner: "Aisha Carter",
    validationScore: 59,
  },
];

const dashboardKpis: DashboardKpis = {
  campaignsInDraft: 6,
  awaitingApproval: 2,
  brandIssuesFlagged: 3,
  contentPackagesGenerated: 19,
};

const contentVariants: ContentVariant[] = [
  {
    id: "cv_nw_em_01",
    channel: "Email",
    label: "Email • Variant A — Tribute-led",
    headline: "This Community Appreciation, we honor those who serve our communities.",
    subheadline: "And when you're ready, your refinance options are a few taps away.",
    body: "Community Appreciation is a moment to remember and to give thanks. As a member-owned credit union built for the public-service community, Northwind is here year-round. When the weekend settles, see whether refinancing your auto loan could lower your rate and keep more of every paycheck.",
    cta: "See refinance options",
    audienceNote: "Public-Service families & retirees 30–50; tribute-first, offer secondary.",
    complianceNote:
      "Includes NCUA and membership-eligibility disclosures. No guaranteed-rate language.",
    tone: "Warm, respectful, member-first",
  },
  {
    id: "cv_nw_em_02",
    channel: "Email",
    label: "Email • Variant B — Savings-led",
    headline: "Could you lower your auto loan rate?",
    subheadline: "Refinancing with your credit union takes minutes.",
    body: "Financed your vehicle at the dealer? You may be paying more than you need to. Members could lower their rate by refinancing with Northwind — and there's no fee to check. See what your options look like before the long weekend.",
    cta: "Check your rate",
    audienceNote: "Active-duty & enlisted 22–34; mobile-first, value-led.",
    complianceNote:
      "Uses 'could lower your rate' qualifier; representative APR example required in footer.",
    tone: "Crisp, modern, reassuring",
  },
  {
    id: "cv_nw_ps_01",
    channel: "Paid Social",
    label: "Paid Social • Variant A — Carousel",
    headline: "Serving those who serve.",
    body: "Card 1: A tribute to service. Card 2: The refinance benefit ('you may qualify to lower your rate'). Card 3: Membership and trust. Each card pairs a respectful moment with a soft CTA.",
    cta: "See refinance options",
    audienceNote: "Lookalike of recent refinance starters within the member base.",
    complianceNote:
      "Demo placeholder rule: keep tribute primary; attach representative APR example to any rate mention.",
    tone: "Respectful, optimistic",
  },
  {
    id: "cv_nw_ps_02",
    channel: "Paid Social",
    label: "Paid Social • Variant B — Single Image",
    headline: "Keep more of every paycheck.",
    body: "A single warm composition of a member and family beside their car in a suburban driveway at golden hour — paired with a clean two-line copy block and a benefit chip.",
    cta: "Check your rate",
    audienceNote: "Broad reach across active-duty and public-service families.",
    complianceNote: "Avoid uniform-forward composition; community motif preferred.",
    tone: "Cinematic, grounded",
  },
  {
    id: "cv_nw_lp_01",
    channel: "Landing Page",
    label: "Landing Page • Hero Concept",
    headline: "Honor the weekend. Then see if you could save.",
    subheadline:
      "Refinance your auto loan with a credit union built for the public-service community.",
    body: "Hero band: respectful tribute imagery, primary CTA. Middle band: three member signals (no fee to check, member-owned, trusted servicing). Lower band: member story reinforcing trust. Footer: NCUA, membership eligibility, and representative APR disclosures.",
    cta: "Check your rate",
    audienceNote: "Bridges paid social → refinance application funnel.",
    complianceNote: "Footer disclosure module (NCUA + membership + APR example) required.",
    tone: "Trustworthy, modern",
  },
  {
    id: "cv_nw_da_01",
    channel: "Display Ads",
    label: "Display • 300x250 — Performance",
    headline: "Lower your auto rate?",
    body: "Compact creative: warm member moment, benefit chip ('No fee to check'), CTA button. Pair with retargeting segment of refinance-page visitors.",
    cta: "Check your rate",
    audienceNote: "Retargeting recent refinance-page abandoners.",
    complianceNote:
      "Demo placeholder rule: ensure landing page disclosures mirror ad copy.",
    tone: "Action-oriented",
  },
  {
    id: "cv_nw_sms_01",
    channel: "SMS",
    label: "SMS • Holiday Window",
    headline: "Northwind: a quick refinance check?",
    body: "Honoring the weekend — and here when you're ready. See if you could lower your auto loan rate in minutes. Reply STOP to opt out, HELP for help. Msg & data rates may apply.",
    cta: "Check your rate",
    audienceNote: "Existing opt-in SMS member audience only.",
    complianceNote: "Includes STOP/HELP language and frequency-friendly tone.",
    tone: "Friendly, concise",
  },
  {
    id: "cv_nw_brief_01",
    channel: "Email",
    label: "Creative Brief • Snapshot",
    headline: "Community Appreciation Refinance — Creative Brief Snapshot",
    body: "Single-page snapshot of objective, audiences, key messages, channel matrix, must-have disclosures (NCUA, membership, representative APR), and creative do/don't list. Used for handoff to in-house studio and agency partners.",
    cta: "Open full brief",
    audienceNote: "Internal creative team handoff.",
    complianceNote:
      "Internal-only artifact; must reference required member disclosures.",
    tone: "Operational",
  },
];

const creativeConcepts: CreativeConcept[] = [
  {
    id: "vc_nw_01",
    title: "Homecoming Driveway",
    rationale:
      "A family welcoming a member home beside their car at golden hour. Conveys service, reunion, and steadiness without insignia or flag-forward imagery.",
    promptUsed:
      "Editorial photograph, a multigenerational family warmly welcoming a loved one home in a suburban driveway beside a modern sedan at golden hour, heartfelt and grounded, soft warm tones, no overlay text, no logos, no uniforms, badges, or seals.",
    style: "Editorial",
    channels: ["Paid Social", "Landing Page", "Display Ads"],
    moodTags: ["warm", "service", "trustworthy", "modern"],
    complianceStatus: "ready",
    thumbnailHue: "from-sky-200 via-indigo-200 to-amber-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_nw_02",
    title: "Open Road, New Orders",
    rationale:
      "Cinematic aerial of a highway at sunrise, a single vehicle in motion — the steadiness of a credit union that moves with its members. Neutral and brand-safe.",
    promptUsed:
      "Cinematic aerial photograph, a two-lane highway at sunrise curving toward a soft horizon, a lone modern sedan in motion, subtle warm gradient sky, no overlay text, no logos, no badges or seals.",
    style: "Cinematic",
    channels: ["Connected TV", "Paid Social"],
    moodTags: ["expansive", "steady", "modern"],
    complianceStatus: "ready",
    thumbnailHue: "from-indigo-300 via-sky-300 to-amber-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_nw_03",
    title: "Neighborhood Tribute",
    rationale:
      "Documentary-style image of a community gathering celebrating local public service — membership as the quiet backdrop to community. Avoids overt symbolism and insignia.",
    promptUsed:
      "Documentary-style photograph, a diverse suburban community gathering at dusk celebrating local public-service workers, string lights, respectful and warm, soft palette, no overlay text, no logos, no uniforms, badges, or seals.",
    style: "Documentary",
    channels: ["Email", "Landing Page"],
    moodTags: ["community", "warm", "respectful"],
    complianceStatus: "needs_review",
    complianceNote:
      "Confirm talent releases and that composition avoids insignia, seals, or implied endorsement.",
    thumbnailHue: "from-amber-200 via-sky-200 to-indigo-200",
    requiresHumanReview: true,
  },
];

const creativeToolStatus: CreativeToolStatus = {
  serviceName: "Studio Concept Gateway",
  vendor: "Anchor Creative (MCP-connected)",
  connectionStatus: "connected",
  lastSyncIso: mins(6),
  availableTools: [
    {
      name: "generate_concept_set",
      description:
        "Requests N styled concept directions from an external studio model. Returns rationales + prompt history only — no badges or seals or uniform generation.",
    },
    {
      name: "remix_concept",
      description:
        "Takes an approved concept and produces variations along a specified style or mood axis.",
    },
    {
      name: "request_approved_asset",
      description:
        "Routes a request to the asset management system for an approved, licensed brand or service asset.",
    },
    {
      name: "submit_to_review",
      description:
        "Submits the selected concept set to a human review queue with attached rationale and prompt history.",
    },
  ],
};

const approvalPackages: ApprovalPackage[] = [
  {
    id: "ap_nwcu_appreciation",
    briefId: "brief_nwcu_appreciation_refi",
    campaignTitle: "Community Appreciation — Auto Loan Refinance & Tribute",
    submittedBy: "Dana Brooks",
    submittedAtIso: hrs(4),
    status: "in_review",
    contentVariantIds: [
      "cv_nw_em_01",
      "cv_nw_em_02",
      "cv_nw_ps_01",
      "cv_nw_ps_02",
      "cv_nw_lp_01",
      "cv_nw_da_01",
      "cv_nw_sms_01",
    ],
    conceptIds: ["vc_nw_01", "vc_nw_02", "vc_nw_03"],
    validationSummary: { score: 88, blockers: 0, warnings: 2 },
    reviewers: [
      { name: "Renee Caldwell", role: "Member Brand Director", decision: "pending" },
      { name: "David Okafor", role: "Compliance & Regulatory (NCUA)", decision: "approve" },
      { name: "Avery Chen", role: "Creative Lead", decision: "pending" },
    ],
    comments: [
      {
        id: "cmt_nw_1",
        author: "David Okafor",
        role: "Compliance & Regulatory (NCUA)",
        timestampIso: mins(90),
        message:
          "NCUA and membership-eligibility disclosures look good. Confirm the representative APR example is attached to every rate mention before launch.",
        decision: "approve",
      },
      {
        id: "cmt_nw_2",
        author: "Renee Caldwell",
        role: "Member Brand Director",
        timestampIso: mins(25),
        message:
          "Love the tribute-first framing on concept #1. Let's keep the refinance offer secondary on concept #3 before I sign off — it leans a little promotional.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: hrs(4),
        label: "Package submitted",
        description: "Dana Brooks submitted 7 content variants and 3 visual concepts for review.",
      },
      {
        timestampIso: hrs(3),
        label: "Validation re-run",
        description: "Score: 88 / 100. 0 blockers, 2 warnings, 1 approval required.",
      },
      {
        timestampIso: hrs(2),
        label: "Compliance review complete",
        description: "David Okafor approved disclosures pending representative APR confirmation.",
      },
    ],
  },
  {
    id: "ap_nwcu_first_card",
    briefId: "brief_nwcu_first_card",
    campaignTitle: "Member First — Early-Career Members Credit Card",
    submittedBy: "Marcus Webb",
    submittedAtIso: hrs(28),
    status: "approved",
    contentVariantIds: ["cv_nw_em_01"],
    conceptIds: ["vc_nw_01"],
    validationSummary: { score: 95, blockers: 0, warnings: 1 },
    reviewers: [
      { name: "Renee Caldwell", role: "Member Brand Director", decision: "approve" },
      { name: "David Okafor", role: "Compliance & Regulatory (NCUA)", decision: "approve" },
    ],
    comments: [
      {
        id: "cmt_nw_b1",
        author: "Renee Caldwell",
        role: "Member Brand Director",
        timestampIso: hrs(25),
        message: "Clean, on-brand, member-first. Approved.",
        decision: "approve",
      },
    ],
    history: [
      {
        timestampIso: hrs(28),
        label: "Package submitted",
        description: "Marcus Webb submitted the starter card package for review.",
      },
      {
        timestampIso: hrs(24),
        label: "Approved",
        description: "All reviewers approved; package ready for trafficking.",
      },
    ],
  },
  {
    id: "ap_nwcu_member_refi",
    briefId: "brief_nwcu_member_refi",
    campaignTitle: "Home Loan Refinance — Long-Tenure Member Homeowners",
    submittedBy: "Priya Anand",
    submittedAtIso: hrs(52),
    status: "changes_requested",
    contentVariantIds: ["cv_nw_ps_01"],
    conceptIds: [],
    validationSummary: { score: 64, blockers: 1, warnings: 3 },
    reviewers: [
      { name: "Renee Caldwell", role: "Member Brand Director", decision: "request_changes" },
      { name: "David Okafor", role: "Compliance & Regulatory (NCUA)", decision: "request_changes" },
    ],
    comments: [
      {
        id: "cmt_nw_r1",
        author: "David Okafor",
        role: "Compliance & Regulatory (NCUA)",
        timestampIso: hrs(50),
        message:
          "Rate line currently implies a guarantee and the Equal Housing Lender statement is missing. Reframe with 'you may qualify' and add the mortgage disclosures.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: hrs(52),
        label: "Package submitted",
        description: "Priya Anand submitted the member refinance package.",
      },
      {
        timestampIso: hrs(50),
        label: "Changes requested",
        description: "Compliance flagged guaranteed-rate language and a missing Equal Housing Lender statement.",
      },
    ],
  },
];

const primaryValidation: ValidationResult = {
  briefId: "brief_nwcu_appreciation_refi",
  generatedAt: mins(12),
  overallStatus: "review_needed",
  score: 88,
  findings: [
    {
      id: "vf_nw_1",
      ruleId: "rule_nwcu_ncua_disclosure",
      ruleTitle: "NCUA insurance & Equal Housing Lender disclosure required",
      category: "disclaimer",
      severity: "approval_required",
      message:
        "NCUA disclosure is present on email and landing page, but missing on the display ad endcard module.",
      evidence: "Display 300x250 variant lacks the footer disclosure slot.",
      remediation:
        "Embed 'Federally insured by NCUA' in the display ad endcard module.",
      confidence: "high",
    },
    {
      id: "vf_nw_2",
      ruleId: "rule_nwcu_apr_claims",
      ruleTitle: "No guaranteed approval or absolute rate claims",
      category: "claims",
      severity: "warning",
      message:
        "'Could lower your rate' language is acceptable; ensure any specific APR references a representative example.",
      remediation: "Attach a representative APR example wherever a rate figure appears.",
      confidence: "high",
    },
    {
      id: "vf_nw_3",
      ruleId: "rule_nwcu_military_respect",
      ruleTitle: "Honor service respectfully — never commercialize sacrifice",
      category: "tone",
      severity: "warning",
      message:
        "Concept #3 (Neighborhood Tribute) leans warm and respectful; confirm the refinance offer stays secondary to the tribute.",
      remediation:
        "Keep tribute primary; make the offer a quiet, secondary element.",
      confidence: "medium",
    },
    {
      id: "vf_nw_4",
      ruleId: "rule_nwcu_restricted_imagery",
      ruleTitle: "No generative uniforms, badges, or official seals",
      category: "review",
      severity: "passed",
      message: "No generative uniform, badge, or seal likeness detected in concepts or copy.",
      confidence: "high",
    },
    {
      id: "vf_nw_5",
      ruleId: "rule_nwcu_human_review",
      ruleTitle: "Human review required for visual assets",
      category: "review",
      severity: "approval_required",
      message: "Visual assets must be reviewed by a member brand creative lead before production handoff.",
      remediation: "Route the concept package to the Creative Director queue.",
      confidence: "high",
    },
    {
      id: "vf_nw_6",
      ruleId: "rule_nwcu_membership_eligibility",
      ruleTitle: "Membership eligibility statement required",
      category: "disclaimer",
      severity: "passed",
      message: "Membership-eligibility language is present near product references.",
      confidence: "high",
    },
  ],
  approvalsRequired: [
    "NCUA disclosure on all channels (Compliance & Regulatory)",
    "Member brand creative lead sign-off on visual assets",
  ],
};

export const northwindTenant: Tenant = {
  id: "nwcu",
  name: "Northwind",
  legalName: "Northwind Credit Union",
  shortName: "Northwind",
  appName: "Northwind Marketing Campaign Agent",
  workspaceLabel: "Northwind Marketing",
  sidebarLabel: "Northwind • Marketing",
  tagline: "Member-owned credit union · marketing operations",
  vocabulary: {
    industry: "banking & lending",
    primaryProductLine: "Auto Loans",
    productNoun: "an auto loan",
    ctaVerb: "Apply",
    ctaPhrase: "Check your rate",
  },
  mascot: null,
  persona: {
    strategistTitle: "Northwind's senior marketing strategist AI",
    orchestratorTitle:
      "the Northwind Marketing Campaign Orchestrator — an AI marketing strategist embedded inside an internal workspace used by Northwind marketers",
    validatorTitle: "the Northwind Brand & Compliance Validator",
    contentTitle: "the Northwind Channel Content Generator",
    creativeDirectorTitle: "a senior creative director at Northwind Credit Union",
    brandValues: "membership, service, and trust",
    audienceContext:
      "Educators, nurses, first responders, and other public-service professionals and their families — served by a member-owned, not-for-profit credit union.",
    complianceMustNever: [
      "imply guaranteed loan approval or a guaranteed / lowest rate",
      "state an APR or savings figure without a representative example and a membership-eligibility note",
      "omit the 'Federally insured by NCUA' disclosure (and 'Equal Housing Lender' on mortgage content)",
      "generate or recreate service uniforms, employer badges, or official seals, or imply employer or government endorsement",
    ],
    complianceMustAlways: [
      "use 'could lower your rate' / 'you may qualify' framing rather than guarantees",
      "include membership-eligibility and NCUA disclosures whenever products, rates, or savings are referenced",
      "honor public service respectfully and keep any offer secondary to the tribute",
    ],
  },
  sanitizer: {
    brandReplacements: [
      { match: "Northwind\\s+Credit\\s+Union", replacement: "the credit union" },
      { match: "\\bNorthwind\\b", replacement: "the credit union" },
      { match: "\\bNWCU\\b", replacement: "the credit union" },
    ],
    mascotTerms: [],
    videoFallbackPrompt:
      "Cinematic montage of a multigenerational family reuniting with a loved one in a suburban driveway beside their car at golden hour. Warm light, heartfelt homecoming, gentle camera push-in. (Audio: warm, hopeful music.)",
  },
  prompts: {
    builderSample:
      "I want to build a Community Appreciation campaign for Northwind auto loan refinancing focused on early-career members and public-service families. I need paid social copy, email copy, a landing page concept, and 3 visual directions. Keep it respectful, modern, and member-first — honor service without commercializing it.",
    autopilotDefault:
      "Build me a Community Appreciation campaign for Northwind auto loan refinancing focused on public-service members and their families. I need paid social copy, email copy, a landing page concept, three visual directions, and a 12-second hero video for connected TV. Keep it respectful, modern, and member-first — honor those who serve our communities, community-led rather than symbol-led.",
    welcome:
      "Welcome to the Northwind Marketing Campaign Agent. Describe the campaign you want to build — product line, audience, timing, channels, tone — and I'll draft a brief alongside you. I'll only ask clarifying questions when something would unblock a brand or compliance check.",
    videoDownloadStem: "northwind-hero",
  },
  content: {
    brandRules,
    briefs,
    primaryBrief: appreciationRefiBrief,
    contentVariants,
    creativeConcepts,
    approvalPackages,
    primaryValidation,
    dashboardKpis,
    recentCampaigns,
    creativeToolStatus,
    brandPulse: [
      {
        label: "NCUA & Equal Housing disclosure",
        detail: "Auto-applied to Community Appreciation package",
        status: "ok",
      },
      {
        label: "Uniform imagery policy",
        detail: "Routed via approved asset workflow",
        status: "review",
      },
      {
        label: "Tribute tone balance",
        detail: "Honor-first framing prioritized — passing review",
        status: "warn",
      },
      {
        label: "SMS opt-in language",
        detail: "STOP/HELP language present in variants",
        status: "ok",
      },
      {
        label: "Visual asset human review",
        detail: "Awaiting Member Brand Director sign-off",
        status: "pending",
      },
    ],
    primaryUser: { name: "Dana Brooks", initials: "DB", role: "Sr. Marketing Manager" },
    dashboardGreeting: "Welcome back, Dana",
    dashboardDescription:
      "Two campaigns are awaiting your review and the Community Appreciation refinance package is one approval away from launch. Here's where the workspace stands today.",
  },
};
