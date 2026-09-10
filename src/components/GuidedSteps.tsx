"use client";

import Link from "next/link";
import { useProducts } from "@/lib/storage";
import { calculateProductEconomics } from "@/lib/economics";
import { buildTestPlan } from "@/lib/test-planner";
import { evaluateProductVerdict } from "@/lib/decisions/verdict";
import { pickEffectiveRtoEstimate } from "@/lib/research/rto";
import { Badge, verdictColor, type StatusColor } from "@/components/ui";
import { INTERNAL_DEFAULT } from "@/lib/defaults";

const PLACEHOLDER_RTO_PCT = INTERNAL_DEFAULT.placeholderRtoPct;

interface Step {
  n: number;
  mode: string;
  question: string;
  body: string;
  href?: string;
  cta: string;
  status: "done" | "ready" | "locked";
  badge: { label: string; color: StatusColor } | null;
  lockedReason?: string;
}

/**
 * The landing page's primary navigation: three connected steps matching the
 * three core modes. Every card that looks clickable IS clickable; steps that
 * aren't reachable yet are visibly locked instead of silently doing nothing.
 */
export function GuidedSteps() {
  const products = useProducts();
  const active = products[0]; // most recently updated

  const hasProduct = Boolean(active);
  const hasAdData = hasProduct && active.adSetMetrics.length > 0;

  let verdictBadge: { label: string; color: StatusColor } | null = null;
  if (active) {
    const effectiveRto = pickEffectiveRtoEstimate(active.rtoResearchEstimate, active.actualRtoEstimate);
    const economics = calculateProductEconomics(active.inputs, effectiveRto?.base ?? PLACEHOLDER_RTO_PCT);
    const testPlan = buildTestPlan(active.inputs.dailyAdBudget, economics.maxViableCAC, active.inputs.sellingPrice);
    const verdict = evaluateProductVerdict({
      economics,
      testPlan,
      rtoEstimate: effectiveRto,
      saturation: active.saturation,
      pricing: active.pricing,
      supplierAvailable: active.supplierAvailable,
    });
    verdictBadge = { label: verdict.verdict, color: verdictColor(verdict.verdict) };
  }

  const steps: Step[] = [
    {
      n: 1,
      mode: "Product check",
      question: "Should I test this product?",
      body: "Enter the economics, add what research you have, get a verdict — worth testing, test with conditions, or don't test.",
      href: hasProduct ? `/check/${active.id}/verdict` : "/check/new",
      cta: hasProduct ? "View verdict" : "Start here",
      status: hasProduct ? "done" : "ready",
      badge: verdictBadge,
    },
    {
      n: 2,
      mode: "Test planner",
      question: "How exactly should I test it?",
      body: "Get the ad-set structure and budget sized to what you actually have, then log daily spend to see kill / continue calls live.",
      href: hasProduct ? `/plan/${active.id}` : undefined,
      cta: "Open test plan",
      status: hasProduct ? "ready" : "locked",
      badge: null,
      lockedReason: "Check a product first",
    },
    {
      n: 3,
      mode: "Scale decision",
      question: "Results are in — kill, continue, or scale?",
      body: "Validate delivery data, see the real profit after RTO, and get a clear next action — not just a cheap CPP.",
      href: hasProduct ? `/scale/${active.id}` : undefined,
      cta: "Analyze results",
      status: hasAdData ? "ready" : hasProduct ? "ready" : "locked",
      badge: null,
      lockedReason: "Check a product first",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {steps.map((step, i) => {
        const isLocked = step.status === "locked";
        const content = (
          <>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step.status === "done"
                    ? "bg-(--green) text-black"
                    : isLocked
                      ? "border border-(--border) text-(--muted-2)"
                      : "bg-(--foreground) text-(--background)"
                }`}
              >
                {step.status === "done" ? "✓" : step.n}
              </div>
              {isLocked ? <span className="text-xs text-(--muted-2)">🔒 Locked</span> : null}
              {step.badge ? <Badge color={step.badge.color}>{step.badge.label}</Badge> : null}
            </div>
            <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-1">{step.mode}</div>
            <h3 className="text-base font-semibold text-(--foreground) mb-2">{step.question}</h3>
            <p className="text-sm text-(--muted) mb-4">{step.body}</p>
            {isLocked ? (
              <span className="text-sm text-(--muted-2)">{step.lockedReason}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-(--foreground)">
                {step.cta} →
              </span>
            )}
          </>
        );

        return (
          <div key={step.n} className="relative">
            {isLocked || !step.href ? (
              <div className="h-full rounded-lg border border-(--border) bg-(--surface) p-5 opacity-60 cursor-not-allowed">
                {content}
              </div>
            ) : (
              <Link
                href={step.href}
                className="block h-full rounded-lg border border-(--border) bg-(--surface) p-5 transition-colors hover:border-(--foreground)/40 hover:bg-(--surface-raised)"
              >
                {content}
              </Link>
            )}
            {i < steps.length - 1 ? (
              <div className="hidden sm:block absolute top-1/2 -right-2.5 h-px w-5 bg-(--border)" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
