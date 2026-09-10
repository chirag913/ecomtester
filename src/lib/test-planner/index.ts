import type { TestPlan, TestTier } from "@/lib/types";

const STANDARD_BUDGET_PER_ADSET = 500;
const STANDARD_TOTAL = STANDARD_BUDGET_PER_ADSET * 4;
const LOW_BUDGET_PER_ADSET = 300;
const LOW_BUDGET_TOTAL = LOW_BUDGET_PER_ADSET * 4;
const NUM_AD_SETS = 4;
const LOW_BUDGET_PRICE_CEILING = 999;

/**
 * Default mentorship test framework. Labeled explicitly as a default
 * framework, not a universal Meta law. Adjusts per-ad-set spend to the
 * student's actual available budget rather than assuming everyone can
 * spend ₹2,000/day.
 */
export function buildTestPlan(dailyAdBudget: number, maxViableCAC: number, sellingPrice: number): TestPlan {
  const budget = Number.isFinite(dailyAdBudget) && dailyAdBudget > 0 ? dailyAdBudget : 0;

  let tier: TestTier;
  let budgetPerAdSet: number;
  let creatives: string;
  let budgetNote: string;

  if (budget >= STANDARD_TOTAL) {
    tier = "STANDARD";
    budgetPerAdSet = STANDARD_BUDGET_PER_ADSET;
    creatives = "2–3 creatives";
    budgetNote =
      budget > STANDARD_TOTAL
        ? `Your budget (₹${budget.toFixed(0)}/day) covers the standard framework (₹${STANDARD_TOTAL}/day). The surplus is not required — hold it in reserve rather than overspending on day one.`
        : `Your budget covers the standard test framework (4 ad sets × ₹${STANDARD_BUDGET_PER_ADSET}/day).`;
  } else if (budget >= LOW_BUDGET_TOTAL) {
    tier = "LOW_BUDGET";
    budgetPerAdSet = LOW_BUDGET_PER_ADSET;
    creatives = "1–2 creatives maximum";
    budgetNote = `Your budget is limited, so we're reducing spend per ad set to ₹${LOW_BUDGET_PER_ADSET}/day while keeping the 4-ad-set testing structure.`;
  } else {
    tier = "INSUFFICIENT";
    budgetPerAdSet = Math.max(0, Math.floor(budget / NUM_AD_SETS));
    creatives = "1 creative (budget is tight — do not split further)";
    budgetNote = `Your budget (₹${budget.toFixed(0)}/day) is below the recommended low-budget floor of ₹${LOW_BUDGET_TOTAL}/day for a 4-ad-set test. Consider saving up before testing, or testing with fewer ad sets so each one gets a fair shot.`;
  }

  if (tier === "LOW_BUDGET" && sellingPrice > LOW_BUDGET_PRICE_CEILING) {
    budgetNote += ` Note: low-budget testing tends to work best under ₹${LOW_BUDGET_PRICE_CEILING} selling price — at ₹${sellingPrice.toFixed(0)}, tighter ad budgets leave less room to reach a purchase before hitting the testing threshold.`;
  }

  const totalRecommendedDailyBudget = budgetPerAdSet * NUM_AD_SETS;

  const killRuleThreshold = budgetPerAdSet;
  const killRuleExplanation = `If an ad set spends its full daily budget (₹${killRuleThreshold.toFixed(0)}) with zero purchases, stop it. This default aligns with your test tier — but if product economics clearly justify more patience (e.g. maximum viable CAC of ₹${maxViableCAC.toFixed(0)} is notably higher than one day's ad-set budget), it can be reasonable to extend by a day.`;

  const continueRuleExplanation = `If an ad set has a purchase and its CPP is below your maximum viable CAC (₹${maxViableCAC.toFixed(0)}) but sample size is small, keep it running unchanged. Do not edit a healthy ad set.`;

  return {
    tier,
    dailyBudget: budget,
    numberOfAdSets: NUM_AD_SETS,
    budgetPerAdSet,
    totalRecommendedDailyBudget,
    targeting: "Broad / zero interest targeting",
    placements: "Facebook + Instagram / Reels (Advantage+ placements per current framework)",
    creatives,
    maxViableCAC,
    killRuleThreshold,
    killRuleExplanation,
    continueRuleExplanation,
    budgetNote,
  };
}
