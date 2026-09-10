"use client";

import { useState } from "react";
import type { Confidence, PricingResearch } from "@/lib/types";
import { getResearchPrompt, type ResearchPromptContext } from "@/lib/research/prompts";
import { Badge, Field, inputClass } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export function PricingCard({
  context,
  value,
  onSave,
}: {
  context: ResearchPromptContext;
  value?: PricingResearch;
  onSave: (pricing: PricingResearch) => void;
}) {
  const spec = getResearchPrompt("pricing");
  const [showManual, setShowManual] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [low, setLow] = useState(value?.lowMarketPrice?.toString() ?? "");
  const [common, setCommon] = useState(value?.commonPrice?.toString() ?? "");
  const [premium, setPremium] = useState(value?.premiumPrice?.toString() ?? "");
  const [rangeLow, setRangeLow] = useState(value?.recommendedTestRangeLow?.toString() ?? "");
  const [rangeHigh, setRangeHigh] = useState(value?.recommendedTestRangeHigh?.toString() ?? "");
  const [confidence, setConfidence] = useState<Confidence>(value?.confidence ?? "MEDIUM");
  const [source, setSource] = useState(value?.source ?? "");
  const [notes, setNotes] = useState(value?.notes ?? "");

  function n(v: string): number | undefined {
    const num = parseFloat(v);
    return Number.isFinite(num) ? num : undefined;
  }

  function handleSave() {
    onSave({
      lowMarketPrice: n(low),
      commonPrice: n(common),
      premiumPrice: n(premium),
      recommendedTestRangeLow: n(rangeLow),
      recommendedTestRangeHigh: n(rangeHigh),
      confidence,
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
      researchedAt: new Date().toISOString(),
    });
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-(--foreground)">Indian market pricing</h3>
        {value ? <Badge color="green">Research added</Badge> : <Badge color="yellow">⚠ Research required</Badge>}
      </div>

      {value ? (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-(--muted-2) uppercase tracking-wide">Low</div>
              <div className="font-mono-num">{value.lowMarketPrice != null ? `₹${value.lowMarketPrice}` : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-2) uppercase tracking-wide">Common</div>
              <div className="font-mono-num">{value.commonPrice != null ? `₹${value.commonPrice}` : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-2) uppercase tracking-wide">Premium</div>
              <div className="font-mono-num">{value.premiumPrice != null ? `₹${value.premiumPrice}` : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-2) uppercase tracking-wide">Test range</div>
              <div className="font-mono-num">
                {value.recommendedTestRangeLow != null && value.recommendedTestRangeHigh != null
                  ? `₹${value.recommendedTestRangeLow}–${value.recommendedTestRangeHigh}`
                  : "—"}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-(--muted-2)">
            <span>Source: {value.source || "not recorded"}</span>
            <span>·</span>
            <span>Researched {new Date(value.researchedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-(--muted)">
          Current Indian selling prices, not just what maximizes margin — market price, perceived value,
          and positioning all matter.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <CopyButton text={spec.chatGptPrompt(context)} label="Copy ChatGPT prompt" />
        <CopyButton text={spec.claudeCodePrompt(context)} label="Copy Claude prompt" />
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          className="inline-flex items-center justify-center rounded-md border border-(--border) bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--muted) hover:bg-(--surface-raised) hover:text-(--foreground)"
        >
          {showManual ? "Hide manual research" : "Manual research"}
        </button>
      </div>

      {showManual ? (
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-(--muted)">
          {spec.manualSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-(--foreground) underline underline-offset-2 hover:opacity-80"
        >
          {value ? "Update pricing research" : "+ Add pricing research"}
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-(--border) bg-(--surface-raised) p-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Low market ₹">
              <input type="number" min="0" className={inputClass} value={low} onChange={(e) => setLow(e.target.value)} />
            </Field>
            <Field label="Common ₹">
              <input type="number" min="0" className={inputClass} value={common} onChange={(e) => setCommon(e.target.value)} />
            </Field>
            <Field label="Premium ₹">
              <input type="number" min="0" className={inputClass} value={premium} onChange={(e) => setPremium(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recommended test range — low ₹">
              <input type="number" min="0" className={inputClass} value={rangeLow} onChange={(e) => setRangeLow(e.target.value)} />
            </Field>
            <Field label="Recommended test range — high ₹">
              <input type="number" min="0" className={inputClass} value={rangeHigh} onChange={(e) => setRangeHigh(e.target.value)} />
            </Field>
          </div>
          <Field label="Source">
            <input
              className={inputClass}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Amazon.in, Flipkart, Meesho"
            />
          </Field>
          <Field label="Confidence">
            <select className={inputClass} value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
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
