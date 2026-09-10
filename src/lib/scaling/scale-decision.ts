import type { DeliveryValidation, RealizedEconomics, ScaleDecisionResult } from "@/lib/types";
import { cppStatus } from "@/lib/economics";
import { INTERNAL_DEFAULT } from "@/lib/defaults";

export interface ScaleDecisionInputs {
  cpp: number;
  maxViableCAC: number;
  deliveryValidation: DeliveryValidation;
  realized: RealizedEconomics;
  elevatedRefunds?: boolean;
}

const STRONG_MARGIN_THRESHOLD_PCT = INTERNAL_DEFAULT.strongScaleMarginThresholdPct;

/**
 * Scaling is never based on CPP alone. This combines acquisition cost,
 * realized (post-delivery) contribution economics, delivery/RTO validation
 * confidence, and mature order volume.
 */
export function evaluateScaleDecision(inputs: ScaleDecisionInputs): ScaleDecisionResult {
  const { cpp, maxViableCAC, deliveryValidation, realized, elevatedRefunds } = inputs;
  const reasons: string[] = [];
  const doNotDo: string[] = [];
  const watch: string[] = [];

  const cppHealthy = cppStatus(cpp, maxViableCAC) !== "RED";
  const contributionPositive = (realized.contributionPerOrder ?? -1) > 0;
  const deliveryConfirmed =
    deliveryValidation.confidence === "PREFERRED" || deliveryValidation.confidence === "STRONG";

  // --- Gate 1: delivery not validated ---
  if (!deliveryConfirmed) {
    reasons.push(
      "Your acquisition numbers may look promising, but your delivered-order economics have not been confirmed.",
    );
    reasons.push(
      `Mature orders so far: ${deliveryValidation.matureOrderCount} (confidence: ${deliveryValidation.confidence}).`,
    );
    doNotDo.push("Do not scale ad spend yet.");
    watch.push("Orders still in transit — wait for them to mature into delivered or RTO.");
    return {
      state: "CONTINUE",
      reasons,
      nextAction: "Keep the current ad sets running unchanged and wait for more mature delivery data.",
      doNotDo,
      watch,
    };
  }

  // --- Gate 2: realized contribution economics ---
  if (!contributionPositive) {
    reasons.push(
      "Realized contribution per delivered order is not positive once RTO, shipping, and payment costs are accounted for.",
    );
    reasons.push("Cheap-looking CPP does not mean the business is profitable after delivery.");
    doNotDo.push("Do not scale. Scaling now would scale losses.");
    watch.push("RTO rate and reverse-shipping cost — these are likely the biggest drag.");
    return {
      state: "CONTINUE",
      reasons,
      nextAction: "Fix product economics (price, RTO, or costs) before increasing spend.",
      doNotDo,
      watch,
    };
  }

  // --- Gate 3: CPP vs viable CAC ---
  if (!cppHealthy) {
    reasons.push(
      `CPP (₹${cpp.toFixed(0)}) is above your maximum viable CAC (₹${maxViableCAC.toFixed(0)}).`,
    );
    doNotDo.push("Do not scale ad spend at the current CPP.");
    return {
      state: "CONTINUE",
      reasons,
      nextAction: "Improve creative/targeting to bring CPP under the viable ceiling before scaling.",
      doNotDo,
      watch,
    };
  }

  // At this point: delivery confirmed, contribution positive, CPP healthy.
  reasons.push(`CPP ₹${cpp.toFixed(0)} is within maximum viable CAC ₹${maxViableCAC.toFixed(0)}.`);
  reasons.push(
    `Delivery validated with ${deliveryValidation.matureOrderCount} mature orders (confidence: ${deliveryValidation.confidence}).`,
  );
  reasons.push(
    `Realized contribution per delivered order is positive${
      realized.contributionPerOrder != null ? ` (₹${realized.contributionPerOrder.toFixed(0)})` : ""
    }.`,
  );

  const strongMargin =
    realized.contributionMarginPct != null && realized.contributionMarginPct >= STRONG_MARGIN_THRESHOLD_PCT;
  const stronglyBelowCeiling = cppStatus(cpp, maxViableCAC) === "GREEN";
  // Spec: "~100 mature orders: preferred validation... 100+: stronger
  // confidence" as a continuum, not a second hard cutoff. So STRONG_SCALE
  // requires the same delivery confirmation as SCALE (PREFERRED or STRONG,
  // i.e. >=100 orders) — it does NOT require the higher, internally-invented
  // 150-order "STRONG" display threshold. That threshold is cosmetic only.
  const strongVolume = deliveryConfirmed;

  if (elevatedRefunds) {
    watch.push("Refund rate looks elevated — monitor closely even while scaling.");
  }

  if (strongMargin && stronglyBelowCeiling && strongVolume && !elevatedRefunds) {
    reasons.push(
      `Contribution margin (${realized.contributionMarginPct!.toFixed(1)}%) is strong and order volume is well validated.`,
    );
    return {
      state: "STRONG_SCALE",
      reasons,
      nextAction: "Duplicate profitable ad sets 4×. Identify the best duplicates the next day and duplicate those again.",
      doNotDo: ["Do not blindly duplicate every ad set — only the profitable ones."],
      watch: [...watch, "Delivery rate and RTO as volume increases.", "Contribution margin as spend scales."],
    };
  }

  return {
    state: "SCALE",
    reasons,
    nextAction: "Duplicate profitable ad sets 4×. Reassess duplicates the next day before duplicating further.",
    doNotDo: ["Do not scale ad sets that are not individually profitable."],
    watch: [...watch, "Delivery rate and RTO as volume increases.", "CPP drift as budgets increase."],
  };
}
