/**
 * Every tunable number the decision engine uses, in one place, split honestly
 * into two buckets:
 *
 *   MENTOR_APPROVED — numbers Chirag gave explicitly in the product spec.
 *   These are mentorship rules. Cite the exact spec line in the comment.
 *
 *   INTERNAL_DEFAULT — numbers this build invented so the engine could be
 *   fully deterministic (per spec requirement: "no LLM guesswork on the
 *   math"). These are engineering placeholders, NOT mentorship rules, and
 *   MUST NOT be presented to a student as something Chirag said. Every UI
 *   surface that uses one of these must visibly label it as an assumption.
 *   They are pending Chirag's review — see the audit report.
 */

export const MENTOR_APPROVED = {
  /** "STANDARD TEST: 4 ABO ad sets, ₹500 per ad set/day" */
  standardBudgetPerAdSet: 500,
  /** "LOW BUDGET: 4 ad sets, ₹300 per ad set/day" */
  lowBudgetPerAdSet: 300,
  /** "4 ABO ad sets" (both tiers) */
  numAdSetsPerTest: 4,
  /** "I generally prefer products below ₹999" for low-budget tests */
  lowBudgetPriceCeiling: 999,
  /** "Default threshold: ₹500" for the kill rule */
  defaultKillThresholdRupees: 500,
  /** "30–50 mature orders: Initial signal" */
  initialSignalMatureOrders: 30,
  /** "~100 mature orders: Preferred validation" */
  preferredValidationMatureOrders: 100,
} as const;

export const INTERNAL_DEFAULT = {
  // --- Unit economics (lib/economics) ---
  /** % of product cost assumed damaged/unsellable when an order RTOs. Not given by Chirag — invented so RTO economics can be modeled instead of ignored. */
  rtoProductLossPct: 10,
  /** Safety margin subtracted from break-even CAC to get "maximum viable CAC". Not given by Chirag. */
  targetMarginBufferPct: 15,
  /** % of orders assumed COD when not specified. Directionally consistent with "primarily COD" framework language, but the exact 100% figure is this build's default, not a quoted number. */
  codMixPct: 100,
  /** RTO % used when neither research nor actual delivery data exists yet. Must always be visibly flagged as a placeholder, never presented as a real estimate. */
  placeholderRtoPct: 20,
  /** Below this fraction of maximum viable CAC, CPP is shown GREEN instead of YELLOW. Purely a display band, invented. */
  cppGreenThresholdPctOfCeiling: 0.85,

  // --- Ad set kill/continue/promising (lib/decisions/adset) ---
  /** Purchases needed before an ad set with healthy CPP is called "keep running" instead of merely "promising". Chirag's spec says two purchases is not enough to call a winner; this build picked 3 as the cutoff. */
  minPurchasesForConfidentCall: 3,

  // --- Product verdict score (lib/decisions/verdict) ---
  /** Score >= this is shown GREEN. Chirag's spec gives the category weights (25/15/15/15/10/10/10) but not a pass/fail cutoff — this build invented one. */
  verdictGreenScoreCutoff: 70,
  /** Score >= this (and below the GREEN cutoff) is shown YELLOW; below this is RED. Invented. */
  verdictYellowScoreCutoff: 40,

  // --- Delivery / RTO validation (lib/scaling/delivery) ---
  /** Mature orders at/above which delivery confidence is shown as "STRONG" rather than "PREFERRED". The spec only describes "100+: stronger confidence" as a continuum, not a second hard cutoff — this 150 figure is this build's invention for display purposes only. It does not gate any decision (see scale-decision.ts). */
  strongConfidenceMatureOrders: 150,

  // --- Scale decision (lib/scaling/scale-decision) ---
  /** Contribution margin required, on top of a healthy CPP and validated delivery, to recommend STRONG_SCALE instead of SCALE. Invented. */
  strongScaleMarginThresholdPct: 20,
  /** Refund cost as a % of revenue considered "elevated" and worth flagging even while scaling. Invented. */
  elevatedRefundsThresholdPct: 5,

  // --- RTO actual-data validation (lib/research/rto) ---
  /** Mature orders at/above which an actually-observed RTO rate is promoted from "ACTUAL_OBSERVED" to "VALIDATED". Invented — the spec's own "~100 preferred validation" language would argue for 100, not 60; this build used 60 (2x the "initial signal" floor) as a middle ground. Flagged for review. */
  actualRtoValidatedMatureOrders: 60,
} as const;
