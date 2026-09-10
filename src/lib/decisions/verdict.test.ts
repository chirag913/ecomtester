import { describe, expect, it } from "vitest";
import { evaluateProductVerdict } from "./verdict";
import { calculateProductEconomics } from "@/lib/economics";
import { buildTestPlan } from "@/lib/test-planner";
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

describe("product verdict", () => {
  it("scenario 1: healthy economics with good research scores well", () => {
    const economics = calculateProductEconomics(baseInputs, 20);
    const testPlan = buildTestPlan(baseInputs.dailyAdBudget, economics.maxViableCAC, baseInputs.sellingPrice);
    const result = evaluateProductVerdict({
      economics,
      testPlan,
      supplierAvailable: true,
      saturation: { verdict: "GREEN", reason: "Active current advertisers found", confidence: "MEDIUM", exactAdCountKnown: false },
      pricing: { recommendedTestRangeLow: 800, recommendedTestRangeHigh: 1000, confidence: "MEDIUM" },
      rtoEstimate: { source: "RESEARCH_ESTIMATE", low: 15, base: 20, high: 27, confidence: "MEDIUM", reason: "Category benchmark" },
    });
    expect(result.verdict).not.toBe("RED");
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.positive.length).toBeGreaterThan(0);
  });

  it("scenario 2: fails 3x rule is flagged but does not alone force RED", () => {
    const economics = calculateProductEconomics({ ...baseInputs, sellingPrice: 699 }, 20);
    const testPlan = buildTestPlan(baseInputs.dailyAdBudget, economics.maxViableCAC, 699);
    const result = evaluateProductVerdict({ economics, testPlan, supplierAvailable: null });
    expect(economics.passes3xRule).toBe(false);
    expect(result.reasons.negative.some((n) => n.includes("3×"))).toBe(true);
  });

  it("forces RED when maximum viable CAC is non-positive regardless of score", () => {
    const economics = calculateProductEconomics({ ...baseInputs, sellingPrice: 100 }, 80);
    const testPlan = buildTestPlan(baseInputs.dailyAdBudget, economics.maxViableCAC, 100);
    const result = evaluateProductVerdict({ economics, testPlan, supplierAvailable: true });
    expect(economics.maxViableCAC).toBeLessThanOrEqual(0);
    expect(result.verdict).toBe("RED");
  });

  it("never claims certainty — confidence is LOW without any research", () => {
    const economics = calculateProductEconomics(baseInputs, 20);
    const testPlan = buildTestPlan(baseInputs.dailyAdBudget, economics.maxViableCAC, baseInputs.sellingPrice);
    const result = evaluateProductVerdict({ economics, testPlan });
    expect(result.confidence).toBe("LOW");
  });
});
