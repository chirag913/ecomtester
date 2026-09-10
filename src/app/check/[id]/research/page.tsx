"use client";

import { useParams, useRouter } from "next/navigation";
import { updateProduct, useProduct, type StoredProduct } from "@/lib/storage";
import { PrimaryButton, ProgressSteps, SecondaryButton } from "@/components/ui";
import { SaturationCard } from "@/components/research/SaturationCard";
import { RtoCard } from "@/components/research/RtoCard";
import { PricingCard } from "@/components/research/PricingCard";
import { SupplierCard } from "@/components/research/SupplierCard";
import type { PricingResearch, RtoEstimate, SaturationAssessment } from "@/lib/types";

export default function ResearchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = useProduct(params.id);

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

  const context = {
    productName: product.inputs.productName,
    productCategory: product.inputs.productCategory,
    sellingPrice: product.inputs.sellingPrice,
    productUrl: product.inputs.productUrl,
    supplierUrl: product.inputs.supplierUrl,
  };

  function save(patch: Partial<StoredProduct>) {
    updateProduct(params.id, patch);
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
      <ProgressSteps steps={["Economics", "Research", "Verdict"]} currentIndex={1} />

      <h1 className="text-2xl font-semibold mb-1">Research: {product.inputs.productName}</h1>
      <p className="text-sm text-(--muted) mb-8">
        Research is optional but strongly recommended — it raises the confidence of your verdict. You can
        skip it and see a math-only verdict now, then come back and add research later.
      </p>

      <div className="space-y-4">
        <SaturationCard
          context={context}
          value={product.saturation}
          onSave={(a: SaturationAssessment) => save({ saturation: a })}
        />
        <RtoCard
          context={context}
          value={product.rtoResearchEstimate}
          onSave={(r: RtoEstimate) => save({ rtoResearchEstimate: r })}
        />
        <PricingCard
          context={context}
          value={product.pricing}
          onSave={(p: PricingResearch) => save({ pricing: p })}
        />
        <SupplierCard
          context={context}
          value={product.supplierAvailable}
          onSave={(available) => save({ supplierAvailable: available })}
        />
      </div>

      <div className="flex items-center justify-between pt-8">
        <SecondaryButton onClick={() => router.push(`/check/new`)}>← Back</SecondaryButton>
        <PrimaryButton href={`/check/${params.id}/verdict`}>See verdict →</PrimaryButton>
      </div>
    </main>
  );
}
