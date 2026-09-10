import type { DeliveryMetrics, DeliveryValidation, ValidationConfidence } from "@/lib/types";
import { INTERNAL_DEFAULT, MENTOR_APPROVED } from "@/lib/defaults";

/**
 * Delivery/RTO validation. Orders "in transit" are neither delivered nor RTO
 * and must never be counted as mature.
 *
 * Chirag's spec gives two mature-order bands: "30-50 mature orders: initial
 * signal" and "~100 mature orders: preferred validation" — explicitly as
 * guidance, not hard cutoffs ("do not force exactly 100 as an absolute
 * rule"). A fourth "STRONG" label at 150+ orders is this build's own
 * invention for display purposes only (INTERNAL_DEFAULT.strongConfidenceMatureOrders)
 * — it does not gate the scale decision, which only requires PREFERRED
 * (>=100) or better; see scaling/scale-decision.ts.
 */
export function validateDelivery(metrics: DeliveryMetrics): DeliveryValidation {
  const delivered = Math.max(0, metrics.ordersDelivered);
  const rto = Math.max(0, metrics.ordersRTO);
  const matureOrderCount = delivered + rto;

  const observedDeliveryRate = matureOrderCount > 0 ? delivered / matureOrderCount : null;
  const observedRtoRate = matureOrderCount > 0 ? rto / matureOrderCount : null;

  let confidence: ValidationConfidence;
  if (matureOrderCount < MENTOR_APPROVED.initialSignalMatureOrders) {
    confidence = "NONE";
  } else if (matureOrderCount < MENTOR_APPROVED.preferredValidationMatureOrders) {
    confidence = "INITIAL";
  } else if (matureOrderCount < INTERNAL_DEFAULT.strongConfidenceMatureOrders) {
    confidence = "PREFERRED";
  } else {
    confidence = "STRONG";
  }

  const notes: string[] = [];
  if (metrics.ordersInTransit > 0) {
    notes.push(
      `${metrics.ordersInTransit} order(s) are still in transit — not counted as delivered or RTO.`,
    );
  }
  if (confidence === "NONE") {
    notes.push("Fewer than 30 mature (delivered + RTO) orders. Too early to validate delivery economics.");
  } else if (confidence === "INITIAL") {
    notes.push("This is an initial signal, not full validation. Keep collecting mature orders.");
  } else if (confidence === "PREFERRED") {
    notes.push("This is the preferred validation range for a scale decision.");
  } else {
    notes.push("Strong confidence — sufficient mature order volume to trust this delivery rate.");
  }

  // Matches the actual gate scale-decision.ts uses (PREFERRED or STRONG).
  // INITIAL is explicitly "a signal, not full validation" per the spec, so
  // it is not considered ready on its own.
  const readyForScaleConsideration = confidence === "PREFERRED" || confidence === "STRONG";

  return {
    matureOrderCount,
    observedDeliveryRate,
    observedRtoRate,
    confidence,
    readyForScaleConsideration,
    notes,
  };
}
