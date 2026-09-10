"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { updateProduct, useProduct } from "@/lib/storage";
import { calculateProductEconomics } from "@/lib/economics";
import { buildTestPlan } from "@/lib/test-planner";
import { pickEffectiveRtoEstimate } from "@/lib/research/rto";
import { INTERNAL_DEFAULT } from "@/lib/defaults";
import { Badge, Card, Field, inputClass, PrimaryButton, SecondaryButton, SectionLabel, StatCard } from "@/components/ui";
import { AdSetPanel } from "@/components/AdSetPanel";
import type { AdSet, AdSetDailyMetrics } from "@/lib/types";

const PLACEHOLDER_RTO_PCT = INTERNAL_DEFAULT.placeholderRtoPct;

export default function TestPlanPage() {
  const params = useParams<{ id: string }>();
  const product = useProduct(params.id);
  const [newAdSetName, setNewAdSetName] = useState("");
  const [newAdSetCampaign, setNewAdSetCampaign] = useState("");
  const [newAdSetCreative, setNewAdSetCreative] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const computed = useMemo(() => {
    if (!product) return null;
    const effectiveRto = pickEffectiveRtoEstimate(product.rtoResearchEstimate, product.actualRtoEstimate);
    const rtoPct = effectiveRto?.base ?? PLACEHOLDER_RTO_PCT;
    const economics = calculateProductEconomics(product.inputs, rtoPct);
    const testPlan = buildTestPlan(product.inputs.dailyAdBudget, economics.maxViableCAC, product.inputs.sellingPrice);
    return { economics, testPlan };
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
  const { economics, testPlan } = computed;
  const usedPlaceholderRto = !product.rtoResearchEstimate && !product.actualRtoEstimate;

  function addAdSet() {
    if (!product || !newAdSetName.trim()) return;
    const adSet: AdSet = {
      id: `as_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: newAdSetName.trim(),
      campaign: newAdSetCampaign.trim() || "Test campaign",
      creative: newAdSetCreative.trim() || "Creative 1",
    };
    updateProduct(product.id, { adSets: [...product.adSets, adSet] });
    setNewAdSetName("");
    setNewAdSetCampaign("");
    setNewAdSetCreative("");
    setShowAddForm(false);
  }

  function addMetric(m: AdSetDailyMetrics) {
    if (!product) return;
    const others = product.adSetMetrics.filter((x) => !(x.adSetId === m.adSetId && x.date === m.date));
    updateProduct(product.id, { adSetMetrics: [...others, m] });
  }

  function removeAdSet(id: string) {
    if (!product) return;
    updateProduct(product.id, {
      adSets: product.adSets.filter((a) => a.id !== id),
      adSetMetrics: product.adSetMetrics.filter((m) => m.adSetId !== id),
    });
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">Test planner</div>
        <h1 className="text-2xl font-semibold">{product.inputs.productName}</h1>
        <Badge color="neutral" className="mt-2">
          {testPlan.tier.replace("_", " ")} tier
        </Badge>
      </div>

      {usedPlaceholderRto ? (
        <Card className="mb-8 border-(--yellow)/30">
          <p className="text-sm text-(--muted)">
            <span className="text-(--foreground) font-medium">No RTO research or actual data yet.</span>{" "}
            Maximum viable CAC and the kill rule threshold below use a placeholder assumption of {PLACEHOLDER_RTO_PCT}%
            RTO — an internal engineering default, not a real estimate. Add RTO research on the{" "}
            <a href={`/check/${product.id}/research`} className="underline">
              research step
            </a>{" "}
            for a real number.
          </p>
        </Card>
      ) : null}

      <section className="mb-8">
        <SectionLabel>Plan</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Daily budget" value={`₹${testPlan.totalRecommendedDailyBudget}`} />
          <StatCard label="Ad sets" value={testPlan.numberOfAdSets} />
          <StatCard label="Budget / ad set / day" value={`₹${testPlan.budgetPerAdSet}`} />
          <StatCard label="Maximum viable CAC" value={`₹${testPlan.maxViableCAC.toFixed(0)}`} color={testPlan.maxViableCAC > 0 ? "green" : "red"} />
          <StatCard label="Kill rule threshold" value={`₹${testPlan.killRuleThreshold.toFixed(0)}`} />
        </div>
        <Card className="mt-3 space-y-2 text-sm">
          <p><span className="text-(--muted-2) uppercase text-xs mr-2">Targeting</span>{testPlan.targeting}</p>
          <p><span className="text-(--muted-2) uppercase text-xs mr-2">Placements</span>{testPlan.placements}</p>
          <p><span className="text-(--muted-2) uppercase text-xs mr-2">Creatives</span>{testPlan.creatives}</p>
        </Card>
        <p className="mt-3 text-xs text-(--muted-2)">
          Default test framework — not a universal Meta rule. {testPlan.budgetNote}
        </p>
      </section>

      <section className="mb-8">
        <SectionLabel>Kill rule</SectionLabel>
        <Card>
          <p className="text-sm text-(--foreground)">{testPlan.killRuleExplanation}</p>
        </Card>
      </section>

      <section className="mb-8">
        <SectionLabel>Continue rule</SectionLabel>
        <Card>
          <p className="text-sm text-(--foreground)">{testPlan.continueRuleExplanation}</p>
        </Card>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Ad set tracking</SectionLabel>
          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="text-sm font-medium text-(--foreground) underline underline-offset-2 hover:opacity-80"
          >
            {showAddForm ? "Cancel" : "+ Add ad set"}
          </button>
        </div>

        {showAddForm ? (
          <Card className="mb-4 grid sm:grid-cols-3 gap-3 items-end">
            <Field label="Ad set name">
              <input className={inputClass} value={newAdSetName} onChange={(e) => setNewAdSetName(e.target.value)} placeholder="Ad Set #1" />
            </Field>
            <Field label="Campaign">
              <input className={inputClass} value={newAdSetCampaign} onChange={(e) => setNewAdSetCampaign(e.target.value)} placeholder="Test campaign" />
            </Field>
            <Field label="Creative">
              <input className={inputClass} value={newAdSetCreative} onChange={(e) => setNewAdSetCreative(e.target.value)} placeholder="Creative 1" />
            </Field>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={addAdSet}
                className="inline-flex items-center justify-center rounded-md bg-(--foreground) text-(--background) px-4 py-2 text-sm font-semibold hover:opacity-85"
              >
                Add
              </button>
            </div>
          </Card>
        ) : null}

        {product.adSets.length === 0 ? (
          <Card>
            <p className="text-sm text-(--muted)">
              No ad sets yet. Add {testPlan.numberOfAdSets} ad sets to match your test plan structure.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {product.adSets.map((adSet) => (
              <AdSetPanel
                key={adSet.id}
                adSet={adSet}
                metrics={product.adSetMetrics}
                killThreshold={testPlan.killRuleThreshold}
                maxViableCAC={economics.maxViableCAC}
                onAddMetric={addMetric}
                onRemove={() => removeAdSet(adSet.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <SecondaryButton href={`/check/${product.id}/verdict`}>← Back to verdict</SecondaryButton>
        <PrimaryButton href={`/scale/${product.id}`}>Analyze results →</PrimaryButton>
      </div>
    </main>
  );
}
