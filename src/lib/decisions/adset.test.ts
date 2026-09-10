import { describe, expect, it } from "vitest";
import { evaluateAdSet } from "./adset";
import type { AdSetDailyMetrics } from "@/lib/types";

const day = (date: string, spend: number, purchases: number): AdSetDailyMetrics => ({
  adSetId: "as1",
  date,
  spend,
  purchases,
});

describe("kill rule (scenario 3: ₹500 spend, 0 purchases, day 2+)", () => {
  it("kills after threshold reached with zero purchases beyond day 1", () => {
    const metrics = [day("2026-01-01", 500, 0), day("2026-01-02", 10, 0)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.status).toBe("KILL");
    expect(decision.doNotChange).toBe(false);
  });
});

describe("first day exception (scenario 4)", () => {
  it("gives another day when spend hits threshold with 0 purchases on day 1", () => {
    const metrics = [day("2026-01-01", 500, 0)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.status).toBe("GIVE_ANOTHER_DAY");
  });

  it("gives another day when day 1 has 1 purchase with CPP above max viable CAC, and protects it from edits", () => {
    const metrics = [day("2026-01-01", 500, 1)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.cpp).toBe(500);
    expect(decision.status).toBe("GIVE_ANOTHER_DAY");
    expect(decision.doNotChange).toBe(true);
  });
});

describe("promising ad set (scenario 5)", () => {
  it("marks promising with 2 purchases and healthy CPP — do not change", () => {
    const metrics = [day("2026-01-01", 500, 1), day("2026-01-02", 300, 1)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.cpp).toBe(400);
    expect(decision.status).toBe("PROMISING");
    expect(decision.doNotChange).toBe(true);
  });
});

describe("do-not-touch / keep running", () => {
  it("keeps running unchanged with enough purchases and healthy CPP", () => {
    const metrics = [
      day("2026-01-01", 500, 1),
      day("2026-01-02", 500, 1),
      day("2026-01-03", 500, 2),
    ];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.totalPurchases).toBe(4);
    expect(decision.cpp).toBe(375);
    expect(decision.status).toBe("KEEP_RUNNING");
    expect(decision.doNotChange).toBe(true);
  });
});

describe("kill on sustained poor CPP with purchases", () => {
  it("kills when CPP stays above viable CAC past the threshold", () => {
    const metrics = [
      day("2026-01-01", 500, 1),
      day("2026-01-02", 500, 1),
    ];
    // total spend 1000, purchases 2, cpp 500 > maxViableCAC 400, spend >= threshold
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.cpp).toBe(500);
    expect(decision.status).toBe("KILL");
  });
});

describe("insufficient data", () => {
  it("does not judge before threshold spend is reached with 0 purchases", () => {
    const metrics = [day("2026-01-01", 100, 0)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.status).toBe("INSUFFICIENT_DATA");
  });
});

describe("edge cases", () => {
  it("never produces NaN CPP with zero spend and zero purchases", () => {
    const metrics = [day("2026-01-01", 0, 0)];
    const decision = evaluateAdSet(metrics, 500, 400);
    expect(decision.cpp).toBeNull();
  });

  it("falls back to ₹500 threshold if an invalid economic threshold is passed", () => {
    const metrics = [day("2026-01-01", 500, 0), day("2026-01-02", 1, 0)];
    const decision = evaluateAdSet(metrics, NaN, 400);
    expect(decision.status).toBe("KILL");
  });
});
