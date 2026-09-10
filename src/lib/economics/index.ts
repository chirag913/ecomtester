import type { EconomicsAssumptions, ProductEconomics, ProductInputs } from "@/lib/types";
import { INTERNAL_DEFAULT } from "@/lib/defaults";

const DEFAULT_COD_MIX_PCT = INTERNAL_DEFAULT.codMixPct;
const DEFAULT_RTO_PRODUCT_LOSS_PCT = INTERNAL_DEFAULT.rtoProductLossPct;
const DEFAULT_TARGET_MARGIN_BUFFER_PCT = INTERNAL_DEFAULT.targetMarginBufferPct;

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Deterministic unit-economics engine. Pure arithmetic — no LLM involvement.
 *
 * RTO is modeled economically rather than as a flat "selling price × RTO%"
 * deduction: forward shipping and packaging are spent on every shipped order,
 * reverse shipping and a partial product-cost loss only hit the RTO share,
 * and payment fees are split by COD/prepaid mix (COD fees are only charged on
 * collection, i.e. delivery; prepaid gateway fees are charged upfront on every
 * shipped order since the money is already collected).
 */
export function calculateProductEconomics(
  inputs: ProductInputs,
  rtoPctOverride?: number,
): ProductEconomics {
  const warnings: string[] = [];

  const productCost = safeNumber(inputs.productCost);
  const sellingPrice = safeNumber(inputs.sellingPrice);
  const shippingCost = safeNumber(inputs.shippingCost);
  const packagingCost = safeNumber(inputs.packagingCost);
  const otherVariableCost = safeNumber(inputs.otherVariableCost);
  const paymentFeePct = clampPct(safeNumber(inputs.paymentFeePct));
  const discountPct = clampPct(safeNumber(inputs.expectedDiscountPct));

  const reverseShippingCost = safeNumber(inputs.reverseShippingCost ?? shippingCost);
  const codMixPct = clampPct(inputs.codMixPct ?? DEFAULT_COD_MIX_PCT);
  const rtoProductLossPct = clampPct(
    inputs.rtoProductLossPct ?? DEFAULT_RTO_PRODUCT_LOSS_PCT,
  );
  const targetMarginBufferPct = clampPct(
    inputs.targetMarginBufferPct ?? DEFAULT_TARGET_MARGIN_BUFFER_PCT,
  );

  const rtoPctUsed = clampPct(safeNumber(rtoPctOverride ?? 0));
  const rto = rtoPctUsed / 100;
  const deliveryRateUsed = 1 - rto;

  const codShare = codMixPct / 100;
  const prepaidShare = 1 - codShare;

  const effectiveSellingPrice = sellingPrice * (1 - discountPct / 100);
  const minimumRecommendedPrice = productCost * 3;
  const passes3xRule = sellingPrice >= minimumRecommendedPrice;

  if (sellingPrice < productCost) {
    warnings.push("Selling price is below product cost. Every order loses money before shipping or ads.");
  }
  if (shippingCost > productCost && productCost > 0) {
    warnings.push("Shipping cost exceeds product cost. Verify this is correct — it sharply compresses margin.");
  }

  // ---- "Ideal" per-order margin: assumes full delivery, no RTO drag. ----
  const codFeeIfCollected = effectiveSellingPrice * (paymentFeePct / 100);
  const grossContributionBeforeAds =
    effectiveSellingPrice -
    productCost -
    shippingCost -
    packagingCost -
    otherVariableCost -
    codFeeIfCollected;

  // ---- Blended, RTO-weighted economics per shipped order. ----
  const expectedRevenuePerShipped = effectiveSellingPrice * deliveryRateUsed;

  const expectedProductCostPerShipped =
    productCost * deliveryRateUsed + productCost * (rtoProductLossPct / 100) * rto;

  const expectedShippingCostPerShipped = shippingCost + reverseShippingCost * rto;

  const expectedPaymentFeePerShipped =
    effectiveSellingPrice *
    (paymentFeePct / 100) *
    (codShare * deliveryRateUsed + prepaidShare * 1);

  const expectedContributionPerShippedOrder =
    expectedRevenuePerShipped -
    expectedProductCostPerShipped -
    expectedShippingCostPerShipped -
    packagingCost -
    expectedPaymentFeePerShipped -
    otherVariableCost;

  const expectedContributionPerDeliveredOrder =
    deliveryRateUsed > 0 ? expectedContributionPerShippedOrder / deliveryRateUsed : null;

  const breakEvenCAC = expectedContributionPerShippedOrder;
  const maxViableCAC = breakEvenCAC * (1 - targetMarginBufferPct / 100);

  const contributionMarginPct =
    effectiveSellingPrice > 0
      ? (expectedContributionPerShippedOrder / effectiveSellingPrice) * 100
      : null;

  const assumptions: EconomicsAssumptions = {
    reverseShippingCost,
    codMixPct,
    rtoProductLossPct,
    targetMarginBufferPct,
  };

  return {
    effectiveSellingPrice,
    passes3xRule,
    minimumRecommendedPrice,
    rtoPctUsed,
    deliveryRateUsed,
    grossContributionBeforeAds,
    expectedContributionPerShippedOrder,
    expectedContributionAfterRTO: expectedContributionPerShippedOrder,
    expectedContributionPerDeliveredOrder,
    breakEvenCAC,
    maxViableCAC,
    contributionMarginPct,
    contributionAfterCAC: (cac: number) => expectedContributionPerShippedOrder - safeNumber(cac),
    assumptions,
    warnings,
  };
}

/**
 * The 0.85 GREEN/YELLOW split is an internal display default (see
 * INTERNAL_DEFAULT.cppGreenThresholdPctOfCeiling), not a mentorship rule.
 * A CPP anywhere at/below maxViableCAC is economically viable either way.
 */
export function cppStatus(
  cpp: number,
  maxViableCAC: number,
): "GREEN" | "YELLOW" | "RED" {
  if (maxViableCAC <= 0) return "RED";
  if (cpp <= maxViableCAC * INTERNAL_DEFAULT.cppGreenThresholdPctOfCeiling) return "GREEN";
  if (cpp <= maxViableCAC) return "YELLOW";
  return "RED";
}
