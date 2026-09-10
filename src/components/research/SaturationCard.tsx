"use client";

import { useState } from "react";
import type { Confidence, SaturationAssessment, SaturationVerdict } from "@/lib/types";
import { getResearchPrompt, type ResearchPromptContext } from "@/lib/research/prompts";
import { Badge, Field, inputClass } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

const verdictBadge: Record<SaturationVerdict, "green" | "yellow" | "red"> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
};

export function SaturationCard({
  context,
  value,
  onSave,
}: {
  context: ResearchPromptContext;
  value?: SaturationAssessment;
  onSave: (assessment: SaturationAssessment) => void;
}) {
  const spec = getResearchPrompt("meta_saturation");
  const [showManual, setShowManual] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [verdict, setVerdict] = useState<SaturationVerdict>(value?.verdict ?? "YELLOW");
  const [reason, setReason] = useState(value?.reason ?? "");
  const [confidence, setConfidence] = useState<Confidence>(value?.confidence ?? "MEDIUM");
  const [exactAdCountKnown, setExactAdCountKnown] = useState(value?.exactAdCountKnown ?? false);

  function handleSave() {
    if (!reason.trim()) return;
    onSave({ verdict, reason: reason.trim(), confidence, exactAdCountKnown });
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-(--foreground)">Current Meta activity &amp; saturation</h3>
        {value ? <Badge color={verdictBadge[value.verdict]}>{value.verdict}</Badge> : <Badge color="yellow">⚠ Research required</Badge>}
      </div>

      {value ? (
        <div className="mb-4 rounded-md border border-(--border) bg-(--surface-raised) p-3 text-sm">
          <div className="text-(--foreground)">{value.reason}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--muted)">
            <Badge color={value.confidence === "HIGH" ? "green" : value.confidence === "LOW" ? "red" : "yellow"}>
              {value.confidence} confidence
            </Badge>
            {!value.exactAdCountKnown ? <span>Exact ad count could not be reliably determined.</span> : null}
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-(--muted)">
          Is this a saturated, already-seen dropshipping winner, or does it have real room to test? Never
          fabricate ad counts — record what you can actually verify.
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
          {value ? "Update research" : "+ Add research"}
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-(--border) bg-(--surface-raised) p-4">
          <Field label="Saturation verdict">
            <select className={inputClass} value={verdict} onChange={(e) => setVerdict(e.target.value as SaturationVerdict)}>
              <option value="GREEN">Green — worth testing</option>
              <option value="YELLOW">Yellow — test with differentiation</option>
              <option value="RED">Red — likely saturated / avoid</option>
            </select>
          </Field>
          <Field label="Reason">
            <textarea
              className={inputClass}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What did you observe? Historical popularity, current advertisers, recurring creatives, differentiation gaps..."
            />
          </Field>
          <Field label="Confidence">
            <select className={inputClass} value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-(--muted)">
            <input
              type="checkbox"
              checked={exactAdCountKnown}
              onChange={(e) => setExactAdCountKnown(e.target.checked)}
            />
            I could reliably determine an exact/approximate active-advertiser count
          </label>
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
