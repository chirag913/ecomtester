import { describe, expect, it } from "vitest";
import { buildTestPlan } from "./index";

describe("test planner budget tiers", () => {
  it("uses standard framework at ₹2000/day", () => {
    const plan = buildTestPlan(2000, 410, 900);
    expect(plan.tier).toBe("STANDARD");
    expect(plan.budgetPerAdSet).toBe(500);
    expect(plan.numberOfAdSets).toBe(4);
    expect(plan.totalRecommendedDailyBudget).toBe(2000);
  });

  it("scenario 9: uses low-budget framework at ₹1200/day", () => {
    const plan = buildTestPlan(1200, 410, 699);
    expect(plan.tier).toBe("LOW_BUDGET");
    expect(plan.budgetPerAdSet).toBe(300);
    expect(plan.totalRecommendedDailyBudget).toBe(1200);
  });

  it("flags insufficient budget below the low-budget floor without crashing", () => {
    const plan = buildTestPlan(400, 410, 699);
    expect(plan.tier).toBe("INSUFFICIENT");
    expect(plan.budgetPerAdSet).toBe(100);
    expect(Number.isFinite(plan.budgetPerAdSet)).toBe(true);
  });

  it("handles zero or negative budget without NaN", () => {
    const plan = buildTestPlan(0, 410, 699);
    expect(plan.budgetPerAdSet).toBe(0);
    expect(Number.isFinite(plan.totalRecommendedDailyBudget)).toBe(true);
  });

  it("notes when a low-budget product is priced above the ₹999 comfort ceiling", () => {
    const plan = buildTestPlan(1200, 410, 1500);
    expect(plan.budgetNote).toMatch(/999/);
  });
});
