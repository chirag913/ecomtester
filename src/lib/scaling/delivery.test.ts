import { describe, expect, it } from "vitest";
import { validateDelivery } from "./delivery";

describe("delivery validation", () => {
  it("treats in-transit orders as neither delivered nor RTO (scenario 10)", () => {
    const v = validateDelivery({
      ordersPlaced: 100,
      ordersShipped: 100,
      ordersDelivered: 40,
      ordersRTO: 10,
      ordersInTransit: 50,
    });
    expect(v.matureOrderCount).toBe(50);
    expect(v.notes.some((n) => n.includes("in transit"))).toBe(true);
  });

  it("returns NONE confidence under 30 mature orders", () => {
    const v = validateDelivery({
      ordersPlaced: 20,
      ordersShipped: 20,
      ordersDelivered: 15,
      ordersRTO: 5,
      ordersInTransit: 0,
    });
    expect(v.confidence).toBe("NONE");
    expect(v.readyForScaleConsideration).toBe(false);
  });

  it("returns INITIAL confidence in the 30-99 mature order range", () => {
    const v = validateDelivery({
      ordersPlaced: 50,
      ordersShipped: 50,
      ordersDelivered: 35,
      ordersRTO: 5,
      ordersInTransit: 10,
    });
    expect(v.matureOrderCount).toBe(40);
    expect(v.confidence).toBe("INITIAL");
  });

  it("returns PREFERRED confidence at ~100 mature orders (scenario 6)", () => {
    const v = validateDelivery({
      ordersPlaced: 100,
      ordersShipped: 100,
      ordersDelivered: 82,
      ordersRTO: 18,
      ordersInTransit: 0,
    });
    expect(v.matureOrderCount).toBe(100);
    expect(v.confidence).toBe("PREFERRED");
    expect(v.observedDeliveryRate).toBeCloseTo(0.82, 5);
    expect(v.observedRtoRate).toBeCloseTo(0.18, 5);
  });

  it("returns STRONG confidence at 150+ mature orders", () => {
    const v = validateDelivery({
      ordersPlaced: 160,
      ordersShipped: 160,
      ordersDelivered: 130,
      ordersRTO: 30,
      ordersInTransit: 0,
    });
    expect(v.confidence).toBe("STRONG");
  });

  it("never divides by zero with no mature orders", () => {
    const v = validateDelivery({
      ordersPlaced: 10,
      ordersShipped: 10,
      ordersDelivered: 0,
      ordersRTO: 0,
      ordersInTransit: 10,
    });
    expect(v.observedDeliveryRate).toBeNull();
    expect(v.observedRtoRate).toBeNull();
  });
});
