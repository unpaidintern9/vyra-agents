// Vyra Agents Sales localStorage seed
// Generated 2026-07-01 for local/mock Sales Agent prospect research.
// Safety: local browser storage only. No email, CRM, Stripe, Supabase, or production writes.
//
// Usage in the Vyra Agents dashboard browser console:
// 1. Open the dashboard.
// 2. Paste this full file into the console and press Enter.
// 3. Refresh the dashboard Sales page.

(() => {
  const generatedAt = "2026-07-01T13:35:00.000Z";

  const keys = {
    research: "vyra-agents:sales-prospect-research",
    intakes: "vyra-agents:sales-prospect-intakes",
    dossiers: "vyra-agents:sales-prospect-dossiers",
  };

  const prospects = [
    {
      id: "prospect_louisville_area502_mma",
      prospectName: "Area 502 MMA",
      category: "mma_bjj",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Small independent combat sports gym",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 91,
      fitTier: "prime_target",
      fitReasons: [
        "MMA/BJJ/boxing segment fits Vyra first-target ICP",
        "Class-heavy member business likely needs scheduling and retention workflows",
        "Strong fit for youth/adult program progression and member communication",
      ],
      firstOutreachAngle:
        "Lead with helping combat-sports gyms turn class participation, youth programs, and private training into a cleaner member app and retention system.",
      recommendedNextResearch:
        "Verify owner/operator, direct contact path, member count proxy, current software, and Instagram activity before first outreach.",
      notes:
        "Public website reviewed as a fit signal. Do not treat owner/contact/software/member count as verified yet.",
      websiteUrl: "https://area502mma.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_combat_academy",
      prospectName: "Louisville Combat Academy",
      category: "mma_bjj",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent combat sports academy",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 90,
      fitTier: "prime_target",
      fitReasons: [
        "BJJ/Muay Thai/MMA offering maps to Vyra's combat-sports ICP",
        "Multi-discipline schedule creates operational and communication complexity",
        "Good fit for athlete progress tracking and trial-to-member conversion",
      ],
      firstOutreachAngle:
        "Ask how they manage trial students, class communication, and progression across BJJ, Muay Thai, and MMA today.",
      recommendedNextResearch:
        "Find owner/operator, direct email, phone, social profile, current software clues, and class schedule details.",
      notes:
        "Public website reviewed as a fit signal. Contact and current platform are still unverified.",
      websiteUrl: "https://louisvillecombatacademy.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_core_combat_sports",
      prospectName: "Core Combat Sports",
      category: "mma_bjj",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent multi-program combat sports gym",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 88,
      fitTier: "prime_target",
      fitReasons: [
        "BJJ, boxing, Muay Thai, Judo, and fitness program mix",
        "Multi-program member journey likely creates retention and communication needs",
        "Strong fit for Gym OS plus app-based athlete progress experience",
      ],
      firstOutreachAngle:
        "Position Vyra as one digital layer for martial arts, fitness programming, member communication, and retention.",
      recommendedNextResearch:
        "Verify owner/operator, contact path, schedule complexity, social activity, and current software stack.",
      notes:
        "Public website reviewed. Good ICP fit; operational details still need confirmation.",
      websiteUrl: "https://corelouisville.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_apex_maa",
      prospectName: "Apex Martial Arts Academy",
      category: "mma_bjj",
      city: "Louisville / Mount Washington",
      state: "KY",
      estimatedLocationCount: 2,
      estimatedSizeLabel: "Local family martial arts academy",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 86,
      fitTier: "prime_target",
      fitReasons: [
        "BJJ/MMA/Muay Thai/boxing programming fits first-target segments",
        "Family and youth programming creates parent communication and onboarding needs",
        "Small local footprint avoids large-chain mismatch",
      ],
      firstOutreachAngle:
        "Lead with parent/member onboarding, youth program retention, and simplifying operations across local academy programs.",
      recommendedNextResearch:
        "Verify exact location count, owner/operator, public contact path, youth/adult schedule, and current member tools.",
      notes:
        "Appears to serve Louisville/Mount Washington area. Treat multi-location count as a public-source estimate.",
      websiteUrl: "https://theapexmaa.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_derby_city_mma",
      prospectName: "Derby City Mixed Martial Arts",
      category: "mma_bjj",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent martial arts gym",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 80,
      fitTier: "good_fit",
      fitReasons: [
        "Martial arts/MMA segment fits ICP",
        "Likely community-led recurring membership business",
        "Good candidate for retention and digital member experience discovery",
      ],
      firstOutreachAngle:
        "Ask what parts of onboarding, communication, and member retention still feel manual or patched together.",
      recommendedNextResearch:
        "Confirm active website, owner/operator, program list, social activity, and direct contact path.",
      notes:
        "Public research suggests fit, but confidence is lower until active programs and contact path are verified.",
      websiteUrl: "https://derbycitymartialarts.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_rough_hands_bjj",
      prospectName: "Rough Hands BJJ",
      category: "mma_bjj",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent BJJ academy",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 79,
      fitTier: "good_fit",
      fitReasons: [
        "BJJ academy fits first-target combat-sports ICP",
        "Kids, teens, and beginner/self-defense programming increases retention opportunities",
        "Good fit for progression tracking and parent/member communication",
      ],
      firstOutreachAngle:
        "Lead with beginner onboarding, youth program retention, and visibility into student progression.",
      recommendedNextResearch:
        "Verify owner/operator, contact email or phone, class schedule, social activity, and current software.",
      notes:
        "Strong segment fit; contact and software details still missing.",
      websiteUrl: "https://roughhandsbjj.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_butchertown_crossfit",
      prospectName: "Butchertown CrossFit",
      category: "crossfit",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent CrossFit / functional fitness gym",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 85,
      fitTier: "prime_target",
      fitReasons: [
        "CrossFit and functional fitness segment fits ICP",
        "Class-based model maps to scheduling, trials, retention, and community workflows",
        "Good first-pass fit for Gym OS and member app positioning",
      ],
      firstOutreachAngle:
        "Lead with reducing admin drag around trials, classes, habit tracking, and member retention.",
      recommendedNextResearch:
        "Verify owner/operator, contact path, class/trial flow, software clues, and member/community signals.",
      notes:
        "Public website reviewed. Keep as high-fit local prospect pending contact verification.",
      websiteUrl: "https://www.butchertowncrossfit.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_crossfit_covalence",
      prospectName: "CrossFit Covalence",
      category: "crossfit",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent CrossFit affiliate",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 81,
      fitTier: "good_fit",
      fitReasons: [
        "CrossFit segment fits ICP",
        "Community-focused class model likely has trial and retention workflows",
        "Good fit for member app, referrals, and coach-led engagement",
      ],
      firstOutreachAngle:
        "Position Vyra around member retention, coach engagement, and a smoother trial-to-member flow.",
      recommendedNextResearch:
        "Verify owner/operator, active programming, member count proxy, current software, and best contact path.",
      notes:
        "Good public fit signal; missing decision-maker and software details.",
      websiteUrl: "https://crossfitcovalence.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_full_tilt_gym",
      prospectName: "Full Tilt Gym",
      category: "small_gym",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent functional fitness gym",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 76,
      fitTier: "good_fit",
      fitReasons: [
        "Local functional fitness gym fits small-gym ICP",
        "Custom programming signal maps to coach-led digital delivery",
        "Potential Gym OS and app layer fit if member count supports it",
      ],
      firstOutreachAngle:
        "Ask whether their custom programming and member communication could benefit from a branded app layer.",
      recommendedNextResearch:
        "Verify owner/operator, current software, member count proxy, and whether programming is delivered digitally today.",
      notes:
        "Likely good fit, but more detail is needed before prioritizing above combat-sports and CrossFit targets.",
      websiteUrl: "https://fulltiltgym.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_louisville_derby_city_fit_club",
      prospectName: "Derby City Fit Club",
      category: "small_gym",
      city: "Louisville",
      state: "KY",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent strength / functional fitness gym",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 74,
      fitTier: "good_fit",
      fitReasons: [
        "Local strength/functional fitness segment fits small-gym ICP",
        "Visible pricing and local positioning suggest owner-operated sales path",
        "Good candidate for retention, community, and coaching workflow discovery",
      ],
      firstOutreachAngle:
        "Lead with community retention, coaching upgrades, and a cleaner member experience.",
      recommendedNextResearch:
        "Verify owner/operator, direct contact path, class model, member count proxy, and current software.",
      notes:
        "Good-fit local gym. Lower priority than combat-sports targets until current software and scale are known.",
      websiteUrl: "https://www.derbycityfitclub.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_southern_indiana_full_moon_martial_arts",
      prospectName: "Full Moon Martial Arts",
      category: "mma_bjj",
      city: "Clarksville / Jeffersonville / New Albany",
      state: "IN",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Southern Indiana family martial arts gym",
      sourceStatus: "public_research_ready",
      confidence: "high",
      fitScore: 83,
      fitTier: "good_fit",
      fitReasons: [
        "Martial arts/boxing/fitness mix fits Louisville-area expansion ICP",
        "Family martial arts model creates youth/adult onboarding and retention needs",
        "Nearby Southern Indiana market is close enough for local first-motion outreach",
      ],
      firstOutreachAngle:
        "Lead with youth/adult program onboarding, retention, and member communication across the Southern Indiana market.",
      recommendedNextResearch:
        "Verify owner/operator, exact address, active programs, social profile, and current software.",
      notes:
        "Good Louisville-area adjacent fit. Keep separate from Louisville KY proper for territory clarity.",
      websiteUrl: "https://www.fullmoonmartialarts.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
    {
      id: "prospect_southern_indiana_martial_arts",
      prospectName: "Southern Indiana Martial Arts",
      category: "mma_bjj",
      city: "New Albany",
      state: "IN",
      estimatedLocationCount: 1,
      estimatedSizeLabel: "Independent BJJ / self-defense academy",
      sourceStatus: "public_research_ready",
      confidence: "medium",
      fitScore: 78,
      fitTier: "good_fit",
      fitReasons: [
        "BJJ/self-defense/kids programming fits combat-sports ICP",
        "Family-friendly programs create beginner onboarding and retention opportunities",
        "Local Southern Indiana market is adjacent to Louisville target territory",
      ],
      firstOutreachAngle:
        "Lead with beginner onboarding, youth retention, and a cleaner student progression experience.",
      recommendedNextResearch:
        "Verify owner/operator, direct contact path, current software, and class schedule.",
      notes:
        "Good-fit adjacent prospect. Needs owner/contact verification before outreach.",
      websiteUrl: "https://southernindianamartialarts.com/",
      publicSocialUrl: "",
      lastReviewedAt: generatedAt,
      localOnly: true,
    },
  ];

  function typeForCategory(category) {
    if (category === "crossfit") return "crossfit";
    if (category === "small_gym") return "small_gym";
    return "mma_bjj";
  }

  function painPointsFor(prospect) {
    const base = ["member retention", "class scheduling and communication", "trial-to-member conversion"];
    if (prospect.category === "mma_bjj") return ["student progression visibility", "youth/adult program retention", ...base];
    if (prospect.category === "crossfit") return ["trial onboarding", "coach-led habit tracking", ...base];
    return ["fragmented member operations", "digital programming delivery", ...base];
  }

  const intakes = prospects.map((prospect) => ({
    id: `sales_prospect_${prospect.id.replace(/^prospect_/, "")}`,
    gymName: prospect.prospectName,
    city: prospect.city,
    state: prospect.state,
    businessType: typeForCategory(prospect.category),
    websiteUrl: prospect.websiteUrl || "",
    instagramUrl: prospect.publicSocialUrl || "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    currentSoftware: "",
    estimatedMembers: null,
    estimatedCoaches: null,
    migrationComplexity: "unknown",
    painPoints: painPointsFor(prospect),
    notes: `${prospect.notes} First outreach angle: ${prospect.firstOutreachAngle}`,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    localOnly: true,
  }));

  const dossiers = intakes.map((intake) => {
    const prospect = prospects.find((item) => intake.id.endsWith(item.id.replace(/^prospect_/, "")));
    const fitScore = prospect?.fitScore ?? 70;
    const icpFit = fitScore >= 84 ? "prime_target" : fitScore >= 72 ? "good_fit" : "research_needed";
    const missingInfo = [
      "Instagram/social link",
      "owner/contact name",
      "contact email or phone",
      "current software",
      "estimated members",
      "estimated coaches",
      "migration complexity",
    ];
    return {
      dossierId: `research_dossier_${intake.id}`,
      intakeId: intake.id,
      businessOverview: `${intake.gymName} is a ${intake.businessType.replace(/_/g, " ")} prospect in ${intake.city}, ${intake.state}. Public research found enough ICP signal to stage it locally, but owner/contact/software/member details still need verification.`,
      fitScore,
      highFit: fitScore >= 76,
      icpFit,
      likelyPainPoints: intake.painPoints,
      migrationOpportunity: "Unknown migration opportunity: collect current software and member export details.",
      missingInfo,
      nextSteps: [
        "Verify owner/operator and direct contact path.",
        "Check social activity and class schedule.",
        "Confirm current software and member count proxy.",
        "Choose top five for first manual outreach review.",
      ],
      outreachAngle: prospect?.firstOutreachAngle ?? "Lead with local member retention and operations cleanup.",
      proposalAngle: "Start with Gym OS / App for Gyms positioning after contact and current software are verified.",
      recommendedVyraProduct: intake.businessType === "crossfit" ? "Gym OS + App for Gyms" : "Gym OS",
      risks: ["Public-only research; no contact, current software, or CRM status verified."],
      fitFactors: [
        { key: "segment_fit", label: "Segment fit", points: 24, detail: "Matches Vyra's MMA/BJJ, CrossFit, or small-gym first-target ICP." },
        { key: "local_market", label: "Local market", points: 18, detail: "Located in Louisville, KY or nearby Southern Indiana." },
        { key: "operations_fit", label: "Operations fit", points: 18, detail: "Class-heavy member business likely benefits from scheduling, communication, app, and retention workflows." },
        { key: "verification_gap", label: "Verification gap", points: -8, detail: "Owner, contact, current software, and member count still need confirmation." },
      ],
      createdAt: generatedAt,
      updatedAt: generatedAt,
      localOnly: true,
      notBrowsedExternally: false,
      notSyncedToCrm: true,
    };
  });

  const payloads = [
    [keys.research, prospects],
    [keys.intakes, intakes],
    [keys.dossiers, dossiers],
  ];

  for (const [key, rows] of payloads) {
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const byId = new Map(existing.map((row) => [row.id || row.dossierId, row]));
    for (const row of rows) byId.set(row.id || row.dossierId, row);
    localStorage.setItem(key, JSON.stringify(Array.from(byId.values())));
  }

  console.info("Vyra Sales Louisville ICP seed installed", {
    research: prospects.length,
    intakes: intakes.length,
    dossiers: dossiers.length,
    keys,
  });
})();
