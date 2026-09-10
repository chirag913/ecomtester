"use client";

import { useState } from "react";
import { getResearchPrompt, type ResearchPromptContext } from "@/lib/research/prompts";
import { Badge } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export function SupplierCard({
  context,
  value,
  onSave,
}: {
  context: ResearchPromptContext;
  value: boolean | null | undefined;
  onSave: (available: boolean | null) => void;
}) {
  const spec = getResearchPrompt("supplier_availability");
  const [showManual, setShowManual] = useState(false);

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-(--foreground)">Supplier availability</h3>
        {value === true ? (
          <Badge color="green">Available</Badge>
        ) : value === false ? (
          <Badge color="red">Not confirmed</Badge>
        ) : (
          <Badge color="yellow">⚠ Unknown</Badge>
        )}
      </div>

      <p className="mb-4 text-sm text-(--muted)">
        Confirm you can actually source this product before testing it.
      </p>

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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(true)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            value === true ? "border-(--green)/40 bg-(--green-dim) text-(--green)" : "border-(--border) text-(--muted) hover:text-(--foreground)"
          }`}
        >
          Confirmed available
        </button>
        <button
          type="button"
          onClick={() => onSave(false)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            value === false ? "border-(--red)/40 bg-(--red-dim) text-(--red)" : "border-(--border) text-(--muted) hover:text-(--foreground)"
          }`}
        >
          Not confirmed
        </button>
      </div>
    </div>
  );
}
