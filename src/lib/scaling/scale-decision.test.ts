import { describe, expect, it } from "vitest";
import { evaluateScaleDecision } from "./scale-decision";
import { validateDelivery } from "./delivery";
import { calculateRealizedEconomics } from "./realized";

describe("scale decision", () => {
  it("scenario 6: 100 mature orders, healthy delivery, profitable CAC -> SCALE or STRONG_SCALE", () => {
    const deliveryValidation = validateDelivery({
      ordersPlaced: 100,
      ordersShipped: 100,
      ordersDelivered: 84,
      ordersRTO: 16,
      ordersInTransit: 0,
    });
    const realized = calculateRealizedEconomics({
      revenue: 84 * 900,
      adSpend: 100 * 240,
      productCostTotal: 100 * 300,
      shippingTotal: 100 * 70,
      rtoCostTotal: 16 * 70,
      paymentFeesTotal: 84 * 18,
      refundCostTotal: 0,
      deliveredOrders: 84,
    });
    const result = evaluateScaleDecision({
      cpp: 240,
      maxViableCAC: 410,
      deliveryValidation,
      realized,
    });
    expect(["SCALE", "STRONG_SCALE"]).toContain(result.state);
    expect(result.doNotDo.length).toBeGreaterThanOrEqual(0);
  });

  it("scenario 7: cheap CPP, high RTO, negative realized contribution -> CONTINUE (never scale)", () => {
    const deliveryValidation = validateDelivery({
      ordersPlaced: 120,
      ordersShipped: 120,
      ordersDelivered: 50,
      ordersRTO: 70,
      ordersInTransit: 0,
    });
    const realized = calculateRealizedEconomics({
      revenue: 50 * 900,
      adSpend: 120 * 150,
      productCostTotal: 120 * 300,
      shippingTotal: 120 * 70,
      rtoCostTotal: 70 * 70,
      paymentFeesTotal: 50 * 18,
      refundCostTotal: 0,
      deliveredOrders: 50,
    });
    const result = evaluateScaleDecision({
      cpp: 150,
      maxViableCAC: 410,
      deliveryValidation,
      realized,
    });
    expect(result.state).toBe("CONTINUE");
    expect(result.doNotDo.some((d) => d.toLowerCase().includes("do not scale"))).toBe(true);
  });

  it("scenario 8: good CPP, insufficient delivery data -> CONTINUE with 'not confirmed' explanation", () => {
    const deliveryValidation = validateDelivery({
      ordersPlaced: 15,
      ordersShipped: 15,
      ordersDelivered: 10,
      ordersRTO: 2,
      ordersInTransit: 3,
    });
    const realized = calculateRealizedEconomics({
      revenue: 10 * 900,
      adSpend: 15 * 200,
      productCostTotal: 15 * 300,
      shippingTotal: 15 * 70,
      rtoCostTotal: 2 * 70,
      paymentFeesTotal: 10 * 18,
      refundCostTotal: 0,
      deliveredOrders: 10,
    });
    const result = evaluateScaleDecision({
      cpp: 200,
      maxViableCAC: 410,
      deliveryValidation,
      realized,
    });
    expect(result.state).toBe("CONTINUE");
    expect(result.reasons.join(" ")).toMatch(/have not been confirmed/i);
  });

  it("never recommends SCALE when CPP exceeds maximum viable CAC even with great delivery", () => {
    const deliveryValidation = validateDelivery({
      ordersPlaced: 200,
      ordersShipped: 200,
      ordersDelivered: 170,
      ordersRTO: 30,
      ordersInTransit: 0,
    });
    const realized = calculateRealizedEconomics({
      revenue: 170 * 900,
      adSpend: 200 * 500,
      productCostTotal: 200 * 300,
      shippingTotal: 200 * 70,
      rtoCostTotal: 30 * 70,
      paymentFeesTotal: 170 * 18,
      refundCostTotal: 0,
      deliveredOrders: 170,
    });
    const result = evaluateScaleDecision({
      cpp: 500,
      maxViableCAC: 410,
      deliveryValidation,
      realized,
    });
    expect(result.state).toBe("CONTINUE");
  });
});
