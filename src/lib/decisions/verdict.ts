import type {
  Confidence,
  ProductEconomics,
  ProductVerdictResult,
  PricingResearch,
  RtoEstimate,
  SaturationAssessment,
  ScoreBreakdown,
  TestPlan,
  Verdict,
} from "@/lib/types";

export interface VerdictInputs {
  economics: ProductEconomics;
  rtoEstimate?: RtoEstimate;
  saturation?: SaturationAssessment;
  pricing?: PricingResearch;
  supplierAvailable?: boolean | null;
  testPlan: TestPlan;
}

function scoreEconomicViability(economics: ProductEconomics): number {
  if (economics.maxViableCAC <= 0) return 0;
  let score = 12; // base for positive economics
  if (economics.passes3xRule) score += 6;
  if (economics.contributionMarginPct != null) {
    if (economics.contributionMarginPct >= 30) score += 7;
    else if (economics.contributionMarginPct >= 15) score += 4;
    else if (economics.contributionMarginPct > 0) score += 1;
  }
  return Math.min(25, score);
}

function scoreMarketOpportunity(saturation?: SaturationAssessment, pricing?: PricingResearch): number {
  if (!saturation && !pricing) return 7; // unknown — neutral, research required
  let score = 0;
  if (saturation) {
    score += saturation.verdict === "GREEN" ? 8 : saturation.verdict === "YELLOW" ? 4 : 0;
  } else {
    score += 4;
  }
  if (pricing) {
    score += pricing.confidence === "HIGH" ? 7 : pricing.confidence === "MEDIUM" ? 4 : 2;
  } else {
    score += 3;
  }
  return Math.min(15, score);
}

function scoreCompetitionSaturation(saturation?: SaturationAssessment): number {
  if (!saturation) return 7;
  if (saturation.verdict === "GREEN") return 15;
  if (saturation.verdict === "YELLOW") return 8;
  return 0;
}

function scoreRtoRisk(rtoEstimate: RtoEstimate | undefined, economics: ProductEconomics): number {
  if (economics.maxViableCAC <= 0) return 0;
  if (!rtoEstimate) return 7; // unknown, using placeholder RTO — genuine uncertainty
  const confidenceBonus: Record<Confidence, number> = { HIGH: 6, MEDIUM: 3, LOW: 1 };
  let score = confidenceBonus[rtoEstimate.confidence];
  if (rtoEstimate.source === "VALIDATED") score += 6;
  else if (rtoEstimate.source === "ACTUAL_OBSERVED") score += 4;
  else score += 2;
  if (rtoEstimate.base <= 20) score += 3;
  else if (rtoEstimate.base <= 35) score += 1;
  return Math.min(15, score);
}

function scoreSupplierAvailability(supplierAvailable?: boolean | null): number {
  if (supplierAvailable === true) return 10;
  if (supplierAvailable === false) return 0;
  return 5; // unknown
}

function scorePriceOpportunity(pricing: PricingResearch | undefined, sellingPrice: number): number {
  if (!pricing) return 5;
  const { recommendedTestRangeLow, recommendedTestRangeHigh } = pricing;
  if (recommendedTestRangeLow != null && recommendedTestRangeHigh != null) {
    if (sellingPrice >= recommendedTestRangeLow && sellingPrice <= recommendedTestRangeHigh) return 10;
    return 4;
  }
  return 6;
}

function scoreTestingFeasibility(testPlan: TestPlan): number {
  if (testPlan.tier === "STANDARD") return 10;
  if (testPlan.tier === "LOW_BUDGET") return 7;
  return 3;
}

export function evaluateProductVerdict(inputs: VerdictInputs): ProductVerdictResult {
  const { economics, rtoEstimate, saturation, pricing, supplierAvailable, testPlan } = inputs;

  const scoreBreakdown: ScoreBreakdown = {
    economicViability: scoreEconomicViability(economics),
    marketOpportunity: scoreMarketOpportunity(saturation, pricing),
    competitionSaturation: scoreCompetitionSaturation(saturation),
    rtoRisk: scoreRtoRisk(rtoEstimate, economics),
    supplierAvailability: scoreSupplierAvailability(supplierAvailable),
    priceOpportunity: scorePriceOpportunity(pricing, economics.effectiveSellingPrice),
    testingFeasibility: scoreTestingFeasibility(testPlan),
  };

  const score = Math.round(
    Object.values(scoreBreakdown).reduce((sum, v) => sum + v, 0),
  );

  const positive: string[] = [];
  const negative: string[] = [];

  if (economics.passes3xRule) positive.push("Passes the 3× product-cost screening rule.");
  else negative.push("Fails the 3× product-cost screening rule (initial screening signal only — not a final verdict on its own).");

  if (economics.maxViableCAC > 0) positive.push("Positive maximum viable CAC — economics leave room for advertising cost.");
  else negative.push("Maximum viable CAC is zero or negative — there is no room for ad spend at this RTO/cost structure.");

  if (supplierAvailable === true) positive.push("Supplier availability confirmed.");
  else if (supplierAvailable === false) negative.push("No supplier confirmed yet.");

  if (saturation) {
    if (saturation.verdict === "GREEN") positive.push("Current market activity exists without signs of heavy saturation.");
    if (saturation.verdict === "RED") negative.push(`Likely saturated: ${saturation.reason}`);
    if (saturation.verdict === "YELLOW") negative.push(`Saturation signal is mixed: ${saturation.reason}`);
  }

  if (rtoEstimate) {
    if (economics.maxViableCAC > 0) {
      positive.push(
        `RTO appears economically manageable at the ${rtoEstimate.source === "RESEARCH_ESTIMATE" ? "researched estimate" : "observed"} rate (${rtoEstimate.base}%, confidence ${rtoEstimate.confidence}).`,
      );
    }
  } else {
    negative.push("No RTO research or actual data yet — economics are using a placeholder RTO estimate.");
  }

  for (const w of economics.warnings) negative.push(w);

  let verdict: Verdict;
  if (economics.maxViableCAC <= 0) {
    verdict = "RED";
  } else if (score >= 70) {
    verdict = "GREEN";
  } else if (score >= 40) {
    verdict = "YELLOW";
  } else {
    verdict = "RED";
  }

  const hasResearch = Boolean(saturation || pricing || rtoEstimate);
  const rtoConfidenceHigh = rtoEstimate?.confidence === "HIGH" || rtoEstimate?.source !== "RESEARCH_ESTIMATE";
  let confidence: Confidence;
  if (!hasResearch) confidence = "LOW";
  else if (saturation && pricing && rtoEstimate && rtoConfidenceHigh) confidence = "HIGH";
  else confidence = "MEDIUM";

  let biggestRisk: string;
  if (economics.maxViableCAC <= 0) {
    biggestRisk = "Negative unit economics — there is no room for advertising cost before you even launch a test.";
  } else if (saturation?.verdict === "RED") {
    biggestRisk = "Likely saturation — this may be an older winner with limited room for a new advertiser to compete efficiently.";
  } else if (!rtoEstimate || rtoEstimate.confidence === "LOW") {
    biggestRisk = "RTO uncertainty — the actual delivery rate is unproven and could erode margin once real orders start shipping.";
  } else if (supplierAvailable === false || supplierAvailable == null) {
    biggestRisk = "Supplier availability is not yet confirmed — verify before committing ad budget.";
  } else {
    biggestRisk = "Execution risk — creative quality and targeting will determine whether this hits its viable CAC.";
  }

  let whatCouldMakeItViable: string | undefined;
  if (!economics.passes3xRule) {
    whatCouldMakeItViable = "A higher selling price or a lower landed product cost would restore 3× screening-rule headroom.";
  } else if (economics.maxViableCAC <= 0) {
    whatCouldMakeItViable = "Reducing shipping, packaging, or RTO-related costs — or raising price — could open real advertising room.";
  } else if (economics.contributionMarginPct != null && economics.contributionMarginPct < 15) {
    whatCouldMakeItViable = "A leaner cost structure or a modest price increase would widen the margin cushion before scaling.";
  }

  const recommendedTestSummary = `${testPlan.numberOfAdSets} ad sets × ₹${testPlan.budgetPerAdSet}/day (₹${testPlan.totalRecommendedDailyBudget}/day total), ${testPlan.targeting.toLowerCase()}, ${testPlan.creatives}.`;

  let nextAction: string;
  if (verdict === "GREEN") {
    nextAction = "Launch the test plan below with the recommended budget and structure.";
  } else if (verdict === "YELLOW") {
    nextAction = "Address the biggest risk first, or test cautiously with a differentiated angle before committing full budget.";
  } else {
    nextAction = "Do not test this product as-is. Fix the underlying economics (price, cost, or RTO exposure) first.";
  }

  return {
    verdict,
    confidence,
    score,
    scoreBreakdown,
    reasons: { positive, negative },
    biggestRisk,
    whatCouldMakeItViable,
    recommendedTestSummary,
    nextAction,
  };
}
