import type { DeliveryMetrics, DeliveryValidation, ValidationConfidence } from "@/lib/types";

/**
 * Delivery/RTO validation. Orders "in transit" are neither delivered nor RTO
 * and must never be counted as mature. Preferred validation framework:
 * 30-50 mature orders = initial signal, ~100 = preferred, 100+ = stronger
 * confidence. These are guidance thresholds, not hard cutoffs.
 */
export function validateDelivery(metrics: DeliveryMetrics): DeliveryValidation {
  const delivered = Math.max(0, metrics.ordersDelivered);
  const rto = Math.max(0, metrics.ordersRTO);
  const matureOrderCount = delivered + rto;

  const observedDeliveryRate = matureOrderCount > 0 ? delivered / matureOrderCount : null;
  const observedRtoRate = matureOrderCount > 0 ? rto / matureOrderCount : null;

  let confidence: ValidationConfidence;
  if (matureOrderCount < 30) {
    confidence = "NONE";
  } else if (matureOrderCount < 50) {
    confidence = "INITIAL";
  } else if (matureOrderCount < 100) {
    confidence = "INITIAL";
  } else {
    confidence = matureOrderCount >= 100 ? "STRONG" : "PREFERRED";
  }
  // Explicit banding per spec: 30-50 initial, ~100 preferred, 100+ stronger.
  if (matureOrderCount >= 30 && matureOrderCount < 100) confidence = "INITIAL";
  if (matureOrderCount >= 100) confidence = "PREFERRED";
  if (matureOrderCount >= 150) confidence = "STRONG";

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

  const readyForScaleConsideration = confidence !== "NONE";

  return {
    matureOrderCount,
    observedDeliveryRate,
    observedRtoRate,
    confidence,
    readyForScaleConsideration,
    notes,
  };
}
