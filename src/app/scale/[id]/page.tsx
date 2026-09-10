"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { updateProduct, useProduct, type StoredProduct } from "@/lib/storage";
import { calculateProductEconomics } from "@/lib/economics";
import { validateDelivery } from "@/lib/scaling/delivery";
import { calculateRealizedEconomics } from "@/lib/scaling/realized";
import { evaluateScaleDecision } from "@/lib/scaling/scale-decision";
import { buildRtoEstimateFromActual, pickEffectiveRtoEstimate } from "@/lib/research/rto";
import { Badge, Card, Field, inputClass, PrimaryButton, SecondaryButton, SectionLabel, StatCard } from "@/components/ui";
import type { DeliveryMetrics, RealizedEconomicsInputs } from "@/lib/types";

const PLACEHOLDER_RTO_PCT = 20;

type DeliveryForm = { [K in keyof DeliveryMetrics]: string };
type RealizedForm = { [K in keyof RealizedEconomicsInputs]: string };

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function deliveryFormFrom(m?: DeliveryMetrics): DeliveryForm {
  return {
    ordersPlaced: String(m?.ordersPlaced ?? 0),
    ordersShipped: String(m?.ordersShipped ?? 0),
    ordersDelivered: String(m?.ordersDelivered ?? 0),
    ordersRTO: String(m?.ordersRTO ?? 0),
    ordersInTransit: String(m?.ordersInTransit ?? 0),
  };
}

function realizedFormFrom(r?: RealizedEconomicsInputs): RealizedForm {
  return {
    revenue: String(r?.revenue ?? 0),
    adSpend: String(r?.adSpend ?? 0),
    productCostTotal: String(r?.productCostTotal ?? 0),
    shippingTotal: String(r?.shippingTotal ?? 0),
    rtoCostTotal: String(r?.rtoCostTotal ?? 0),
    paymentFeesTotal: String(r?.paymentFeesTotal ?? 0),
    refundCostTotal: String(r?.refundCostTotal ?? 0),
    deliveredOrders: String(r?.deliveredOrders ?? 0),
  };
}

function DeliveryInputCard({
  initial,
  onSave,
}: {
  initial?: DeliveryMetrics;
  onSave: (metrics: DeliveryMetrics) => void;
}) {
  // Seeded once from the product's saved data at mount — this component is
  // only rendered once the parent has resolved `product`, so no effect is
  // needed to sync in async data.
  const [form, setForm] = useState<DeliveryForm>(() => deliveryFormFrom(initial));

  return (
    <Card className="mb-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {(
          [
            ["ordersPlaced", "Placed"],
            ["ordersShipped", "Shipped"],
            ["ordersDelivered", "Delivered"],
            ["ordersRTO", "RTO"],
            ["ordersInTransit", "In transit"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <PrimaryButton
        onClick={() =>
          onSave({
            ordersPlaced: num(form.ordersPlaced),
            ordersShipped: num(form.ordersShipped),
            ordersDelivered: num(form.ordersDelivered),
            ordersRTO: num(form.ordersRTO),
            ordersInTransit: num(form.ordersInTransit),
          })
        }
      >
        Save delivery data
      </PrimaryButton>
    </Card>
  );
}

function RealizedInputCard({
  initial,
  onSave,
}: {
  initial?: RealizedEconomicsInputs;
  onSave: (inputs: RealizedEconomicsInputs) => void;
}) {
  const [form, setForm] = useState<RealizedForm>(() => realizedFormFrom(initial));

  return (
    <Card className="mb-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {(
          [
            ["revenue", "Revenue ₹"],
            ["adSpend", "Ad spend ₹"],
            ["productCostTotal", "Product cost ₹"],
            ["shippingTotal", "Shipping ₹"],
            ["rtoCostTotal", "RTO cost ₹"],
            ["paymentFeesTotal", "Payment fees ₹"],
            ["refundCostTotal", "Refund cost ₹"],
            ["deliveredOrders", "Delivered orders"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <PrimaryButton
        onClick={() =>
          onSave({
            revenue: num(form.revenue),
            adSpend: num(form.adSpend),
            productCostTotal: num(form.productCostTotal),
            shippingTotal: num(form.shippingTotal),
            rtoCostTotal: num(form.rtoCostTotal),
            paymentFeesTotal: num(form.paymentFeesTotal),
            refundCostTotal: num(form.refundCostTotal),
            deliveredOrders: num(form.deliveredOrders),
          })
        }
      >
        Save realized data
      </PrimaryButton>
    </Card>
  );
}

export default function ScalePage() {
  const params = useParams<{ id: string }>();
  const product = useProduct(params.id);

  const aggregateCpp = useMemo(() => {
    if (!product) return null;
    const totalSpend = product.adSetMetrics.reduce((s, m) => s + m.spend, 0);
    const totalPurchases = product.adSetMetrics.reduce((s, m) => s + m.purchases, 0);
    return totalPurchases > 0 ? totalSpend / totalPurchases : null;
  }, [product]);

  const economics = useMemo(() => {
    if (!product) return null;
    const effectiveRto = pickEffectiveRtoEstimate(product.rtoResearchEstimate, product.actualRtoEstimate);
    return calculateProductEconomics(product.inputs, effectiveRto?.base ?? PLACEHOLDER_RTO_PCT);
  }, [product]);

  if (!product) {
    return (
      <main className="flex-1 mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-(--muted)">Product not found.</p>
        <SecondaryButton href="/check/new" className="mt-4">
          Start a new product check
        </SecondaryButton>
      </main>
    );
  }
  if (!economics) return null;

  const deliveryMetrics: DeliveryMetrics = product.deliveryMetrics ?? {
    ordersPlaced: 0,
    ordersShipped: 0,
    ordersDelivered: 0,
    ordersRTO: 0,
    ordersInTransit: 0,
  };
  const deliveryValidation = validateDelivery(deliveryMetrics);

  const realizedInputs: RealizedEconomicsInputs = product.realizedInputs ?? {
    revenue: 0,
    adSpend: 0,
    productCostTotal: 0,
    shippingTotal: 0,
    rtoCostTotal: 0,
    paymentFeesTotal: 0,
    refundCostTotal: 0,
    deliveredOrders: 0,
  };
  const realized = calculateRealizedEconomics(realizedInputs);

  const elevatedRefunds =
    realizedInputs.refundCostTotal > 0 &&
    realizedInputs.revenue > 0 &&
    (realizedInputs.refundCostTotal / realizedInputs.revenue) * 100 > 5;

  const cpp = aggregateCpp ?? 0;
  const hasAdData = aggregateCpp != null;

  const scaleDecision = hasAdData
    ? evaluateScaleDecision({
        cpp,
        maxViableCAC: economics.maxViableCAC,
        deliveryValidation,
        realized,
        elevatedRefunds,
      })
    : null;

  function saveDelivery(metrics: DeliveryMetrics) {
    if (!product) return;
    const patch: Partial<StoredProduct> = { deliveryMetrics: metrics };
    if (metrics.ordersDelivered + metrics.ordersRTO > 0) {
      patch.actualRtoEstimate = buildRtoEstimateFromActual(metrics.ordersDelivered, metrics.ordersRTO);
    }
    updateProduct(product.id, patch);
  }

  function saveRealized(inputs: RealizedEconomicsInputs) {
    if (!product) return;
    updateProduct(product.id, { realizedInputs: inputs });
  }

  const stateBadge = { CONTINUE: "yellow", SCALE: "green", STRONG_SCALE: "blue" } as const;
  const stateLabel = { CONTINUE: "🟡 Continue", SCALE: "🟢 Scale", STRONG_SCALE: "🔵 Strong scale" } as const;

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Scale decision</div>
        <h1 className="text-2xl font-semibold">{product.inputs.productName}</h1>
      </div>

      <section className="mb-10">
        <SectionLabel>Delivery / RTO validation</SectionLabel>
        <DeliveryInputCard initial={product.deliveryMetrics} onSave={saveDelivery} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Mature orders" value={deliveryValidation.matureOrderCount} />
          <StatCard
            label="Delivery rate"
            value={deliveryValidation.observedDeliveryRate != null ? `${(deliveryValidation.observedDeliveryRate * 100).toFixed(1)}%` : "N/A"}
          />
          <StatCard
            label="RTO rate"
            value={deliveryValidation.observedRtoRate != null ? `${(deliveryValidation.observedRtoRate * 100).toFixed(1)}%` : "N/A"}
          />
          <StatCard
            label="Confidence"
            value={deliveryValidation.confidence}
            color={deliveryValidation.confidence === "NONE" ? "red" : deliveryValidation.confidence === "INITIAL" ? "yellow" : "green"}
          />
        </div>
        <div className="mt-3 space-y-1">
          {deliveryValidation.notes.map((n) => (
            <p key={n} className="text-xs text-(--muted)">
              {n}
            </p>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>Realized economics</SectionLabel>
        <p className="text-xs text-(--muted-2) mb-3">
          How much money does this business actually make after delivery/RTO — not just cheap Meta
          purchases.
        </p>
        <RealizedInputCard initial={product.realizedInputs} onSave={saveRealized} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Net contribution"
            value={`₹${realized.netContribution.toFixed(0)}`}
            color={realized.netContribution > 0 ? "green" : "red"}
          />
          <StatCard
            label="Contribution / order"
            value={realized.contributionPerOrder != null ? `₹${realized.contributionPerOrder.toFixed(0)}` : "N/A"}
          />
          <StatCard
            label="Contribution margin"
            value={realized.contributionMarginPct != null ? `${realized.contributionMarginPct.toFixed(1)}%` : "N/A"}
          />
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>Product status</SectionLabel>
        {!hasAdData ? (
          <Card>
            <p className="text-sm text-(--muted)">
              No ad set spend/purchase data yet. Log ad set metrics on the{" "}
              <a href={`/plan/${product.id}`} className="underline">
                test plan page
              </a>{" "}
              first.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Badge color={stateBadge[scaleDecision!.state]} className="text-sm px-4 py-1.5">
                {stateLabel[scaleDecision!.state]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatCard label="CPP" value={`₹${cpp.toFixed(0)}`} />
              <StatCard label="Max viable CAC" value={`₹${economics.maxViableCAC.toFixed(0)}`} />
              <StatCard label="Mature orders" value={deliveryValidation.matureOrderCount} />
            </div>
            <Card className="mb-4">
              <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Why</div>
              <div className="space-y-1">
                {scaleDecision!.reasons.map((r) => (
                  <p key={r} className="text-sm text-(--foreground)">
                    {r}
                  </p>
                ))}
              </div>
            </Card>
            <Card className="mb-4 border-(--foreground)/20">
              <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Next action</div>
              <p className="text-base font-medium text-(--foreground)">{scaleDecision!.nextAction}</p>
            </Card>
            {scaleDecision!.doNotDo.length > 0 ? (
              <Card className="mb-4 border-(--red)/20">
                <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Do not do this</div>
                {scaleDecision!.doNotDo.map((d) => (
                  <p key={d} className="text-sm text-(--red)">
                    {d}
                  </p>
                ))}
              </Card>
            ) : null}
            {scaleDecision!.watch.length > 0 ? (
              <Card className="border-(--yellow)/20">
                <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Watch</div>
                {scaleDecision!.watch.map((w) => (
                  <p key={w} className="text-sm text-(--yellow)">
                    {w}
                  </p>
                ))}
              </Card>
            ) : null}
          </>
        )}
      </section>

      <div className="flex items-center justify-between">
        <SecondaryButton href={`/plan/${product.id}`}>← Back to test plan</SecondaryButton>
        <SecondaryButton href="/">Home</SecondaryButton>
      </div>
    </main>
  );
}
