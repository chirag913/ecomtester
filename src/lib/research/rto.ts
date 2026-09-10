import type { RtoEstimate } from "@/lib/types";
import { INTERNAL_DEFAULT, MENTOR_APPROVED } from "@/lib/defaults";

/**
 * Actual observed RTO always overrides a research estimate. Once enough
 * mature orders exist, the observation is promoted to "validated". The
 * ACTUAL_OBSERVED -> VALIDATED cutoff (INTERNAL_DEFAULT.actualRtoValidatedMatureOrders)
 * is this build's own default, not a number Chirag gave.
 */
export function buildRtoEstimateFromActual(deliveredOrders: number, rtoOrders: number): RtoEstimate {
  const mature = deliveredOrders + rtoOrders;
  const basePct = mature > 0 ? (rtoOrders / mature) * 100 : 0;
  const isValidated = mature >= INTERNAL_DEFAULT.actualRtoValidatedMatureOrders;

  return {
    source: isValidated ? "VALIDATED" : "ACTUAL_OBSERVED",
    low: basePct,
    base: basePct,
    high: basePct,
    confidence:
      mature >= MENTOR_APPROVED.preferredValidationMatureOrders
        ? "HIGH"
        : mature >= MENTOR_APPROVED.initialSignalMatureOrders
          ? "MEDIUM"
          : "LOW",
    reason: `Based on ${mature} mature order(s): ${deliveredOrders} delivered, ${rtoOrders} RTO.`,
    researchedAt: new Date().toISOString(),
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
