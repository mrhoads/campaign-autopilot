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
 * Fabrikam tenant.
 *
 * A mutual insurance and financial services organization spanning auto, home,
 * life, pet, farm, business, and retirement solutions. No character mascot —
 * the brand's protected marks are the "F and Compass" service mark and the
 * "Fabrikam is here for you" jingle, neither of which may ever be
 * generatively recreated. Compliance posture reflects P&C advertising norms:
 * underwriting/availability language, substantiated savings claims, telematics
 * program terms, and affiliate underwriter disclosure for pet products.
 *
 * All content below is an illustrative demo placeholder and does not assume
 * access to Fabrikam's confidential brand guidelines.
 */

const now = Date.now();
const hrs = (h: number) => new Date(now - 1000 * 60 * 60 * h).toISOString();
const inDays = (d: number) => new Date(now + 1000 * 60 * 60 * 24 * d).toISOString();
const agoDays = (d: number) => new Date(now - 1000 * 60 * 60 * 24 * d).toISOString();
const mins = (m: number) => new Date(now - 1000 * 60 * m).toISOString();

const brandRules: BrandRule[] = [
  {
    id: "rule_fab_savings_claims",
    category: "claims",
    title: "Savings claims require an approved substantiation citation",
    description:
      "Bundle, multi-policy, or telematics savings figures must trace to an approved internal savings study and use 'could save' framing. Never state or imply a guaranteed savings amount or a guaranteed rate.",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Reframe as 'could save' and attach the approved savings-study citation to every figure.",
  },
  {
    id: "rule_fab_underwriting_disclosure",
    category: "disclaimer",
    title: "Underwriting & availability disclosure required",
    description:
      "Product-facing assets must carry the underwriting statement and note that products, coverages, and discounts are subject to underwriting review and are not available to all persons in all states.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation:
      "Add: 'Products underwritten by Fabrikam Insurance Group, Inc. and affiliated companies, Redmond, Washington. Subject to underwriting guidelines, review, and approval. Products and discounts not available in all states.'",
  },
  {
    id: "rule_fab_marks_and_jingle",
    category: "mascot",
    title: "Never generate the F and Compass mark or the 'Here For You' jingle",
    description:
      "Generative recreation of the Fabrikam F and Compass service mark, wordmark, or the 'Fabrikam is here for you' jingle audio is prohibited. Celebrity endorser likeness and voice are equally off limits. Approved licensed assets only.",
    demoPlaceholder: true,
    severity: "blocker",
    remediation:
      "Route logo, wordmark, jingle, and endorser assets through the approved asset management workflow for a licensed render.",
  },
  {
    id: "rule_fab_telematics_terms",
    category: "disclaimer",
    title: "Telematics program terms must accompany SmartDrive-style claims",
    description:
      "Usage-based / telematics discount references must state that enrollment, discount amount, and availability vary by state and that program terms apply.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Append 'Enrollment, discount, and availability vary by state. Program terms apply.' near telematics claims.",
  },
  {
    id: "rule_fab_pet_underwriter",
    category: "disclaimer",
    title: "Pet products require affiliate underwriter disclosure",
    description:
      "Pet insurance creative must disclose that products are underwritten by a Fabrikam affiliate and that terms, conditions, exclusions, and waiting periods apply.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Add the affiliate underwriter line plus 'Terms, conditions, exclusions, and waiting periods apply.'",
  },
  {
    id: "rule_fab_tone_advocacy",
    category: "tone",
    title: "Protection-first tone — never trade on fear",
    description:
      "Copy should lead with protection, preparation, and advocacy. Avoid fear-based framing, catastrophe imagery, or urgency tactics that pressure a coverage decision.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Reframe loss scenarios as preparedness and advocacy; keep the offer calm and secondary.",
  },
  {
    id: "rule_fab_accessibility",
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
    id: "rule_fab_sms_optin",
    category: "channel",
    title: "SMS messages require opt-in language",
    description:
      "SMS variants must reference prior opt-in, message frequency, and STOP/HELP instructions in line with carrier and TCPA expectations.",
    demoPlaceholder: true,
    severity: "warning",
    remediation:
      "Append 'Reply STOP to opt out, HELP for help. Msg & data rates may apply.' to the variant.",
  },
  {
    id: "rule_fab_human_review",
    category: "review",
    title: "Human review required for visual assets",
    description:
      "Generative visual concepts must be reviewed by a brand creative lead before production handoff or external publishing.",
    demoPlaceholder: true,
    severity: "approval_required",
    remediation: "Send concept package to Creative Director queue in Approval Center.",
  },
];

const backToSchoolBrief: CampaignBrief = {
  id: "brief_fab_back_to_school",
  requestId: "req_fab_back_to_school",
  title: "Back to School — Teen Driver Safety & Auto + Home Bundle",
  objective:
    "Drive a 12% lift in multi-policy (auto + home) quote starts during the back-to-school window by pairing teen driver safety resources with bundle value — protection-first, never fear-based.",
  productLine: "Auto & Home",
  audiences: [
    {
      label: "Parents of New Drivers 40–55",
      description:
        "Households adding a teen to the policy this fall — highly motivated by safety tools and by managing the premium impact.",
      estimatedReach: "3.1M",
    },
    {
      label: "Bundle-Ready Homeowners 35–54",
      description:
        "Existing auto-only customers with a mortgage, receptive to consolidating home and auto with one carrier.",
      estimatedReach: "2.4M",
    },
  ],
  keyMessages: [
    {
      headline: "New driver in the house? We're right here for this one, too.",
      rationale:
        "Leads with advocacy and reassurance rather than risk, anchoring the brand promise.",
    },
    {
      headline: "Teen driver tools, coaching, and a safe-driving discount — in one app.",
      rationale:
        "Positions telematics and safety resources as practical utility, not surveillance.",
    },
    {
      headline: "Customers who bundle auto and home could save.",
      rationale:
        "Uses 'could save' framing so the claim can carry an approved substantiation citation.",
    },
  ],
  channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
  ctaOptions: [
    { label: "Get a quote", destination: "/quote/bundle", channelHint: "Landing Page" },
    { label: "See bundle savings", destination: "/bundle", channelHint: "Email" },
    { label: "Explore teen driver tools", destination: "/teen-driver?utm=bts", channelHint: "Paid Social" },
  ],
  timeline: {
    kickoff: agoDays(4),
    launch: inDays(5),
    wrap: inDays(21),
  },
  kpis: [
    {
      name: "Multi-policy quote starts (incremental)",
      target: "+12% vs prior 14-day baseline",
      rationale: "Primary commercial outcome for the back-to-school window.",
    },
    {
      name: "Email CTR",
      target: "≥ 3.9%",
      rationale: "Benchmarks against last year's back-to-school program.",
    },
    {
      name: "Cost per bound policy",
      target: "≤ $185",
      rationale: "Efficiency guardrail for paid acquisition.",
    },
    {
      name: "Teen driver tool enrollments",
      target: "+15%",
      rationale: "Engagement proof that safety utility — not just price — is landing.",
    },
  ],
  risks: [
    {
      title: "Safety message reads as fear-based",
      severity: "medium",
      mitigation:
        "Lead with preparation, coaching, and advocacy. No crash imagery, no urgency countdowns.",
    },
    {
      title: "Unsubstantiated bundle savings figure",
      severity: "high",
      mitigation:
        "Use 'could save' framing and attach the approved savings-study citation wherever a figure appears.",
    },
    {
      title: "Generative recreation of the F and Compass mark",
      severity: "high",
      mitigation:
        "Block logo/wordmark generation and route to approved asset management for licensed renders.",
    },
    {
      title: "Telematics framing perceived as surveillance",
      severity: "medium",
      mitigation:
        "Frame as coaching and shared visibility for the family; state that enrollment and discounts vary by state.",
    },
  ],
  requiredDisclaimers: [
    "Products underwritten by Fabrikam Insurance Group, Inc. and affiliated companies, Redmond, Washington. Subject to underwriting guidelines, review, and approval. Products and discounts not available to all persons in all states.",
    "Savings compared with stand-alone policies. Actual savings vary. Discounts and eligibility vary by state.",
    "Telematics enrollment, discount amount, and availability vary by state. Program terms apply.",
    "Fabrikam, the Fabrikam F and Compass, and Fabrikam is here for you are service marks of Fabrikam Insurance Group, Inc..",
  ],
  creativeNotes: [
    "Warm, everyday family moments — driveway, kitchen table, first solo drive. Calm and reassuring.",
    "No crash, damage, or catastrophe imagery. Protection-first, never fear-first.",
    "No generative recreation of the F and Compass mark, wordmark, jingle audio, or endorser likeness.",
  ],
  status: "in_review",
  updatedAt: mins(11),
  completeness: 0.91,
};

const fallHomeBrief: CampaignBrief = {
  id: "brief_fab_fall_home",
  requestId: "req_fab_fall_home",
  title: "Fall Home Readiness — Protect What You've Built",
  objective:
    "Increase engagement with the home maintenance and coverage-review toolkit ahead of winter weather, lifting home policy reviews and endorsement adds.",
  productLine: "Homeowners",
  audiences: [
    {
      label: "Homeowners 35–64",
      description:
        "Long-tenure homeowners whose coverage may not reflect recent renovations or rebuild-cost inflation.",
      estimatedReach: "2.9M",
    },
    {
      label: "First-Year Homeowners",
      description:
        "Recent buyers navigating their first seasonal maintenance cycle and unsure what their policy covers.",
      estimatedReach: "780K",
    },
  ],
  keyMessages: [
    {
      headline: "A little fall prep goes a long way.",
      rationale: "Utility-led, calm entry point that avoids catastrophe framing.",
    },
    {
      headline: "Renovated this year? Your coverage should know about it.",
      rationale: "Drives the coverage-review action without pressure tactics.",
    },
  ],
  channels: ["Email", "Landing Page", "SMS"],
  ctaOptions: [
    { label: "Open the fall checklist", destination: "/home/fall-checklist" },
    { label: "Review your coverage", destination: "/home/review" },
  ],
  timeline: {
    kickoff: agoDays(2),
    launch: inDays(12),
    wrap: inDays(50),
  },
  kpis: [
    {
      name: "Coverage reviews started",
      target: "+16% vs baseline",
      rationale: "Primary engagement outcome for the seasonal program.",
    },
    {
      name: "Toolkit page depth",
      target: "+20%",
      rationale: "Indicates the maintenance content is resonating.",
    },
  ],
  risks: [
    {
      title: "Weather content drifts into fear-based framing",
      severity: "medium",
      mitigation: "Show preparation and craftsmanship, not damage or loss.",
    },
  ],
  requiredDisclaimers: [
    "Products underwritten by Fabrikam Insurance Group, Inc. and affiliated companies, Redmond, Washington. Subject to underwriting guidelines, review, and approval.",
    "Coverage availability and endorsements vary by state. Standard SMS opt-in, frequency, and STOP/HELP instructions required.",
  ],
  creativeNotes: [
    "Daylight, lived-in homes; gutters, porches, and family routines rather than storm damage.",
    "Keep the coverage-review CTA helpful and low-pressure.",
  ],
  status: "draft",
  updatedAt: hrs(6),
  completeness: 0.7,
};

const petWellnessBrief: CampaignBrief = {
  id: "brief_fab_pet_wellness",
  requestId: "req_fab_pet_wellness",
  title: "New Pet Parent — Wellness & Pet Insurance Onboarding",
  objective:
    "Grow pet policy adoption among first-time pet parents by pairing early-life vet guidance with straightforward coverage education.",
  productLine: "Pet",
  audiences: [
    {
      label: "First-Time Pet Parents 25–40",
      description:
        "Recently adopted a puppy or kitten; high search intent around vet costs and wellness plans.",
      estimatedReach: "1.6M",
    },
  ],
  keyMessages: [
    {
      headline: "Their first year is a big one. Be ready for it.",
      rationale: "Preparation-led, warm, and free of fear framing.",
    },
    {
      headline: "Coverage that helps you say yes to the vet's recommendation.",
      rationale: "Reframes insurance as enabling care rather than avoiding loss.",
    },
  ],
  channels: ["Email", "Paid Social", "Connected TV"],
  ctaOptions: [
    { label: "See pet plans", destination: "/pet" },
    { label: "Get a pet quote", destination: "/pet/quote" },
  ],
  timeline: {
    kickoff: agoDays(9),
    launch: agoDays(2),
    wrap: inDays(28),
  },
  kpis: [
    { name: "Pet quote starts", target: "+24%", rationale: "Primary KPI." },
    {
      name: "Multi-product attach rate",
      target: "+1.8 pts",
      rationale: "Tracks relationship value beyond the first policy.",
    },
  ],
  risks: [
    {
      title: "Coverage limits implied to be unlimited",
      severity: "high",
      mitigation:
        "State that terms, conditions, exclusions, and waiting periods apply, with the affiliate underwriter disclosure.",
    },
  ],
  requiredDisclaimers: [
    "Pet insurance products are underwritten by a Fabrikam affiliate. Terms, conditions, exclusions, and waiting periods apply.",
    "Products and discounts not available to all persons in all states.",
  ],
  creativeNotes: [
    "Bright, joyful, mobile-first; real puppies and kittens in everyday home moments.",
  ],
  status: "approved",
  updatedAt: hrs(26),
  completeness: 1,
};

const briefs: CampaignBrief[] = [
  backToSchoolBrief,
  fallHomeBrief,
  petWellnessBrief,
];

const recentCampaigns: RecentCampaignSummary[] = [
  {
    id: "cmp_fab_back_to_school",
    title: "Back to School — Teen Driver Safety & Auto + Home Bundle",
    productLine: "Auto & Home",
    status: "in_review",
    channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
    updatedAtIso: mins(38),
    owner: "Alex Rivera",
    validationScore: 87,
  },
  {
    id: "cmp_fab_fall_home",
    title: "Fall Home Readiness — Protect What You've Built",
    productLine: "Homeowners",
    status: "draft",
    channels: ["Email", "Landing Page", "SMS"],
    updatedAtIso: hrs(7),
    owner: "Megan Doyle",
    validationScore: 71,
  },
  {
    id: "cmp_fab_pet_wellness",
    title: "New Pet Parent — Wellness & Pet Insurance Onboarding",
    productLine: "Pet",
    status: "approved",
    channels: ["Email", "Paid Social", "Connected TV"],
    updatedAtIso: hrs(26),
    owner: "Chris Okonkwo",
    validationScore: 94,
  },
  {
    id: "cmp_fab_life_moments",
    title: "Life Moments — Term Life for Growing Families",
    productLine: "Life",
    status: "needs_changes",
    channels: ["Email", "Display Ads"],
    updatedAtIso: hrs(49),
    owner: "Priya Raman",
    validationScore: 62,
  },
  {
    id: "cmp_fab_smartdrive",
    title: "SmartDrive — Safe Driving Discount Enrollment",
    productLine: "Auto",
    status: "live",
    channels: ["Email", "Connected TV", "Out of Home"],
    updatedAtIso: hrs(92),
    owner: "Daniel Kim",
    validationScore: 91,
  },
  {
    id: "cmp_fab_smallbiz",
    title: "Main Street Small Business Coverage",
    productLine: "Business",
    status: "draft",
    channels: ["Landing Page", "Paid Social"],
    updatedAtIso: hrs(115),
    owner: "Tasha Bell",
    validationScore: 57,
  },
];

const dashboardKpis: DashboardKpis = {
  campaignsInDraft: 7,
  awaitingApproval: 3,
  brandIssuesFlagged: 4,
  contentPackagesGenerated: 23,
};

const contentVariants: ContentVariant[] = [
  {
    id: "cv_fab_em_01",
    channel: "Email",
    label: "Email • Variant A — Safety-led",
    headline: "New driver in the house? We're right here for this one, too.",
    subheadline: "Teen driver tools, coaching, and a safe-driving discount in one app.",
    body: "Handing over the keys is a milestone — and a lot of new questions. Fabrikam gives your family shared visibility into driving habits, coaching tips for the trickier moments, and a path to a safe-driving discount. Add your new driver, see how coverage changes, and get set up before the first school run.",
    cta: "Explore teen driver tools",
    audienceNote: "Parents of new drivers 40–55; reassurance-first, utility-forward.",
    complianceNote:
      "Includes underwriting/availability disclosure. Telematics terms required near discount mention.",
    tone: "Warm, reassuring, practical",
  },
  {
    id: "cv_fab_em_02",
    channel: "Email",
    label: "Email • Variant B — Bundle-led",
    headline: "One carrier. Auto and home. Less to keep track of.",
    subheadline: "Customers who bundle could save — and you get one place to manage it all.",
    body: "Adding a driver is a good moment to look at the whole picture. Bundling auto and home means one carrier, one point of contact, and one less thing on the fall to-do list. Customers who bundle could save — see what your combination looks like in about three minutes.",
    cta: "See bundle savings",
    audienceNote: "Bundle-ready homeowners 35–54; value and simplicity.",
    complianceNote:
      "'Could save' framing used; approved savings-study citation required in footer.",
    tone: "Crisp, modern, confident",
  },
  {
    id: "cv_fab_ps_01",
    channel: "Paid Social",
    label: "Paid Social • Variant A — Carousel",
    headline: "First solo drive. First real conversation about coverage.",
    body: "Card 1: The milestone moment in the driveway. Card 2: The teen driver tools and coaching. Card 3: The bundle benefit ('customers who bundle could save'). Each card pairs one calm image with a single line of copy and a soft CTA.",
    cta: "Explore teen driver tools",
    audienceNote: "Lookalike of recent multi-policy quote starters.",
    complianceNote:
      "Demo placeholder rule: keep safety utility primary; attach savings citation to any figure.",
    tone: "Optimistic, grounded",
  },
  {
    id: "cv_fab_ps_02",
    channel: "Paid Social",
    label: "Paid Social • Variant B — Single Image",
    headline: "Here for the big firsts.",
    body: "A single warm composition — a parent and teen beside the family car in a suburban driveway on a late-summer morning — with a clean two-line copy block and a benefit chip.",
    cta: "Get a quote",
    audienceNote: "Broad reach across parents of high-school-age children.",
    complianceNote:
      "No logo, wordmark, or jingle reference in generated composition. Approved assets only.",
    tone: "Cinematic, everyday",
  },
  {
    id: "cv_fab_lp_01",
    channel: "Landing Page",
    label: "Landing Page • Hero Concept",
    headline: "Get your new driver — and your coverage — ready for the school year.",
    subheadline:
      "Teen driver tools, a safe-driving discount, and bundle value in one place.",
    body: "Hero band: driveway milestone image, primary quote CTA. Middle band: three proof points (teen driver coaching, safe-driving discount, auto + home bundle). Lower band: a short customer story about adding a first driver. Footer: underwriting, savings substantiation, and telematics disclosure module.",
    cta: "Get a quote",
    audienceNote: "Bridges paid social → multi-policy quote funnel.",
    complianceNote:
      "Footer disclosure module (underwriting + savings citation + telematics terms) required.",
    tone: "Trustworthy, modern",
  },
  {
    id: "cv_fab_da_01",
    channel: "Display Ads",
    label: "Display • 300x250 — Performance",
    headline: "Adding a teen driver?",
    body: "Compact creative: calm driveway moment, benefit chip ('Safe-driving discount available'), CTA button. Pair with a retargeting segment of teen-driver page visitors.",
    cta: "Get a quote",
    audienceNote: "Retargeting recent teen-driver and bundle page abandoners.",
    complianceNote:
      "Demo placeholder rule: endcard must carry the underwriting disclosure module.",
    tone: "Action-oriented",
  },
  {
    id: "cv_fab_sms_01",
    channel: "SMS",
    label: "SMS • Back-to-School Window",
    headline: "Fabrikam: adding a driver this fall?",
    body: "School's almost back. Add your new driver, see how coverage changes, and check the safe-driving discount in a few taps. Reply STOP to opt out, HELP for help. Msg & data rates may apply.",
    cta: "Explore teen driver tools",
    audienceNote: "Existing opt-in SMS customer audience only.",
    complianceNote: "Includes STOP/HELP language and frequency-friendly tone.",
    tone: "Friendly, concise",
  },
  {
    id: "cv_fab_brief_01",
    channel: "Email",
    label: "Creative Brief • Snapshot",
    headline: "Back to School Bundle — Creative Brief Snapshot",
    body: "Single-page snapshot of objective, audiences, key messages, channel matrix, must-have disclosures (underwriting, savings substantiation, telematics terms), and the creative do/don't list including the no-generative-marks rule. Used for handoff to the in-house studio and agency partners.",
    cta: "Open full brief",
    audienceNote: "Internal creative team handoff.",
    complianceNote:
      "Internal-only artifact; must reference all required disclosures and the marks policy.",
    tone: "Operational",
  },
];

const creativeConcepts: CreativeConcept[] = [
  {
    id: "vc_fab_01",
    title: "First Solo Drive",
    rationale:
      "A parent handing over keys beside the family car on a late-summer morning. Captures the milestone with warmth and advocacy — no risk framing, no marks.",
    promptUsed:
      "Editorial photograph, a parent handing car keys to a teenager beside a modern sedan in a suburban driveway on a bright late-summer morning, warm and hopeful, natural light, shallow depth of field, no overlay text, no logos, no emblems or brand marks.",
    style: "Editorial",
    channels: ["Paid Social", "Landing Page", "Display Ads"],
    moodTags: ["warm", "milestone", "trustworthy", "everyday"],
    complianceStatus: "ready",
    thumbnailHue: "from-sky-200 via-blue-300 to-amber-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_fab_02",
    title: "The Morning Route",
    rationale:
      "Cinematic tracking shot of a tree-lined neighborhood street at sunrise as the school-year routine begins. Neutral, brand-safe, and free of any protected mark.",
    promptUsed:
      "Cinematic photograph, a tree-lined suburban street at sunrise with soft golden light, a modern sedan pulling away from a driveway, calm and optimistic mood, no overlay text, no logos, no emblems.",
    style: "Cinematic",
    channels: ["Connected TV", "Paid Social"],
    moodTags: ["calm", "routine", "modern"],
    complianceStatus: "ready",
    thumbnailHue: "from-blue-300 via-sky-300 to-amber-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_fab_03",
    title: "Kitchen Table Checklist",
    rationale:
      "Documentary-style image of a family reviewing a checklist together — positions coverage as shared preparation rather than a transaction.",
    promptUsed:
      "Documentary-style photograph, a family at a kitchen table reviewing a paper checklist together on a bright morning, natural window light, candid and warm, soft palette, no overlay text, no logos, no emblems or brand marks.",
    style: "Documentary",
    channels: ["Email", "Landing Page"],
    moodTags: ["candid", "prepared", "family"],
    complianceStatus: "needs_review",
    complianceNote:
      "Confirm talent releases and that no on-screen document, screen, or garment implies a brand mark or endorsement.",
    thumbnailHue: "from-amber-200 via-sky-200 to-blue-300",
    requiresHumanReview: true,
  },
];

const creativeToolStatus: CreativeToolStatus = {
  serviceName: "Studio Concept Gateway",
  vendor: "Anchor Creative (MCP-connected)",
  connectionStatus: "connected",
  lastSyncIso: mins(5),
  availableTools: [
    {
      name: "generate_concept_set",
      description:
        "Requests N styled concept directions from an external studio model. Returns rationales + prompt history only — never brand marks, wordmarks, or endorser likeness.",
    },
    {
      name: "remix_concept",
      description:
        "Takes an approved concept and produces variations along a specified style or mood axis.",
    },
    {
      name: "request_approved_asset",
      description:
        "Routes a request to the asset management system for an approved, licensed brand asset (F and Compass mark, wordmark, jingle bed, endorser footage).",
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
    id: "ap_fab_back_to_school",
    briefId: "brief_fab_back_to_school",
    campaignTitle: "Back to School — Teen Driver Safety & Auto + Home Bundle",
    submittedBy: "Alex Rivera",
    submittedAtIso: hrs(4),
    status: "in_review",
    contentVariantIds: [
      "cv_fab_em_01",
      "cv_fab_em_02",
      "cv_fab_ps_01",
      "cv_fab_ps_02",
      "cv_fab_lp_01",
      "cv_fab_da_01",
      "cv_fab_sms_01",
    ],
    conceptIds: ["vc_fab_01", "vc_fab_02", "vc_fab_03"],
    validationSummary: { score: 87, blockers: 0, warnings: 3 },
    reviewers: [
      { name: "Karen Whitfield", role: "Brand Director", decision: "pending" },
      { name: "Marcus Hale", role: "Advertising Compliance & Legal", decision: "approve" },
      { name: "Elena Ruiz", role: "Creative Lead", decision: "pending" },
    ],
    comments: [
      {
        id: "cmt_fab_1",
        author: "Marcus Hale",
        role: "Advertising Compliance & Legal",
        timestampIso: mins(85),
        message:
          "Underwriting and availability language reads correctly. Confirm the approved savings-study citation is attached everywhere the bundle claim appears, including the 300x250 endcard.",
        decision: "approve",
      },
      {
        id: "cmt_fab_2",
        author: "Karen Whitfield",
        role: "Brand Director",
        timestampIso: mins(22),
        message:
          "Concept #1 nails the on-your-side feeling. Before I sign off, confirm nothing in concept #3 reads as a stand-in for the F and Compass mark — the framed art on the wall is close.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: hrs(4),
        label: "Package submitted",
        description: "Alex Rivera submitted 7 content variants and 3 visual concepts for review.",
      },
      {
        timestampIso: hrs(3),
        label: "Validation re-run",
        description: "Score: 87 / 100. 0 blockers, 3 warnings, 2 approvals required.",
      },
      {
        timestampIso: hrs(2),
        label: "Compliance review complete",
        description:
          "Marcus Hale approved disclosures pending savings-citation confirmation on display.",
      },
    ],
  },
  {
    id: "ap_fab_pet_wellness",
    briefId: "brief_fab_pet_wellness",
    campaignTitle: "New Pet Parent — Wellness & Pet Insurance Onboarding",
    submittedBy: "Chris Okonkwo",
    submittedAtIso: hrs(30),
    status: "approved",
    contentVariantIds: ["cv_fab_em_01"],
    conceptIds: ["vc_fab_01"],
    validationSummary: { score: 94, blockers: 0, warnings: 1 },
    reviewers: [
      { name: "Karen Whitfield", role: "Brand Director", decision: "approve" },
      { name: "Marcus Hale", role: "Advertising Compliance & Legal", decision: "approve" },
    ],
    comments: [
      {
        id: "cmt_fab_p1",
        author: "Karen Whitfield",
        role: "Brand Director",
        timestampIso: hrs(27),
        message: "Joyful, clear, and the affiliate underwriter line is in place. Approved.",
        decision: "approve",
      },
    ],
    history: [
      {
        timestampIso: hrs(30),
        label: "Package submitted",
        description: "Chris Okonkwo submitted the pet onboarding package for review.",
      },
      {
        timestampIso: hrs(26),
        label: "Approved",
        description: "All reviewers approved; package ready for trafficking.",
      },
    ],
  },
  {
    id: "ap_fab_life_moments",
    briefId: "brief_fab_life_moments",
    campaignTitle: "Life Moments — Term Life for Growing Families",
    submittedBy: "Priya Raman",
    submittedAtIso: hrs(50),
    status: "changes_requested",
    contentVariantIds: ["cv_fab_ps_01"],
    conceptIds: [],
    validationSummary: { score: 62, blockers: 1, warnings: 3 },
    reviewers: [
      { name: "Karen Whitfield", role: "Brand Director", decision: "request_changes" },
      { name: "Marcus Hale", role: "Advertising Compliance & Legal", decision: "request_changes" },
    ],
    comments: [
      {
        id: "cmt_fab_l1",
        author: "Marcus Hale",
        role: "Advertising Compliance & Legal",
        timestampIso: hrs(48),
        message:
          "The rate line implies guaranteed issue and the underwriting statement is missing. Reframe with 'you may qualify' and add the full underwriting and state-availability disclosure.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: hrs(50),
        label: "Package submitted",
        description: "Priya Raman submitted the term life package.",
      },
      {
        timestampIso: hrs(48),
        label: "Changes requested",
        description:
          "Compliance flagged guaranteed-issue language and a missing underwriting disclosure.",
      },
    ],
  },
];

const primaryValidation: ValidationResult = {
  briefId: "brief_fab_back_to_school",
  generatedAt: mins(9),
  overallStatus: "review_needed",
  score: 87,
  findings: [
    {
      id: "vf_fab_1",
      ruleId: "rule_fab_underwriting_disclosure",
      ruleTitle: "Underwriting & availability disclosure required",
      category: "disclaimer",
      severity: "approval_required",
      message:
        "Underwriting and state-availability language is present on email and landing page but missing from the display ad endcard module.",
      evidence: "Display 300x250 variant lacks the footer disclosure slot.",
      remediation:
        "Embed the underwriting and 'not available in all states' statement in the display endcard module.",
      confidence: "high",
    },
    {
      id: "vf_fab_2",
      ruleId: "rule_fab_savings_claims",
      ruleTitle: "Savings claims require an approved substantiation citation",
      category: "claims",
      severity: "warning",
      message:
        "'Customers who bundle could save' is acceptable framing; every instance still needs the approved savings-study citation attached.",
      remediation:
        "Attach the approved savings-study citation wherever the bundle claim appears.",
      confidence: "high",
    },
    {
      id: "vf_fab_3",
      ruleId: "rule_fab_telematics_terms",
      ruleTitle: "Telematics program terms must accompany SmartDrive-style claims",
      category: "disclaimer",
      severity: "warning",
      message:
        "Safe-driving discount is referenced in the email and SMS variants without the state-variation and program-terms note.",
      remediation:
        "Append 'Enrollment, discount, and availability vary by state. Program terms apply.' near each telematics mention.",
      confidence: "high",
    },
    {
      id: "vf_fab_4",
      ruleId: "rule_fab_marks_and_jingle",
      ruleTitle: "Never generate the F and Compass mark or the 'Here For You' jingle",
      category: "mascot",
      severity: "passed",
      message:
        "No generative recreation of the F and Compass mark, wordmark, jingle audio, or endorser likeness detected in concepts or copy.",
      confidence: "high",
    },
    {
      id: "vf_fab_5",
      ruleId: "rule_fab_tone_advocacy",
      ruleTitle: "Protection-first tone — never trade on fear",
      category: "tone",
      severity: "warning",
      message:
        "Teen driver framing stays supportive; confirm the paid social carousel keeps coaching primary over risk language.",
      remediation: "Keep advocacy and utility primary; no crash or damage imagery.",
      confidence: "medium",
    },
    {
      id: "vf_fab_6",
      ruleId: "rule_fab_human_review",
      ruleTitle: "Human review required for visual assets",
      category: "review",
      severity: "approval_required",
      message:
        "Visual assets must be reviewed by a brand creative lead before production handoff.",
      remediation: "Route the concept package to the Creative Director queue.",
      confidence: "high",
    },
  ],
  approvalsRequired: [
    "Underwriting & availability disclosure on all channels (Advertising Compliance & Legal)",
    "Brand creative lead sign-off on visual assets",
  ],
};

export const fabrikamTenant: Tenant = {
  id: "fabrikam",
  name: "Fabrikam",
  legalName: "Fabrikam Insurance Group, Inc.",
  shortName: "Fabrikam",
  appName: "Fabrikam Marketing Campaign Agent",
  workspaceLabel: "Fabrikam Marketing",
  sidebarLabel: "Fabrikam • Marketing",
  tagline: "Insurance & financial services · marketing operations",
  vocabulary: {
    industry: "insurance and financial services",
    primaryProductLine: "Auto & Home",
    productNoun: "auto and home coverage",
    ctaVerb: "Quote",
    ctaPhrase: "Get a quote",
  },
  mascot: null,
  persona: {
    strategistTitle: "Fabrikam's senior marketing strategist AI",
    orchestratorTitle:
      "the Fabrikam Marketing Campaign Orchestrator — an AI marketing strategist embedded inside an internal workspace used by Fabrikam marketers",
    validatorTitle: "the Fabrikam Brand & Compliance Validator",
    contentTitle: "the Fabrikam Channel Content Generator",
    creativeDirectorTitle: "a senior creative director at Fabrikam",
    brandValues: "protection, advocacy, and standing with the customer",
    audienceContext:
      "Everyday American households and small business owners protecting what matters — families adding drivers, homeowners, pet parents, and members planning for the long term.",
    complianceMustNever: [
      "state or imply a guaranteed rate, guaranteed savings amount, or guaranteed approval / issue",
      "cite a bundle, multi-policy, or telematics savings figure without the approved substantiation citation",
      "omit the underwriting and 'products and discounts not available in all states' disclosure on product-facing copy",
      "generate or recreate the Fabrikam F and Compass mark, the wordmark, the 'Fabrikam is here for you' jingle, or celebrity endorser likeness or voice",
      "use fear-based, catastrophe, or high-pressure urgency framing to sell coverage",
    ],
    complianceMustAlways: [
      "use 'could save' / 'you may qualify' framing rather than guarantees",
      "include the underwriting and state-availability disclosure whenever products, rates, discounts, or savings are referenced",
      "add telematics program terms near any safe-driving discount reference and the affiliate underwriter line on pet content",
      "lead with protection and advocacy, keeping the offer calm and secondary",
    ],
  },
  sanitizer: {
    brandReplacements: [
      { match: "Fabrikam\\s+Insurance\\s+Group", replacement: "the insurer" },
      { match: "Fabrikam\\s+is\\s+here\\s+for\\s+you", replacement: "a reassuring brand promise" },
      { match: "\\bhere\\s+for\\s+you\\b", replacement: "supportive" },
      { match: "\\bF\\s+and\\s+Compass\\b", replacement: "" },
      { match: "\\bFabrikam\\b", replacement: "the brand" },
    ],
    mascotTerms: [
      "f and compass",
      "compass emblem",
      "compass logo",
      "compass mark",
      "wordmark",
      "jingle",
      "celebrity endorser",
      "endorser",
      "mascot",
      "cartoon character",
      "animated character",
      "anthropomorphic",
    ],
    videoFallbackPrompt:
      "Cinematic montage of a parent and teenager beside the family car in a suburban driveway on a bright late-summer morning, warm natural light, a hopeful milestone moment, gentle camera push-in. (Audio: warm, optimistic music.)",
  },
  prompts: {
    builderSample:
      "I want to build a back-to-school campaign for Fabrikam focused on parents adding a teen driver, pairing teen driver safety tools with auto + home bundle value. I need paid social copy, email copy, a landing page concept, and 3 visual directions. Keep it warm, protection-first, and never fear-based.",
    autopilotDefault:
      "Build me a back-to-school campaign for Fabrikam focused on parents adding a teen driver and bundle-ready homeowners. I need paid social copy, email copy, a landing page concept, three visual directions, and a 12-second hero video for connected TV. Keep it warm and protection-first — advocacy over fear, everyday family moments, no brand marks in generated assets.",
    welcome:
      "Welcome to the Fabrikam Marketing Campaign Agent. Describe the campaign you want to build — product line, audience, timing, channels, tone — and I'll draft a brief alongside you. I'll only ask clarifying questions when something would unblock a brand or compliance check.",
    videoDownloadStem: "fabrikam-hero",
  },
  content: {
    brandRules,
    briefs,
    primaryBrief: backToSchoolBrief,
    contentVariants,
    creativeConcepts,
    approvalPackages,
    primaryValidation,
    dashboardKpis,
    recentCampaigns,
    creativeToolStatus,
    brandPulse: [
      {
        label: "Underwriting & availability disclosure",
        detail: "Auto-applied to back-to-school package",
        status: "ok",
      },
      {
        label: "F and Compass / jingle policy",
        detail: "Generation blocked — routed via approved asset workflow",
        status: "review",
      },
      {
        label: "Bundle savings substantiation",
        detail: "'Could save' framing in place — citation pending on display",
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
    primaryUser: { name: "Alex Rivera", initials: "AR", role: "Sr. Marketing Manager" },
    dashboardGreeting: "Welcome back, Alex",
    dashboardDescription:
      "Three campaigns are awaiting your review and the back-to-school bundle package is one approval away from trafficking. Here's where the workspace stands today.",
  },
};
