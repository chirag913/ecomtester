"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — no-op; user can select the text manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-md border border-(--border) bg-(--surface-raised) px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--foreground) transition-colors hover:bg-(--border)"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
