import type {
  CampaignBrief,
  ContentVariant,
  CreativeConcept,
  ApprovalPackage,
  DashboardKpis,
  RecentCampaignSummary,
  CreativeToolStatus,
  ValidationResult,
} from "@/types";

export const dashboardKpis: DashboardKpis = {
  campaignsInDraft: 7,
  awaitingApproval: 3,
  brandIssuesFlagged: 4,
  contentPackagesGenerated: 24,
};

export const recentCampaigns: RecentCampaignSummary[] = [
  {
    id: "cmp_memorial_day_auto",
    title: "Memorial Day Auto — Families & Young Pros",
    productLine: "Auto Insurance",
    status: "in_review",
    channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    owner: "Jordan Patel",
    validationScore: 86,
  },
  {
    id: "cmp_summer_safe_driving",
    title: "Summer Safe Driving — Teen Driver Households",
    productLine: "Auto Insurance",
    status: "draft",
    channels: ["Email", "Landing Page", "SMS"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    owner: "Mei Tanaka",
    validationScore: 71,
  },
  {
    id: "cmp_bundle_save_family",
    title: "Bundle & Save — Growing Family Households",
    productLine: "Auto + Home Bundle",
    status: "approved",
    channels: ["Email", "Paid Social", "Connected TV"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    owner: "Devon Wright",
    validationScore: 94,
  },
  {
    id: "cmp_renters_first_apt",
    title: "First Apartment — Renters Coverage Refresh",
    productLine: "Renters",
    status: "needs_changes",
    channels: ["Paid Social", "Display Ads"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 51).toISOString(),
    owner: "Priya Nambiar",
    validationScore: 62,
  },
  {
    id: "cmp_winter_roadside",
    title: "Winter Roadside Readiness",
    productLine: "Auto + Roadside",
    status: "live",
    channels: ["Email", "Connected TV", "Out of Home"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    owner: "Alex Romero",
    validationScore: 91,
  },
  {
    id: "cmp_small_business_owners",
    title: "Small Business Commercial Auto",
    productLine: "Commercial Auto",
    status: "draft",
    channels: ["Landing Page", "Paid Social"],
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(),
    owner: "Sasha Kim",
    validationScore: 58,
  },
];

export const memorialDayBrief: CampaignBrief = {
  id: "brief_memorial_day_auto",
  requestId: "req_memorial_day_auto",
  title: "Memorial Day Auto — Families & Young Professionals",
  objective:
    "Drive a 12% lift in auto insurance quote starts during Memorial Day weekend by celebrating community and modern American life — without leaning on overt political symbolism.",
  productLine: "Auto Insurance",
  audiences: [
    {
      label: "Young Professionals 25–34",
      description:
        "Urban and suburban renters or new homeowners shopping their first standalone auto policy, value-driven, mobile-first.",
      estimatedReach: "4.6M",
    },
    {
      label: "Family Households 30–45",
      description:
        "Dual-income parents with 1–2 vehicles, sensitive to bundle value and roadside safety messaging.",
      estimatedReach: "6.1M",
    },
  ],
  keyMessages: [
    {
      headline: "Coverage built for the road ahead — for every kind of household.",
      rationale:
        "Anchors the campaign in inclusivity and forward motion, reinforcing Contoso's trust positioning.",
    },
    {
      headline: "Quote in minutes. Drive into the long weekend with peace of mind.",
      rationale:
        "Time-bound CTA that links the holiday moment to a frictionless quote start.",
    },
    {
      headline: "Patriotic colors. Practical coverage. Real savings opportunities.",
      rationale:
        "Balances seasonal motifs with concrete value and avoids unsupported savings claims.",
    },
  ],
  channels: ["Email", "Paid Social", "Landing Page", "Display Ads"],
  ctaOptions: [
    { label: "Start your quote", destination: "/quote/auto", channelHint: "Landing Page" },
    { label: "See your savings options", destination: "/auto/save", channelHint: "Email" },
    { label: "Quote in minutes", destination: "/quote/auto?utm=memorial", channelHint: "Paid Social" },
  ],
  timeline: {
    kickoff: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    launch: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    wrap: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  kpis: [
    {
      name: "Quote starts (incremental)",
      target: "+12% vs prior 14-day baseline",
      rationale: "Primary commercial outcome for the holiday window.",
    },
    {
      name: "Email CTR",
      target: "≥ 3.4%",
      rationale: "Benchmarks against last Memorial Day program.",
    },
    {
      name: "Paid social CPA",
      target: "≤ $38",
      rationale: "Efficiency guardrail for paid social variants.",
    },
    {
      name: "Brand favorability lift",
      target: "+2 pts (post-flight survey)",
      rationale: "Holiday tone should support brand, not just performance.",
    },
  ],
  risks: [
    {
      title: "Patriotic tone misread as political",
      severity: "medium",
      mitigation:
        "Lean into community, family, and service motifs. Avoid party imagery, flag-only hero shots, or political iconography.",
    },
    {
      title: "Savings claims without backing",
      severity: "high",
      mitigation:
        "Use ‘could save’ framing with an approved savings citation and rate variation disclaimer.",
    },
    {
      title: "Unapproved mascot usage in generative visuals",
      severity: "high",
      mitigation:
        "Route any mascot art through approved asset management. No generative mascot likeness.",
    },
  ],
  requiredDisclaimers: [
    "Rates vary based on state, coverage selections, and underwriting profile.",
    "Savings comparisons are based on the most recent approved Contoso savings study (demo placeholder citation).",
    "Coverage availability subject to state and underwriting eligibility.",
  ],
  creativeNotes: [
    "Use warm, golden-hour palettes with subtle red/white/blue accents — avoid flag-dominant hero compositions.",
    "Feature multigenerational, multicultural households in motion (road trips, neighborhood gatherings).",
    "Treat the Otter mascot only via approved licensed renders. No generative mascot creation.",
  ],
  status: "in_review",
  updatedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  completeness: 0.92,
};

export const summerSafeDrivingBrief: CampaignBrief = {
  id: "brief_summer_safe_driving",
  requestId: "req_summer_safe_driving",
  title: "Summer Safe Driving — Teen Driver Households",
  objective:
    "Increase awareness and adoption of Contoso's teen driver tools and safe driving resources during the summer travel season.",
  productLine: "Auto Insurance",
  audiences: [
    {
      label: "Parents of Teen Drivers",
      description:
        "Households with newly licensed drivers (15–18) preparing for summer road trips.",
      estimatedReach: "3.2M",
    },
    {
      label: "Recent High School Grads",
      description:
        "18–20 year olds gaining vehicle independence, often added to a parental policy.",
      estimatedReach: "1.4M",
    },
  ],
  keyMessages: [
    {
      headline: "Summer roads are busy. Help your new driver feel ready.",
      rationale: "Empathy-led message that opens the door to product utility.",
    },
    {
      headline: "Tools that turn first-time drivers into confident drivers.",
      rationale: "Positions teen driver tools as a product benefit.",
    },
  ],
  channels: ["Email", "Landing Page", "SMS"],
  ctaOptions: [
    { label: "Explore teen driver tools", destination: "/auto/teen-tools" },
    { label: "Get a quick quote", destination: "/quote/auto" },
  ],
  timeline: {
    kickoff: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    launch: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    wrap: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  kpis: [
    {
      name: "Tool page engagement",
      target: "+18% page depth",
      rationale: "Indicates educational content is resonating.",
    },
    {
      name: "Add-a-driver requests",
      target: "+8% vs baseline",
      rationale: "Tracks conversion intent.",
    },
  ],
  risks: [
    {
      title: "Tone reads as fear-based",
      severity: "medium",
      mitigation: "Balance safety with confidence; avoid alarmist imagery.",
    },
  ],
  requiredDisclaimers: [
    "Teen driver tools are informational; coverage availability varies by state.",
    "Standard SMS opt-in, frequency, and STOP/HELP instructions required.",
  ],
  creativeNotes: [
    "Show parent-teen partnership, not surveillance.",
    "Daylight, open-road imagery preferred.",
  ],
  status: "draft",
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  completeness: 0.74,
};

export const bundleSaveBrief: CampaignBrief = {
  id: "brief_bundle_save_family",
  requestId: "req_bundle_save_family",
  title: "Bundle & Save — Growing Family Households",
  objective:
    "Convert auto-only households with recent home purchases to a bundled auto + home policy.",
  productLine: "Auto + Home Bundle",
  audiences: [
    {
      label: "Recent Home Buyers 30–45",
      description: "Auto policyholders who purchased a home in the last 12 months.",
      estimatedReach: "920K",
    },
  ],
  keyMessages: [
    {
      headline: "New home, simpler coverage.",
      rationale: "Reinforces simplification and convenience benefit of bundling.",
    },
    {
      headline: "One household. One policy view. Real savings opportunities.",
      rationale: "Avoids absolute claims while highlighting potential value.",
    },
  ],
  channels: ["Email", "Paid Social", "Connected TV"],
  ctaOptions: [
    { label: "See bundle options", destination: "/bundle" },
    { label: "Get my bundle quote", destination: "/quote/bundle" },
  ],
  timeline: {
    kickoff: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    launch: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    wrap: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  kpis: [
    { name: "Bundle quote starts", target: "+22%", rationale: "Primary KPI." },
    {
      name: "Auto retention lift",
      target: "+1.4 pts",
      rationale: "Tracks bundle’s defensive value.",
    },
  ],
  risks: [
    {
      title: "Implied guaranteed savings",
      severity: "high",
      mitigation:
        "Use ‘could save up to’ language with approved citation. Include rate variation disclaimer.",
    },
  ],
  requiredDisclaimers: [
    "Rates vary by state, coverage, and underwriting profile.",
    "Bundle savings subject to product availability and eligibility.",
  ],
  creativeNotes: [
    "Warm, mid-century-modern home interiors; show family routines, not staged perfection.",
  ],
  status: "approved",
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  completeness: 1,
};

export const seedBriefs: CampaignBrief[] = [
  memorialDayBrief,
  summerSafeDrivingBrief,
  bundleSaveBrief,
];

export const seedContentVariants: ContentVariant[] = [
  {
    id: "cv_em_01",
    channel: "Email",
    label: "Email • Variant A — Family-led",
    headline: "Hit the road this Memorial Day — covered, confident, ready.",
    subheadline: "Auto coverage built for every kind of household.",
    body: "Long weekends are made for the people who ride along. Whether you’re heading to a backyard cookout or a coastline drive, Contoso is here with auto coverage that keeps your household moving. Get a quote in minutes and step into the holiday with one less thing on your list.",
    cta: "Start your quote",
    audienceNote: "Family households 30–45; reinforces trust and convenience.",
    complianceNote:
      "Includes rate variation disclaimer in footer. No absolute savings claim.",
    tone: "Warm, confident, modern",
  },
  {
    id: "cv_em_02",
    channel: "Email",
    label: "Email • Variant B — Young Professional",
    headline: "Your weekend, your way — covered before you hit the road.",
    subheadline: "Quote auto coverage in minutes from your phone.",
    body: "From rooftop plans to long drives upstate, your Memorial Day should be about the moment — not paperwork. Spin up an auto quote in a few taps and see what coverage could look like for the way you actually drive.",
    cta: "Quote in minutes",
    audienceNote: "Young professionals 25–34; mobile-first language.",
    complianceNote:
      "Avoids savings claims; references mobile-first quote experience.",
    tone: "Crisp, modern, conversational",
  },
  {
    id: "cv_ps_01",
    channel: "Paid Social",
    label: "Paid Social • Variant A — Carousel",
    headline: "Three stops. One smooth weekend.",
    body: "Card 1: Beach day. Card 2: Cookout. Card 3: Open road home. Each card pairs a Memorial Day moment with a benefit-led copy line and a soft CTA to start a quote.",
    cta: "See your coverage",
    audienceNote: "Lookalike of recent quote-start audiences.",
    complianceNote:
      "Demo placeholder rule: confirm any savings line references approved citation.",
    tone: "Energetic, optimistic",
  },
  {
    id: "cv_ps_02",
    channel: "Paid Social",
    label: "Paid Social • Variant B — Single Image",
    headline: "Coverage that travels well.",
    body: "A single hero composition of a multigenerational household loading a car at golden hour — paired with a clean two-line copy block and benefit chip.",
    cta: "Get a quick quote",
    audienceNote: "Broad reach across families and young pros.",
    complianceNote: "Avoid flag-dominant composition; community motif preferred.",
    tone: "Cinematic, grounded",
  },
  {
    id: "cv_lp_01",
    channel: "Landing Page",
    label: "Landing Page • Hero Concept",
    headline: "A weekend worth protecting.",
    subheadline:
      "Quote auto coverage built for modern households — in minutes, from anywhere.",
    body: "Hero band: warm imagery, primary CTA. Middle band: three trust signals (24/7 claims, mobile-first servicing, bundle options). Lower band: testimonial-style copy reinforcing reliability. Footer: required disclaimers.",
    cta: "Start your quote",
    audienceNote: "Bridges paid social → quote funnel.",
    complianceNote: "Footer disclaimer module required.",
    tone: "Trustworthy, modern",
  },
  {
    id: "cv_da_01",
    channel: "Display Ads",
    label: "Display • 300x250 — Performance",
    headline: "Long weekend ahead?",
    body: "Compact creative: hero road shot, benefit chip (‘Quote in minutes’), CTA button. Pair with retargeting segment.",
    cta: "Quote now",
    audienceNote: "Retargeting recent quote-start abandoners.",
    complianceNote:
      "Demo placeholder rule: ensure landing page disclaimer mirrors ad copy.",
    tone: "Action-oriented",
  },
  {
    id: "cv_sms_01",
    channel: "SMS",
    label: "SMS • Holiday Window",
    headline: "Contoso: Heading out for the long weekend?",
    body: "Heading out for the long weekend? Take a quick look at your auto coverage in minutes. Reply STOP to opt out, HELP for help. Msg & data rates may apply.",
    cta: "Tap to start a quote",
    audienceNote: "Existing opt-in SMS audience only.",
    complianceNote: "Includes STOP/HELP language and frequency-friendly tone.",
    tone: "Friendly, concise",
  },
  {
    id: "cv_brief_01",
    channel: "Email",
    label: "Creative Brief • Snapshot",
    headline: "Memorial Day Auto — Creative Brief Snapshot",
    body: "Single-page snapshot of objective, audiences, key messages, channel matrix, must-have disclaimers, and creative do/don’t list. Used for handoff to in-house studio and agency partners.",
    cta: "Open full brief",
    audienceNote: "Internal creative team handoff.",
    complianceNote:
      "Internal-only artifact; not subject to external disclaimers but must reference them.",
    tone: "Operational",
  },
];

export const seedCreativeConcepts: CreativeConcept[] = [
  {
    id: "vc_01",
    title: "Golden Hour Driveway",
    rationale:
      "Multigenerational family loading a sedan at golden hour, soft red/white/blue accents in props (cooler, blanket, sneakers). Conveys community-first patriotism without flag-forward imagery.",
    promptUsed:
      "Editorial photograph, multigenerational American family at golden hour packing a modern sedan for a road trip, warm tones with subtle red, white, blue accents in props, shallow depth of field, no overlay text, no logos.",
    style: "Editorial",
    channels: ["Paid Social", "Landing Page", "Display Ads"],
    moodTags: ["warm", "community", "trustworthy", "modern"],
    complianceStatus: "ready",
    thumbnailHue: "from-amber-200 via-rose-200 to-sky-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_02",
    title: "Open Road, Open Sky",
    rationale:
      "Cinematic aerial of a two-lane highway curving toward a soft horizon, single vehicle in motion. Conveys forward momentum and freedom while staying neutral and brand-safe.",
    promptUsed:
      "Cinematic aerial photograph, two-lane American highway at sunrise curving toward a soft horizon, lone modern sedan in motion, subtle warm gradient sky, no overlay text, no logos.",
    style: "Cinematic",
    channels: ["Connected TV", "Paid Social"],
    moodTags: ["expansive", "optimistic", "modern"],
    complianceStatus: "ready",
    thumbnailHue: "from-sky-300 via-indigo-300 to-rose-200",
    requiresHumanReview: true,
  },
  {
    id: "vc_03",
    title: "Neighborhood Gathering",
    rationale:
      "Documentary-style image of a neighborhood block gathering — coverage as the quiet backdrop to community. Avoids overt symbolism while still feeling distinctly American.",
    promptUsed:
      "Documentary-style photograph, diverse American neighborhood block gathering at dusk, string lights, casual community scene, soft warm palette with hints of blue, no overlay text, no logos.",
    style: "Documentary",
    channels: ["Email", "Landing Page"],
    moodTags: ["community", "warm", "inclusive"],
    complianceStatus: "needs_review",
    complianceNote:
      "Confirm talent releases and that scene composition avoids any unintended political symbolism.",
    thumbnailHue: "from-indigo-200 via-amber-200 to-rose-200",
    requiresHumanReview: true,
  },
];

export const creativeToolStatus: CreativeToolStatus = {
  serviceName: "Studio Concept Gateway",
  vendor: "Lumen Creative (MCP-connected)",
  connectionStatus: "connected",
  lastSyncIso: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  availableTools: [
    {
      name: "generate_concept_set",
      description:
        "Requests N styled concept directions from an external studio model. Returns rationales + prompt history only — no mascot generation.",
    },
    {
      name: "remix_concept",
      description:
        "Takes an approved concept and produces variations along a specified style or mood axis.",
    },
    {
      name: "request_approved_asset",
      description:
        "Routes a request to the asset management system for an approved mascot or brand-licensed asset.",
    },
    {
      name: "submit_to_review",
      description:
        "Submits the selected concept set to a human review queue with attached rationale and prompt history.",
    },
  ],
};

export const seedApprovalPackages: ApprovalPackage[] = [
  {
    id: "ap_memorial_day",
    briefId: "brief_memorial_day_auto",
    campaignTitle: "Memorial Day Auto — Families & Young Professionals",
    submittedBy: "Jordan Patel",
    submittedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: "in_review",
    contentVariantIds: [
      "cv_em_01",
      "cv_em_02",
      "cv_ps_01",
      "cv_ps_02",
      "cv_lp_01",
      "cv_da_01",
      "cv_sms_01",
    ],
    conceptIds: ["vc_01", "vc_02", "vc_03"],
    validationSummary: { score: 86, blockers: 0, warnings: 2 },
    reviewers: [
      { name: "Renee Olson", role: "Brand Director", decision: "pending" },
      { name: "Marcus Hill", role: "Legal & Compliance", decision: "approve" },
      { name: "Avery Chen", role: "Creative Lead", decision: "pending" },
    ],
    comments: [
      {
        id: "cmt_1",
        author: "Marcus Hill",
        role: "Legal & Compliance",
        timestampIso: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        message:
          "Rate variation disclaimer language looks good. Confirm savings citation references the approved 2026 study before launch.",
        decision: "approve",
      },
      {
        id: "cmt_2",
        author: "Renee Olson",
        role: "Brand Director",
        timestampIso: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        message:
          "Love the community-first framing on concept #1. Let’s soften the flag-adjacent props on concept #3 before I sign off.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        label: "Package submitted",
        description: "Jordan Patel submitted 7 content variants and 3 visual concepts for review.",
      },
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        label: "Validation re-run",
        description: "Score: 86 / 100. 0 blockers, 2 warnings, 1 approval required.",
      },
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        label: "Legal review complete",
        description: "Marcus Hill approved disclaimers pending savings citation confirmation.",
      },
    ],
  },
  {
    id: "ap_bundle_save",
    briefId: "brief_bundle_save_family",
    campaignTitle: "Bundle & Save — Growing Family Households",
    submittedBy: "Devon Wright",
    submittedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    status: "approved",
    contentVariantIds: ["cv_em_01"],
    conceptIds: ["vc_01"],
    validationSummary: { score: 94, blockers: 0, warnings: 1 },
    reviewers: [
      { name: "Renee Olson", role: "Brand Director", decision: "approve" },
      { name: "Marcus Hill", role: "Legal & Compliance", decision: "approve" },
    ],
    comments: [
      {
        id: "cmt_b1",
        author: "Renee Olson",
        role: "Brand Director",
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        message: "Clean, on-brand. Approved.",
        decision: "approve",
      },
    ],
    history: [
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        label: "Package submitted",
        description: "Devon Wright submitted the bundle package for review.",
      },
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        label: "Approved",
        description: "All reviewers approved; package ready for trafficking.",
      },
    ],
  },
  {
    id: "ap_renters",
    briefId: "brief_renters_first_apt",
    campaignTitle: "First Apartment — Renters Coverage Refresh",
    submittedBy: "Priya Nambiar",
    submittedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    status: "changes_requested",
    contentVariantIds: ["cv_ps_01"],
    conceptIds: [],
    validationSummary: { score: 62, blockers: 1, warnings: 3 },
    reviewers: [
      { name: "Renee Olson", role: "Brand Director", decision: "request_changes" },
      { name: "Marcus Hill", role: "Legal & Compliance", decision: "request_changes" },
    ],
    comments: [
      {
        id: "cmt_r1",
        author: "Marcus Hill",
        role: "Legal & Compliance",
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        message:
          "Savings line currently implies a guarantee. Reframe with ‘could save’ and add the rate variation disclaimer.",
        decision: "request_changes",
      },
    ],
    history: [
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
        label: "Package submitted",
        description: "Priya Nambiar submitted the renters refresh package.",
      },
      {
        timestampIso: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        label: "Changes requested",
        description: "Legal and brand flagged savings-claim language. Awaiting marketer updates.",
      },
    ],
  },
];

export const memorialDayValidation: ValidationResult = {
  briefId: "brief_memorial_day_auto",
  generatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  overallStatus: "review_needed",
  score: 86,
  findings: [
    {
      id: "vf_1",
      ruleId: "rule_disclaimer_rate_variation",
      ruleTitle: "Insurance rate variation disclaimer required",
      category: "disclaimer",
      severity: "approval_required",
      message:
        "Rate variation disclaimer is present on email and landing page, but missing on the display ad caption module.",
      evidence: "Display 300x250 variant lacks footer disclaimer slot.",
      remediation:
        "Embed the standardized disclaimer in the display ad endcard module.",
      confidence: "high",
    },
    {
      id: "vf_2",
      ruleId: "rule_claims_savings",
      ruleTitle: "No unsupported savings claims",
      category: "claims",
      severity: "warning",
      message:
        "‘Real savings opportunities’ language is acceptable; ensure any specific figure references an approved citation.",
      remediation: "If a specific savings figure is added, link the 2026 savings study citation.",
      confidence: "high",
    },
    {
      id: "vf_3",
      ruleId: "rule_tone_patriotic_balance",
      ruleTitle: "Patriotic themes must remain trust-forward",
      category: "tone",
      severity: "warning",
      message:
        "Concept #3 (Neighborhood Gathering) leans warm and inclusive; double-check prop styling avoids any political symbolism.",
      remediation:
        "Adjust prop palette to lean community-first rather than flag-forward.",
      confidence: "medium",
    },
    {
      id: "vf_4",
      ruleId: "rule_mascot_usage",
      ruleTitle: "Approved mascot assets only",
      category: "mascot",
      severity: "passed",
      message: "No generative mascot likeness detected in concepts or copy.",
      confidence: "high",
    },
    {
      id: "vf_5",
      ruleId: "rule_review_visual_human",
      ruleTitle: "Human review required for visual assets",
      category: "review",
      severity: "approval_required",
      message:
        "Visual concept package must be reviewed by Brand Director and Creative Lead before trafficking.",
      remediation: "Submit to Approval Center for sign-off.",
      confidence: "high",
    },
    {
      id: "vf_6",
      ruleId: "rule_accessibility_color_contrast",
      ruleTitle: "Accessibility reminders for visual concepts",
      category: "accessibility",
      severity: "info",
      message:
        "Reminder: validate text-over-image contrast (≥ 4.5:1) in production assets.",
      confidence: "high",
    },
    {
      id: "vf_7",
      ruleId: "rule_channel_sms_optin",
      ruleTitle: "SMS messages require opt-in language",
      category: "channel",
      severity: "passed",
      message: "SMS variant includes STOP/HELP and frequency language.",
      confidence: "high",
    },
  ],
  approvalsRequired: ["Brand Director", "Creative Lead"],
};
