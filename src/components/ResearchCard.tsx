"use client";

import { useState } from "react";
import type { Confidence, ResearchEntry, ResearchTopic } from "@/lib/types";
import { getResearchPrompt, type ResearchPromptContext } from "@/lib/research/prompts";
import { Badge, Field, inputClass } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export function ResearchCard({
  topic,
  context,
  entry,
  onSave,
}: {
  topic: ResearchTopic;
  context: ResearchPromptContext;
  entry?: ResearchEntry;
  onSave: (entry: ResearchEntry) => void;
}) {
  const spec = getResearchPrompt(topic);
  const [showManual, setShowManual] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [finding, setFinding] = useState(entry?.finding ?? "");
  const [source, setSource] = useState(entry?.evidence[0]?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(entry?.evidence[0]?.sourceUrl ?? "");
  const [confidence, setConfidence] = useState<Confidence>(entry?.evidence[0]?.confidence ?? "MEDIUM");
  const [notes, setNotes] = useState(entry?.evidence[0]?.notes ?? "");

  function handleSave() {
    if (!finding.trim()) return;
    const newEntry: ResearchEntry = {
      topic,
      finding: finding.trim(),
      evidence: [
        {
          value: finding.trim(),
          source: source.trim() || "Manual research",
          sourceUrl: sourceUrl.trim() || undefined,
          confidence,
          researchedAt: new Date().toISOString(),
          notes: notes.trim() || undefined,
        },
      ],
    };
    onSave(newEntry);
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-(--foreground)">{spec.title}</h3>
        {entry ? (
          <Badge color="green">Research added</Badge>
        ) : (
          <Badge color="yellow">⚠ Research required</Badge>
        )}
      </div>

      {entry ? (
        <div className="mb-4 rounded-md border border-(--border) bg-(--surface-raised) p-3 text-sm">
          <div className="text-(--foreground)">{entry.finding}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--muted)">
            <span>Source: {entry.evidence[0]?.source}</span>
            {entry.evidence[0]?.sourceUrl ? (
              <a
                href={entry.evidence[0].sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-(--foreground)"
              >
                link
              </a>
            ) : null}
            <Badge color={entry.evidence[0]?.confidence === "HIGH" ? "green" : entry.evidence[0]?.confidence === "LOW" ? "red" : "yellow"}>
              {entry.evidence[0]?.confidence} confidence
            </Badge>
            <span>{new Date(entry.evidence[0]?.researchedAt ?? "").toLocaleDateString()}</span>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-(--muted)">
          We need current market evidence for this. Run one of the research prompts below in ChatGPT or
          Claude, or follow the manual steps — then paste what you find back into this app.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <CopyButton text={spec.chatGptPrompt(context)} label="Copy ChatGPT prompt" />
        <CopyButton text={spec.claudeCodePrompt(context)} label="Copy Claude prompt" />
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          className="inline-flex items-center justify-center rounded-md border border-(--border) bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--muted) transition-colors hover:bg-(--surface-raised) hover:text-(--foreground)"
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
          {entry ? "Update research" : "+ Add research"}
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-(--border) bg-(--surface-raised) p-4">
          <Field label="Finding">
            <textarea
              className={inputClass}
              rows={2}
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              placeholder="What did you find?"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Source">
              <input
                className={inputClass}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Meta Ad Library, Amazon.in"
              />
            </Field>
            <Field label="Source URL (optional)">
              <input
                className={inputClass}
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
          <Field label="Confidence">
            <select
              className={inputClass}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as Confidence)}
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea
              className={inputClass}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Facts vs inference, what's still unknown..."
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md bg-(--foreground) text-(--background) px-4 py-2 text-sm font-semibold hover:opacity-85"
            >
              Save research
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
