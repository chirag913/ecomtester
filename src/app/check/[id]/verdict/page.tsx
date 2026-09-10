"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useProduct } from "@/lib/storage";
import { calculateProductEconomics } from "@/lib/economics";
import { buildTestPlan } from "@/lib/test-planner";
import { evaluateProductVerdict } from "@/lib/decisions/verdict";
import { pickEffectiveRtoEstimate } from "@/lib/research/rto";
import { Badge, Card, PrimaryButton, ProgressSteps, SecondaryButton, SectionLabel, StatCard, verdictColor } from "@/components/ui";

const PLACEHOLDER_RTO_PCT = 20;

export default function VerdictPage() {
  const params = useParams<{ id: string }>();
  const product = useProduct(params.id);

  const computed = useMemo(() => {
    if (!product) return null;
    const effectiveRto = pickEffectiveRtoEstimate(product.rtoResearchEstimate, product.actualRtoEstimate);
    const rtoPct = effectiveRto?.base ?? PLACEHOLDER_RTO_PCT;
    const economics = calculateProductEconomics(product.inputs, rtoPct);
    const testPlan = buildTestPlan(product.inputs.dailyAdBudget, economics.maxViableCAC, product.inputs.sellingPrice);
    const verdict = evaluateProductVerdict({
      economics,
      testPlan,
      rtoEstimate: effectiveRto,
      saturation: product.saturation,
      pricing: product.pricing,
      supplierAvailable: product.supplierAvailable,
    });
    return { economics, testPlan, verdict, effectiveRto, usedPlaceholderRto: !effectiveRto };
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
  if (!computed) return null;

  const { economics, verdict, effectiveRto, usedPlaceholderRto } = computed;
  const money = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
      <ProgressSteps steps={["Economics", "Research", "Verdict"]} currentIndex={2} />

      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Product verdict</div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Badge color={verdictColor(verdict.verdict)} className="text-sm px-4 py-1.5">
            {verdict.verdict === "GREEN" ? "🟢 Worth testing" : verdict.verdict === "YELLOW" ? "🟡 Test with conditions" : "🔴 Don't test"}
          </Badge>
          <Badge color="neutral">Confidence: {verdict.confidence}</Badge>
          <Badge color="neutral">Score: {verdict.score}/100</Badge>
        </div>
        <h1 className="text-2xl font-semibold">{product.inputs.productName}</h1>
        <p className="text-sm text-(--muted)">{product.inputs.productCategory}</p>
        <p className="text-xs text-(--muted-2) mt-2 max-w-lg">
          Score is a summary only. The underlying economics and evidence below determine the decision.
        </p>
      </div>

      {!economics.passes3xRule ? (
        <Card className="mb-6 border-(--yellow)/30">
          <div className="flex items-center gap-2 mb-1">
            <Badge color="yellow">Red flag</Badge>
            <span className="text-sm font-semibold">Fails the 3× product-cost rule</span>
          </div>
          <p className="text-sm text-(--muted)">
            Minimum recommended price at 3× cost would be {money(economics.minimumRecommendedPrice)}, but the
            selling price is {money(product.inputs.sellingPrice)}. This is an initial screening rule — it
            does not by itself prove the product is profitable or impossible. See the full economics below.
          </p>
        </Card>
      ) : null}

      <section className="mb-8">
        <SectionLabel>Why</SectionLabel>
        <Card className="space-y-2">
          {verdict.reasons.positive.map((r) => (
            <div key={r} className="text-sm text-(--green) flex gap-2">
              <span>✓</span>
              <span className="text-(--foreground)">{r}</span>
            </div>
          ))}
          {verdict.reasons.negative.map((r) => (
            <div key={r} className="text-sm text-(--red) flex gap-2">
              <span>✗</span>
              <span className="text-(--foreground)">{r}</span>
            </div>
          ))}
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Economics</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Max viable CAC"
            value={money(economics.maxViableCAC)}
            color={economics.maxViableCAC > 0 ? "green" : "red"}
            sub={`Break-even CAC: ${money(economics.breakEvenCAC)}`}
          />
          <StatCard
            label="Gross contribution"
            value={money(economics.grossContributionBeforeAds)}
            sub="Before ads, assuming full delivery"
          />
          <StatCard
            label="Contribution / shipped order"
            value={money(economics.expectedContributionPerShippedOrder)}
            sub={`At ${economics.rtoPctUsed}% RTO used`}
          />
          <StatCard
            label="Contribution / delivered order"
            value={economics.expectedContributionPerDeliveredOrder != null ? money(economics.expectedContributionPerDeliveredOrder) : "N/A"}
            sub={economics.expectedContributionPerDeliveredOrder == null ? "100% RTO — no deliveries" : undefined}
          />
          <StatCard
            label="Contribution margin"
            value={economics.contributionMarginPct != null ? `${economics.contributionMarginPct.toFixed(1)}%` : "N/A"}
          />
          <StatCard
            label="3× rule"
            value={economics.passes3xRule ? "PASS" : "FAIL"}
            color={economics.passes3xRule ? "green" : "yellow"}
            sub={`Min. price: ${money(economics.minimumRecommendedPrice)}`}
          />
        </div>
        <p className="mt-3 text-xs text-(--muted-2)">
          Assumptions: reverse shipping {money(economics.assumptions.reverseShippingCost)}, COD mix{" "}
          {economics.assumptions.codMixPct}%, RTO product loss {economics.assumptions.rtoProductLossPct}%,
          margin buffer {economics.assumptions.targetMarginBufferPct}% below break-even.
        </p>
      </section>

      <section className="mb-8">
        <SectionLabel>RTO</SectionLabel>
        <Card>
          {usedPlaceholderRto ? (
            <p className="text-sm text-(--muted)">
              No RTO research or actual data yet. Economics above use a placeholder estimate of{" "}
              {PLACEHOLDER_RTO_PCT}% — add RTO research on the previous step for a real estimate.
            </p>
          ) : (
            <div className="text-sm">
              <div className="text-(--foreground)">
                {effectiveRto!.source === "RESEARCH_ESTIMATE" ? "Research estimate" : effectiveRto!.source === "ACTUAL_OBSERVED" ? "Actual observed" : "Validated"}:{" "}
                <span className="font-mono-num">{effectiveRto!.low}–{effectiveRto!.high}%</span> (base {effectiveRto!.base}%)
              </div>
              <div className="mt-1 text-(--muted)">Confidence: {effectiveRto!.confidence}. {effectiveRto!.reason}</div>
            </div>
          )}
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Market</SectionLabel>
        <Card>
          {product.saturation ? (
            <div className="text-sm">
              <Badge color={verdictColor(product.saturation.verdict)}>{product.saturation.verdict}</Badge>
              <p className="mt-2 text-(--foreground)">{product.saturation.reason}</p>
            </div>
          ) : (
            <p className="text-sm text-(--muted)">No saturation research added yet.</p>
          )}
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Pricing</SectionLabel>
        <Card>
          {product.pricing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-(--muted-2) uppercase">Low</div>
                <div className="font-mono-num">{product.pricing.lowMarketPrice != null ? money(product.pricing.lowMarketPrice) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-(--muted-2) uppercase">Common</div>
                <div className="font-mono-num">{product.pricing.commonPrice != null ? money(product.pricing.commonPrice) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-(--muted-2) uppercase">Premium</div>
                <div className="font-mono-num">{product.pricing.premiumPrice != null ? money(product.pricing.premiumPrice) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-(--muted-2) uppercase">Test range</div>
                <div className="font-mono-num">
                  {product.pricing.recommendedTestRangeLow != null && product.pricing.recommendedTestRangeHigh != null
                    ? `${money(product.pricing.recommendedTestRangeLow)}–${money(product.pricing.recommendedTestRangeHigh)}`
                    : "—"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-(--muted)">No pricing research added yet.</p>
          )}
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Test plan</SectionLabel>
        <Card>
          <p className="text-sm text-(--foreground) mb-3">{verdict.recommendedTestSummary}</p>
          <PrimaryButton href={`/plan/${product.id}`}>Open full test plan →</PrimaryButton>
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Biggest risk</SectionLabel>
        <Card className="border-(--red)/20">
          <p className="text-sm text-(--foreground)">{verdict.biggestRisk}</p>
          {verdict.whatCouldMakeItViable ? (
            <p className="mt-2 text-sm text-(--muted)">
              <span className="text-(--foreground) font-medium">What could make it viable: </span>
              {verdict.whatCouldMakeItViable}
            </p>
          ) : null}
        </Card>
      </section>

      <section className="mb-10">
        <SectionLabel>Next action</SectionLabel>
        <Card className="border-(--foreground)/20">
          <p className="text-base font-medium text-(--foreground)">{verdict.nextAction}</p>
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-14">
        <SecondaryButton href={`/check/${product.id}/research`}>← Edit research</SecondaryButton>
        <PrimaryButton href={`/plan/${product.id}`}>Build test plan →</PrimaryButton>
      </div>

      <Card className="text-center">
        <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">
          Want help building this for real?
        </div>
        <p className="text-sm text-(--muted) mb-4">
          This verdict gives you the framework. 1:1 mentorship helps you execute it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <PrimaryButton href="https://chiragsharma.co">Apply for 1:1 mentorship</PrimaryButton>
          <SecondaryButton href="https://chiragsharma.co">Visit chiragsharma.co</SecondaryButton>
        </div>
      </Card>
    </main>
  );
}
