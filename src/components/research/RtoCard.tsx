"use client";

import { useState } from "react";
import type { Confidence, RtoEstimate } from "@/lib/types";
import { getResearchPrompt, type ResearchPromptContext } from "@/lib/research/prompts";
import { Badge, Field, inputClass } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export function RtoCard({
  context,
  value,
  onSave,
}: {
  context: ResearchPromptContext;
  value?: RtoEstimate;
  onSave: (estimate: RtoEstimate) => void;
}) {
  const spec = getResearchPrompt("rto_benchmark");
  const [showManual, setShowManual] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [low, setLow] = useState(value?.low?.toString() ?? "");
  const [base, setBase] = useState(value?.base?.toString() ?? "");
  const [high, setHigh] = useState(value?.high?.toString() ?? "");
  const [confidence, setConfidence] = useState<Confidence>(value?.confidence ?? "MEDIUM");
  const [reason, setReason] = useState(value?.reason ?? "");

  function handleSave() {
    const lowNum = parseFloat(low);
    const baseNum = parseFloat(base);
    const highNum = parseFloat(high);
    if (!Number.isFinite(baseNum)) return;
    onSave({
      source: "RESEARCH_ESTIMATE",
      low: Number.isFinite(lowNum) ? lowNum : baseNum,
      base: baseNum,
      high: Number.isFinite(highNum) ? highNum : baseNum,
      confidence,
      reason: reason.trim() || "Category + payment method research.",
    });
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-(--foreground)">Estimated RTO</h3>
        {value ? (
          <Badge color={value.confidence === "HIGH" ? "green" : value.confidence === "LOW" ? "red" : "yellow"}>
            {value.low}–{value.high}% · {value.confidence}
          </Badge>
        ) : (
          <Badge color="yellow">⚠ Research required</Badge>
        )}
      </div>

      <p className="mb-4 text-sm text-(--muted)">
        A high RTO can still be profitable if the CAC and product economics are strong. There is no
        universal &quot;RTO &gt; 20% = bad&quot; rule — the app evaluates RTO together with your economics.
      </p>

      {value ? (
        <div className="mb-4 rounded-md border border-(--border) bg-(--surface-raised) p-3 text-sm">
          <div className="text-(--foreground)">
            Base estimate: <span className="font-mono-num">{value.base}%</span> (range {value.low}–{value.high}%)
          </div>
          <div className="mt-1 text-(--muted)">{value.reason}</div>
        </div>
      ) : null}

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
          {value ? "Update RTO estimate" : "+ Add RTO estimate"}
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-(--border) bg-(--surface-raised) p-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Low %">
              <input type="number" min="0" max="100" className={inputClass} value={low} onChange={(e) => setLow(e.target.value)} />
            </Field>
            <Field label="Base %">
              <input type="number" min="0" max="100" className={inputClass} value={base} onChange={(e) => setBase(e.target.value)} />
            </Field>
            <Field label="High %">
              <input type="number" min="0" max="100" className={inputClass} value={high} onChange={(e) => setHigh(e.target.value)} />
            </Field>
          </div>
          <Field label="Confidence">
            <select className={inputClass} value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <Field label="Reason">
            <textarea
              className={inputClass}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Category + payment method + available research"
            />
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
