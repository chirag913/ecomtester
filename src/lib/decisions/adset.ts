import type { AdSetDailyMetrics, AdSetDecision } from "@/lib/types";

/**
 * Kill / continue / promising logic for a single ad set, evaluated against
 * this product's own economic testing threshold (maxViableCAC) — never a
 * hardcoded ₹500 rule. ₹500 is only the default *display* fallback when the
 * economics genuinely produce a threshold near that range.
 *
 * Rules encoded (from the mentorship framework):
 * - KILL: cumulative spend has reached/exceeded the economic testing
 *   threshold with zero purchases, AND it's not the ad set's first day.
 * - GIVE_ANOTHER_DAY: first day, spend has reached the threshold, exactly
 *   0 or a marginal number of purchases with poor CPP — don't kill yet.
 * - PROMISING: CPP is currently below maxViableCAC but sample size (purchase
 *   count) is too small to call it a winner — keep running, change nothing.
 * - KEEP_RUNNING: healthy CPP with enough purchases to trust it — do not touch.
 * - INSUFFICIENT_DATA: not enough spend yet to make any call.
 */

const MIN_PURCHASES_FOR_CONFIDENT_CALL = 3;

export function evaluateAdSet(
  metrics: AdSetDailyMetrics[],
  economicTestingThreshold: number,
  maxViableCAC: number,
): AdSetDecision {
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const totalSpend = sorted.reduce((sum, m) => sum + m.spend, 0);
  const totalPurchases = sorted.reduce((sum, m) => sum + m.purchases, 0);
  const daysRunning = sorted.length;
  const cpp = totalPurchases > 0 ? totalSpend / totalPurchases : null;

  const reasons: string[] = [];
  const isFirstDay = daysRunning <= 1;
  const threshold =
    Number.isFinite(economicTestingThreshold) && economicTestingThreshold > 0
      ? economicTestingThreshold
      : 500;

  // No purchases at all.
  if (totalPurchases === 0) {
    if (totalSpend >= threshold) {
      if (isFirstDay) {
        reasons.push(
          `Spend has reached your economic testing threshold (₹${threshold.toFixed(0)}) with 0 purchases, but this is only day 1.`,
        );
        return {
          status: "GIVE_ANOTHER_DAY",
          cpp,
          totalSpend,
          totalPurchases,
          daysRunning,
          reasons,
          nextAction: "Give this ad set another day of data before deciding.",
          doNotChange: false,
        };
      }
      reasons.push(
        `Spend (₹${totalSpend.toFixed(0)}) has reached or exceeded your economic testing threshold (₹${threshold.toFixed(0)}) with 0 purchases across ${daysRunning} day(s).`,
      );
      return {
        status: "KILL",
        cpp,
        totalSpend,
        totalPurchases,
        daysRunning,
        reasons,
        nextAction: "Stop this ad set. It has exceeded your economic testing threshold with no purchases.",
        doNotChange: false,
      };
    }
    reasons.push(
      `Spend (₹${totalSpend.toFixed(0)}) has not yet reached your economic testing threshold (₹${threshold.toFixed(0)}).`,
    );
    return {
      status: "INSUFFICIENT_DATA",
      cpp,
      totalSpend,
      totalPurchases,
      daysRunning,
      reasons,
      nextAction: "Let it keep spending toward the testing threshold before judging it.",
      doNotChange: false,
    };
  }

  // Has at least one purchase.
  const isHealthy = cpp !== null && cpp <= maxViableCAC;

  if (isFirstDay && totalPurchases <= 1) {
    reasons.push(
      `Only 1 purchase on day 1 (CPP ₹${cpp?.toFixed(0)} vs maximum viable CAC ₹${maxViableCAC.toFixed(0)}). One data point isn't enough to decide.`,
    );
    return {
      status: "GIVE_ANOTHER_DAY",
      cpp,
      totalSpend,
      totalPurchases,
      daysRunning,
      reasons,
      nextAction: "Give this ad set another day of data, then reassess.",
      doNotChange: false,
    };
  }

  if (isHealthy && totalPurchases < MIN_PURCHASES_FOR_CONFIDENT_CALL) {
    reasons.push(
      `CPP (₹${cpp?.toFixed(0)}) is below your maximum viable CAC (₹${maxViableCAC.toFixed(0)}), but only ${totalPurchases} purchase(s) so far — not enough sample size to call it a winner.`,
    );
    return {
      status: "PROMISING",
      cpp,
      totalSpend,
      totalPurchases,
      daysRunning,
      reasons,
      nextAction: "Keep running. Do not change anything. Collect more consistent data.",
      doNotChange: true,
    };
  }

  if (isHealthy) {
    reasons.push(
      `CPP (₹${cpp?.toFixed(0)}) is comfortably within your maximum viable CAC (₹${maxViableCAC.toFixed(0)}) across ${totalPurchases} purchases.`,
    );
    return {
      status: "KEEP_RUNNING",
      cpp,
      totalSpend,
      totalPurchases,
      daysRunning,
      reasons,
      nextAction: "Keep running unchanged. This ad set is healthy — do not edit it.",
      doNotChange: true,
    };
  }

  // Has purchases, but CPP is above viable CAC.
  if (totalSpend >= threshold) {
    reasons.push(
      `CPP (₹${cpp?.toFixed(0)}) is above your maximum viable CAC (₹${maxViableCAC.toFixed(0)}) after ₹${totalSpend.toFixed(0)} spend.`,
    );
    return {
      status: "KILL",
      cpp,
      totalSpend,
      totalPurchases,
      daysRunning,
      reasons,
      nextAction: "Stop this ad set. Poor economics have persisted past your testing threshold.",
      doNotChange: false,
    };
  }

  reasons.push(
    `CPP (₹${cpp?.toFixed(0)}) is currently above your maximum viable CAC (₹${maxViableCAC.toFixed(0)}), but spend hasn't yet reached the testing threshold.`,
  );
  return {
    status: "GIVE_ANOTHER_DAY",
    cpp,
    totalSpend,
    totalPurchases,
    daysRunning,
    reasons,
    nextAction: "Let it keep running toward the testing threshold before deciding.",
    doNotChange: false,
  };
}
