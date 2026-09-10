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
      saturation: { verdict: "GREEN", reason: "Active current advertisers found", confidence: "MEDIUM", exactAdCountKnown: false, researchedAt: new Date().toISOString() },
      pricing: { recommendedTestRangeLow: 800, recommendedTestRangeHigh: 1000, confidence: "MEDIUM", researchedAt: new Date().toISOString() },
      rtoEstimate: { source: "RESEARCH_ESTIMATE", low: 15, base: 20, high: 27, confidence: "MEDIUM", reason: "Category benchmark", researchedAt: new Date().toISOString() },
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

  it("high RTO with strong economics is not forced to RED — RTO is evaluated together with economics, not as a standalone threshold", () => {
    const strongInputs = {
      ...baseInputs,
      productCost: 200,
      sellingPrice: 1500,
      shippingCost: 50,
      packagingCost: 10,
      paymentFeePct: 2,
      otherVariableCost: 0,
    };
    const economics = calculateProductEconomics(strongInputs, 45); // 45% RTO
    const testPlan = buildTestPlan(strongInputs.dailyAdBudget, economics.maxViableCAC, strongInputs.sellingPrice);
    const result = evaluateProductVerdict({
      economics,
      testPlan,
      rtoEstimate: { source: "RESEARCH_ESTIMATE", low: 40, base: 45, high: 50, confidence: "HIGH", reason: "test", researchedAt: new Date().toISOString() },
    });
    expect(result.verdict).not.toBe("RED");
  });

  it("low RTO with weak economics does not force GREEN — a cheap-looking RTO number is not a green light on its own", () => {
    const weakInputs = {
      ...baseInputs,
      productCost: 300,
      sellingPrice: 310,
      shippingCost: 200,
      packagingCost: 50,
      paymentFeePct: 5,
      otherVariableCost: 20,
    };
    const economics = calculateProductEconomics(weakInputs, 5); // 5% RTO
    const testPlan = buildTestPlan(weakInputs.dailyAdBudget, economics.maxViableCAC, weakInputs.sellingPrice);
    const result = evaluateProductVerdict({
      economics,
      testPlan,
      rtoEstimate: { source: "RESEARCH_ESTIMATE", low: 3, base: 5, high: 8, confidence: "HIGH", reason: "test", researchedAt: new Date().toISOString() },
    });
    expect(result.verdict).toBe("RED");
  });
});
