import type { RealizedEconomics, RealizedEconomicsInputs } from "@/lib/types";

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
