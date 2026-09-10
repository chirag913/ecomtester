"use client";

import { useState } from "react";
import { evaluateAdSet } from "@/lib/decisions/adset";
import type { AdSet, AdSetDailyMetrics, AdSetStatus } from "@/lib/types";
import { Badge, Field, inputClass } from "@/components/ui";

// Label/color are purely cosmetic per status. Whether the ad set is
// protected from edits comes from the decision engine's own `doNotChange`
// field (evaluateAdSet), not a second hardcoded copy here — GIVE_ANOTHER_DAY
// is doNotChange in some cases (e.g. day-1/1-purchase) and not in others
// (e.g. spend hasn't hit the threshold yet), so it can't be a static map.
const statusMeta: Record<AdSetStatus, { label: string; color: "green" | "yellow" | "red" | "neutral" }> = {
  KILL: { label: "Stop", color: "red" },
  GIVE_ANOTHER_DAY: { label: "Give another day", color: "yellow" },
  PROMISING: { label: "Promising — do not touch", color: "yellow" },
  KEEP_RUNNING: { label: "Keep running — do not touch", color: "green" },
  INSUFFICIENT_DATA: { label: "Insufficient data", color: "neutral" },
};

export function AdSetPanel({
  adSet,
  metrics,
  killThreshold,
  maxViableCAC,
  onAddMetric,
  onRemove,
}: {
  adSet: AdSet;
  metrics: AdSetDailyMetrics[];
  killThreshold: number;
  maxViableCAC: number;
  onAddMetric: (m: AdSetDailyMetrics) => void;
  onRemove: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spend, setSpend] = useState("");
  const [purchases, setPurchases] = useState("0");

  const ownMetrics = metrics.filter((m) => m.adSetId === adSet.id);
  const decision = evaluateAdSet(ownMetrics, killThreshold, maxViableCAC);
  const meta = statusMeta[decision.status];

  function handleAdd() {
    const spendNum = parseFloat(spend);
    const purchasesNum = parseInt(purchases, 10);
    if (!Number.isFinite(spendNum)) return;
    onAddMetric({
      adSetId: adSet.id,
      date,
      spend: spendNum,
      purchases: Number.isFinite(purchasesNum) ? purchasesNum : 0,
    });
    setSpend("");
    setPurchases("0");
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-semibold text-(--foreground)">{adSet.name}</div>
          <div className="text-xs text-(--muted)">
            {adSet.campaign} · {adSet.creative}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {decision.doNotChange ? <span title="Do not change">🔒</span> : null}
          <Badge color={meta.color}>{meta.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-sm">
        <div>
          <div className="text-xs text-(--muted-2) uppercase">Spend</div>
          <div className="font-mono-num">₹{decision.totalSpend.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-(--muted-2) uppercase">Purchases</div>
          <div className="font-mono-num">{decision.totalPurchases}</div>
        </div>
        <div>
          <div className="text-xs text-(--muted-2) uppercase">CPP</div>
          <div className="font-mono-num">{decision.cpp != null ? `₹${decision.cpp.toFixed(0)}` : "—"}</div>
        </div>
        <div>
          <div className="text-xs text-(--muted-2) uppercase">Days</div>
          <div className="font-mono-num">{decision.daysRunning}</div>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {decision.reasons.map((r) => (
          <p key={r} className="text-xs text-(--muted)">
            {r}
          </p>
        ))}
      </div>
      <p className="text-sm font-medium text-(--foreground) mb-4">→ {decision.nextAction}</p>

      {ownMetrics.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-(--muted-2) uppercase text-left">
                <th className="pb-1 pr-4">Date</th>
                <th className="pb-1 pr-4">Spend</th>
                <th className="pb-1">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {[...ownMetrics]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((m) => (
                  <tr key={m.date} className="border-t border-(--border)">
                    <td className="py-1 pr-4 text-(--muted)">{m.date}</td>
                    <td className="py-1 pr-4 font-mono-num">₹{m.spend}</td>
                    <td className="py-1 font-mono-num">{m.purchases}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!showForm ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-(--foreground) underline underline-offset-2 hover:opacity-80"
          >
            + Log a day
          </button>
          <button type="button" onClick={onRemove} className="text-sm text-(--muted-2) hover:text-(--red)">
            Remove ad set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 items-end rounded-md border border-(--border) bg-(--surface-raised) p-3">
          <Field label="Date">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Spend ₹">
            <input type="number" min="0" className={inputClass} value={spend} onChange={(e) => setSpend(e.target.value)} />
          </Field>
          <Field label="Purchases">
            <input type="number" min="0" className={inputClass} value={purchases} onChange={(e) => setPurchases(e.target.value)} />
          </Field>
          <div className="col-span-3 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md bg-(--foreground) text-(--background) px-4 py-2 text-sm font-semibold hover:opacity-85"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex items-center justify-center rounded-md border border-(--border) px-4 py-2 text-sm text-(--muted) hover:text-(--foreground)"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
