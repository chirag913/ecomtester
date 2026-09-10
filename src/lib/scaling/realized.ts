import type { RealizedEconomics, RealizedEconomicsInputs } from "@/lib/types";
import { INTERNAL_DEFAULT } from "@/lib/defaults";

/**
 * "How much money does this business actually make after delivery/RTO?" —
 * as opposed to Meta's "cheap purchases" framing.
 */
export function calculateRealizedEconomics(inputs: RealizedEconomicsInputs): RealizedEconomics {
  const netContribution =
    inputs.revenue -
    inputs.adSpend -
    inputs.productCostTotal -
    inputs.shippingTotal -
    inputs.rtoCostTotal -
    inputs.paymentFeesTotal -
    inputs.refundCostTotal;

  const contributionPerOrder =
    inputs.deliveredOrders > 0 ? netContribution / inputs.deliveredOrders : null;

  const contributionMarginPct = inputs.revenue > 0 ? (netContribution / inputs.revenue) * 100 : null;

  return {
    netContribution,
    contributionPerOrder,
    contributionMarginPct,
  };
}

/**
 * The 5% threshold is an internal default (INTERNAL_DEFAULT.elevatedRefundsThresholdPct),
 * not a mentor-approved number — refunds/returns are named in the spec's
 * pre-scale checklist without a specific figure.
 */
export function isElevatedRefunds(refundCostTotal: number, revenue: number): boolean {
  return refundCostTotal > 0 && revenue > 0 && (refundCostTotal / revenue) * 100 > INTERNAL_DEFAULT.elevatedRefundsThresholdPct;
}
