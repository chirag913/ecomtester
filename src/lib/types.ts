// Core domain types for ECOM TESTER.
// Business logic types only — no UI concerns here.

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type Verdict = "GREEN" | "YELLOW" | "RED";

// ---------------------------------------------------------------------------
// A. USER-PROVIDED FACTS
// ---------------------------------------------------------------------------

export interface ProductInputs {
  productName: string;
  productCategory: string;
  productCost: number;
  sellingPrice: number;
  shippingCost: number;
  packagingCost: number;
  paymentFeePct: number; // COD collection fee / payment gateway fee, as % of selling price
  otherVariableCost: number;
  expectedDiscountPct: number; // 0-100
  dailyAdBudget: number;

  // Optional refinements — sensible defaults applied if omitted.
  reverseShippingCost?: number; // defaults to shippingCost
  codMixPct?: number; // 0-100, defaults to 100 (fully COD, per methodology)
  rtoProductLossPct?: number; // % of product cost assumed damaged/unsellable on RTO, defaults to 10
  targetMarginBufferPct?: number; // safety buffer below break-even CAC, defaults to 15

  // Optional research-assist links.
  supplierName?: string;
  supplierUrl?: string;
  indiamartUrl?: string;
  dropshippingSupplierUrl?: string;
  existingStoreUrl?: string;
  productUrl?: string;
}

// ---------------------------------------------------------------------------
// C. CALCULATED ECONOMICS (deterministic — never LLM-derived)
// ---------------------------------------------------------------------------

export interface ProductEconomics {
  effectiveSellingPrice: number;
  passes3xRule: boolean;
  minimumRecommendedPrice: number;

  // RTO used for this calculation (research estimate OR actual/validated — see RtoEstimate).
  rtoPctUsed: number;
  deliveryRateUsed: number;

  grossContributionBeforeAds: number; // ideal per-order margin assuming full delivery, no RTO drag
  expectedContributionPerShippedOrder: number; // blended across delivered + RTO orders
  expectedContributionAfterRTO: number; // alias of expectedContributionPerShippedOrder, shown for spec traceability
  expectedContributionPerDeliveredOrder: number | null; // null when deliveryRate is 0

  breakEvenCAC: number; // CAC at which contribution = 0
  maxViableCAC: number; // breakEvenCAC minus safety buffer
  contributionMarginPct: number | null; // null when effectiveSellingPrice is 0

  contributionAfterCAC: (cac: number) => number;

  assumptions: EconomicsAssumptions;
  warnings: string[];
}

export interface EconomicsAssumptions {
  reverseShippingCost: number;
  codMixPct: number;
  rtoProductLossPct: number;
  targetMarginBufferPct: number;
}

// ---------------------------------------------------------------------------
// B. RESEARCH-DERIVED ASSUMPTIONS
// ---------------------------------------------------------------------------

export type ResearchTopic =
  | "meta_saturation"
  | "pricing"
  | "rto_benchmark"
  | "supplier_availability"
  | "prepaid_apps"
  | "testing_strategy";

export interface ResearchEvidence {
  value: string;
  source: string;
  sourceUrl?: string;
  confidence: Confidence;
  researchedAt: string; // ISO date
  notes?: string;
}

export interface ResearchEntry {
  topic: ResearchTopic;
  finding: string;
  evidence: ResearchEvidence[];
}

export type RtoSource = "RESEARCH_ESTIMATE" | "ACTUAL_OBSERVED" | "VALIDATED";

export interface RtoEstimate {
  source: RtoSource;
  low: number; // %
  base: number; // %
  high: number; // %
  confidence: Confidence;
  reason: string;
  // Present only when source is ACTUAL_OBSERVED or VALIDATED.
  matureOrders?: number;
  deliveredOrders?: number;
  rtoOrders?: number;
}

export type SaturationVerdict = "GREEN" | "YELLOW" | "RED";

export interface SaturationAssessment {
  verdict: SaturationVerdict;
  reason: string;
  confidence: Confidence;
  exactAdCountKnown: boolean;
}

export interface PricingResearch {
  lowMarketPrice?: number;
  commonPrice?: number;
  premiumPrice?: number;
  recommendedTestRangeLow?: number;
  recommendedTestRangeHigh?: number;
  confidence: Confidence;
  notes?: string;
}

// ---------------------------------------------------------------------------
// PRODUCT VERDICT (Mode 1 output)
// ---------------------------------------------------------------------------

export interface ProductVerdictResult {
  verdict: Verdict;
  confidence: Confidence;
  score: number; // 0-100, summary only
  scoreBreakdown: ScoreBreakdown;
  reasons: { positive: string[]; negative: string[] };
  biggestRisk: string;
  whatCouldMakeItViable?: string;
  recommendedTestSummary: string;
  nextAction: string;
}

export interface ScoreBreakdown {
  economicViability: number; // out of 25
  marketOpportunity: number; // out of 15
  competitionSaturation: number; // out of 15
  rtoRisk: number; // out of 15
  supplierAvailability: number; // out of 10
  priceOpportunity: number; // out of 10
  testingFeasibility: number; // out of 10
}

// ---------------------------------------------------------------------------
// MODE 2 — TEST PLANNER
// ---------------------------------------------------------------------------

export type TestTier = "STANDARD" | "LOW_BUDGET" | "INSUFFICIENT";

export interface TestPlan {
  tier: TestTier;
  dailyBudget: number;
  numberOfAdSets: number;
  budgetPerAdSet: number;
  totalRecommendedDailyBudget: number;
  targeting: string;
  placements: string;
  creatives: string;
  maxViableCAC: number;
  killRuleThreshold: number;
  killRuleExplanation: string;
  continueRuleExplanation: string;
  budgetNote: string;
}

// ---------------------------------------------------------------------------
// MODE 2 — AD SET TRACKING / KILL-CONTINUE
// ---------------------------------------------------------------------------

export interface AdSet {
  id: string;
  name: string;
  campaign: string;
  creative: string;
}

export interface AdSetDailyMetrics {
  adSetId: string;
  date: string; // ISO date
  spend: number;
  purchases: number;
  ctr?: number;
  cpc?: number;
  atc?: number;
  checkout?: number;
}

export type AdSetStatus =
  | "KILL"
  | "GIVE_ANOTHER_DAY"
  | "PROMISING"
  | "KEEP_RUNNING"
  | "INSUFFICIENT_DATA";

export interface AdSetDecision {
  status: AdSetStatus;
  cpp: number | null;
  totalSpend: number;
  totalPurchases: number;
  daysRunning: number;
  reasons: string[];
  nextAction: string;
  doNotChange: boolean;
}

// ---------------------------------------------------------------------------
// MODE 3 — DELIVERY / RTO VALIDATION
// ---------------------------------------------------------------------------

export interface DeliveryMetrics {
  ordersPlaced: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersRTO: number;
  ordersInTransit: number;
}

export type ValidationConfidence = "NONE" | "INITIAL" | "PREFERRED" | "STRONG";

export interface DeliveryValidation {
  matureOrderCount: number; // delivered + RTO
  observedDeliveryRate: number | null;
  observedRtoRate: number | null;
  confidence: ValidationConfidence;
  readyForScaleConsideration: boolean;
  notes: string[];
}

// ---------------------------------------------------------------------------
// MODE 3 — REALIZED ECONOMICS
// ---------------------------------------------------------------------------

export interface RealizedEconomicsInputs {
  revenue: number;
  adSpend: number;
  productCostTotal: number;
  shippingTotal: number;
  rtoCostTotal: number;
  paymentFeesTotal: number;
  refundCostTotal: number;
  deliveredOrders: number;
}

export interface RealizedEconomics {
  netContribution: number;
  contributionPerOrder: number | null;
  contributionMarginPct: number | null;
}

// ---------------------------------------------------------------------------
// MODE 3 — SCALE DECISION
// ---------------------------------------------------------------------------

export type ScaleState = "CONTINUE" | "SCALE" | "STRONG_SCALE";

export interface ScaleDecisionResult {
  state: ScaleState;
  reasons: string[];
  nextAction: string;
  doNotDo: string[];
  watch: string[];
}

// ---------------------------------------------------------------------------
// DECISION EXPLANATION (shared shape for "WHY" panels)
// ---------------------------------------------------------------------------

export interface DecisionExplanation {
  headline: string;
  why: string[];
  nextAction: string;
  doNotChange?: string[];
  watch?: string[];
}
