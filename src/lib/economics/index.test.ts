import { describe, expect, it } from "vitest";
import { calculateProductEconomics, cppStatus } from "./index";
import type { ProductInputs } from "@/lib/types";

const baseInputs: ProductInputs = {
  productName: "Test Product",
  productCategory: "Gadgets",
  productCost: 300,
  sellingPrice: 900,
  shippingCost: 70,
  packagingCost: 15,
  paymentFeePct: 2,
  otherVariableCost: 10,
  expectedDiscountPct: 0,
  dailyAdBudget: 2000,
};

describe("3x product cost rule", () => {
  it("passes when selling price is exactly 3x cost", () => {
    const eco = calculateProductEconomics(baseInputs, 20);
    expect(eco.passes3xRule).toBe(true);
    expect(eco.minimumRecommendedPrice).toBe(900);
  });

  it("fails when selling price is below 3x cost (scenario 2: 300 cost / 699 price)", () => {
    const eco = calculateProductEconomics({ ...baseInputs, sellingPrice: 699 }, 20);
    expect(eco.passes3xRule).toBe(false);
  });
});

describe("edge cases", () => {
  it("flags selling price below product cost", () => {
    const eco = calculateProductEconomics({ ...baseInputs, sellingPrice: 200 }, 20);
    expect(eco.warnings.some((w) => w.includes("below product cost"))).toBe(true);
  });

  it("flags shipping higher than product cost", () => {
    const eco = calculateProductEconomics({ ...baseInputs, shippingCost: 500 }, 20);
    expect(eco.warnings.some((w) => w.includes("Shipping cost exceeds"))).toBe(true);
  });

  it("never returns NaN or Infinity at RTO = 0%", () => {
    const eco = calculateProductEconomics(baseInputs, 0);
    for (const v of [
      eco.grossContributionBeforeAds,
      eco.expectedContributionPerShippedOrder,
      eco.breakEvenCAC,
      eco.maxViableCAC,
    ]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(eco.expectedContributionPerDeliveredOrder).not.toBeNull();
  });

  it("never returns NaN or Infinity at RTO = 100% and marks per-delivered as null", () => {
    const eco = calculateProductEconomics(baseInputs, 100);
    expect(Number.isFinite(eco.expectedContributionPerShippedOrder)).toBe(true);
    expect(eco.expectedContributionPerDeliveredOrder).toBeNull();
    expect(eco.deliveryRateUsed).toBe(0);
  });

  it("handles COD 100% mix without error", () => {
    const eco = calculateProductEconomics({ ...baseInputs, codMixPct: 100 }, 20);
    expect(Number.isFinite(eco.expectedContributionPerShippedOrder)).toBe(true);
  });

  it("handles prepaid 100% mix (codMixPct = 0) without error", () => {
    const eco = calculateProductEconomics({ ...baseInputs, codMixPct: 0 }, 20);
    expect(Number.isFinite(eco.expectedContributionPerShippedOrder)).toBe(true);
  });

  it("clamps out-of-range RTO override into 0-100", () => {
    const ecoHigh = calculateProductEconomics(baseInputs, 250);
    const ecoLow = calculateProductEconomics(baseInputs, -50);
    expect(ecoHigh.rtoPctUsed).toBe(100);
    expect(ecoLow.rtoPctUsed).toBe(0);
  });

  it("does not divide by zero when selling price is 0", () => {
    const eco = calculateProductEconomics({ ...baseInputs, sellingPrice: 0 }, 20);
    expect(eco.contributionMarginPct).toBeNull();
  });
});

describe("RTO economics modeling (not a flat selling-price x RTO% deduction)", () => {
  it("prepaid RTO still charges gateway fee (fee already collected upfront)", () => {
    const codEco = calculateProductEconomics({ ...baseInputs, codMixPct: 100 }, 30);
    const prepaidEco = calculateProductEconomics({ ...baseInputs, codMixPct: 0 }, 30);
    // Prepaid pays the fee on 100% of shipped orders; COD only pays it on delivered orders.
    // So at the same RTO, prepaid's expected contribution should be lower (more fee drag).
    expect(prepaidEco.expectedContributionPerShippedOrder).toBeLessThan(
      codEco.expectedContributionPerShippedOrder,
    );
  });

  it("higher RTO increases reverse-shipping and product-loss drag", () => {
    const lowRto = calculateProductEconomics(baseInputs, 10);
    const highRto = calculateProductEconomics(baseInputs, 40);
    expect(highRto.expectedContributionPerShippedOrder).toBeLessThan(
      lowRto.expectedContributionPerShippedOrder,
    );
  });
});

describe("maximum viable CAC and break-even CAC", () => {
  it("maxViableCAC is below breakEvenCAC by the safety buffer", () => {
    const eco = calculateProductEconomics(baseInputs, 20);
    expect(eco.maxViableCAC).toBeLessThan(eco.breakEvenCAC);
    const expectedBuffer = eco.breakEvenCAC * 0.15;
    expect(eco.breakEvenCAC - eco.maxViableCAC).toBeCloseTo(expectedBuffer, 5);
  });

  it("contributionAfterCAC subtracts CAC from expected contribution", () => {
    const eco = calculateProductEconomics(baseInputs, 20);
    expect(eco.contributionAfterCAC(100)).toBeCloseTo(
      eco.expectedContributionPerShippedOrder - 100,
      5,
    );
  });
});

describe("cppStatus", () => {
  it("returns GREEN comfortably below ceiling", () => {
    expect(cppStatus(100, 400)).toBe("GREEN");
  });
  it("returns YELLOW near ceiling", () => {
    expect(cppStatus(390, 400)).toBe("YELLOW");
  });
  it("returns RED above ceiling", () => {
    expect(cppStatus(450, 400)).toBe("RED");
  });
  it("returns RED when maxViableCAC is non-positive", () => {
    expect(cppStatus(50, 0)).toBe("RED");
  });
});
