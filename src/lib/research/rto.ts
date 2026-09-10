import type { RtoEstimate } from "@/lib/types";

const MIN_MATURE_ORDERS_FOR_VALIDATION = 30;

/**
 * Actual observed RTO always overrides a research estimate. Once enough
 * mature orders exist, the observation is promoted to "validated".
 */
export function buildRtoEstimateFromActual(deliveredOrders: number, rtoOrders: number): RtoEstimate {
  const mature = deliveredOrders + rtoOrders;
  const basePct = mature > 0 ? (rtoOrders / mature) * 100 : 0;
  const isValidated = mature >= MIN_MATURE_ORDERS_FOR_VALIDATION * 2; // ~60+ mature orders before we call it "validated"

  return {
    source: isValidated ? "VALIDATED" : "ACTUAL_OBSERVED",
    low: basePct,
    base: basePct,
    high: basePct,
    confidence: mature >= 100 ? "HIGH" : mature >= MIN_MATURE_ORDERS_FOR_VALIDATION ? "MEDIUM" : "LOW",
    reason: `Based on ${mature} mature order(s): ${deliveredOrders} delivered, ${rtoOrders} RTO.`,
    matureOrders: mature,
    deliveredOrders,
    rtoOrders,
  };
}

/**
 * Actual/validated data always takes priority over a research estimate.
 */
export function pickEffectiveRtoEstimate(
  researchEstimate?: RtoEstimate,
  actualEstimate?: RtoEstimate,
): RtoEstimate | undefined {
  if (actualEstimate) return actualEstimate;
  return researchEstimate;
}
