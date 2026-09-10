"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, inputClass, PrimaryButton, ProgressSteps, SecondaryButton } from "@/components/ui";
import { createProduct } from "@/lib/storage";
import type { ProductInputs } from "@/lib/types";

type FormState = {
  [K in keyof ProductInputs]-?: string;
};

const initialState: FormState = {
  productName: "",
  productCategory: "",
  productCost: "",
  sellingPrice: "",
  shippingCost: "",
  packagingCost: "0",
  paymentFeePct: "0",
  otherVariableCost: "0",
  expectedDiscountPct: "0",
  dailyAdBudget: "",
  reverseShippingCost: "",
  codMixPct: "100",
  rtoProductLossPct: "10",
  targetMarginBufferPct: "15",
  supplierName: "",
  supplierUrl: "",
  indiamartUrl: "",
  dropshippingSupplierUrl: "",
  existingStoreUrl: "",
  productUrl: "",
};

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default function NewProductCheckPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [showOtherCosts, setShowOtherCosts] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inputs: ProductInputs = {
      productName: form.productName.trim() || "Untitled product",
      productCategory: form.productCategory.trim() || "Uncategorized",
      productCost: num(form.productCost),
      sellingPrice: num(form.sellingPrice),
      shippingCost: num(form.shippingCost),
      packagingCost: num(form.packagingCost),
      paymentFeePct: num(form.paymentFeePct),
      otherVariableCost: num(form.otherVariableCost),
      expectedDiscountPct: num(form.expectedDiscountPct),
      dailyAdBudget: num(form.dailyAdBudget),
      reverseShippingCost: form.reverseShippingCost ? num(form.reverseShippingCost) : undefined,
      codMixPct: form.codMixPct ? num(form.codMixPct) : undefined,
      rtoProductLossPct: form.rtoProductLossPct ? num(form.rtoProductLossPct) : undefined,
      targetMarginBufferPct: form.targetMarginBufferPct ? num(form.targetMarginBufferPct) : undefined,
      supplierName: form.supplierName.trim() || undefined,
      supplierUrl: form.supplierUrl.trim() || undefined,
      indiamartUrl: form.indiamartUrl.trim() || undefined,
      dropshippingSupplierUrl: form.dropshippingSupplierUrl.trim() || undefined,
      existingStoreUrl: form.existingStoreUrl.trim() || undefined,
      productUrl: form.productUrl.trim() || undefined,
    };
    const product = createProduct(inputs);
    router.push(`/check/${product.id}/research`);
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
      <ProgressSteps steps={["Economics", "Research", "Verdict"]} currentIndex={0} />

      <h1 className="text-2xl font-semibold mb-1">Product economics</h1>
      <p className="text-sm text-(--muted) mb-8">
        Enter what you know. We&apos;ll calculate the unit economics deterministically — no guessing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product name" required>
              <input
                className={inputClass}
                value={form.productName}
                onChange={(e) => set("productName", e.target.value)}
                placeholder="e.g. LED Sunset Lamp"
                required
              />
            </Field>
            <Field label="Product category" required>
              <input
                className={inputClass}
                value={form.productCategory}
                onChange={(e) => set("productCategory", e.target.value)}
                placeholder="e.g. Home decor"
                required
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs text-(--muted-2)">
            <span className="text-(--red)">*</span> Required — these drive the economics calculation below.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product cost (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 300"
                value={form.productCost}
                onChange={(e) => set("productCost", e.target.value)}
                required
              />
            </Field>
            <Field label="Selling price (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 900"
                value={form.sellingPrice}
                onChange={(e) => set("sellingPrice", e.target.value)}
                required
              />
            </Field>
            <Field label="Shipping cost (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 70"
                value={form.shippingCost}
                onChange={(e) => set("shippingCost", e.target.value)}
                required
              />
            </Field>
            <Field label="Daily advertising budget (₹)" required>
              <input
                type="number"
                min="0"
                step="1"
                className={inputClass}
                placeholder="e.g. 2000"
                value={form.dailyAdBudget}
                onChange={(e) => set("dailyAdBudget", e.target.value)}
                required
              />
            </Field>
          </div>
        </Card>

        <div>
          <button
            type="button"
            onClick={() => setShowOtherCosts((s) => !s)}
            className="text-sm text-(--muted) underline underline-offset-2 hover:text-(--foreground)"
          >
            {showOtherCosts ? "Hide other costs" : "Other costs (packaging, payment fees, discount)"}
          </button>
          {showOtherCosts ? (
            <Card className="mt-3 space-y-4">
              <p className="text-xs text-(--muted-2)">
                Optional — each defaults to ₹0 / 0% if left blank. They matter for accuracy (especially COD fees),
                so add them once you know your real numbers.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Packaging cost (₹)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="e.g. 15"
                    value={form.packagingCost}
                    onChange={(e) => set("packagingCost", e.target.value)}
                  />
                </Field>
                <Field label="COD / payment fee (%)" hint="As a % of selling price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="e.g. 2"
                    value={form.paymentFeePct}
                    onChange={(e) => set("paymentFeePct", e.target.value)}
                  />
                </Field>
                <Field label="Expected discount (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputClass}
                    value={form.expectedDiscountPct}
                    onChange={(e) => set("expectedDiscountPct", e.target.value)}
                  />
                </Field>
                <Field label="Other variable cost (₹)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={form.otherVariableCost}
                    onChange={(e) => set("otherVariableCost", e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-sm text-(--muted) underline underline-offset-2 hover:text-(--foreground)"
          >
            {showAdvanced ? "Hide advanced assumptions" : "Advanced RTO / economics assumptions"}
          </button>
          {showAdvanced ? (
            <Card className="mt-3 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Reverse shipping cost (₹)" hint="Defaults to forward shipping cost">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={form.reverseShippingCost}
                    onChange={(e) => set("reverseShippingCost", e.target.value)}
                    placeholder={form.shippingCost || "same as shipping"}
                  />
                </Field>
                <Field label="COD mix (%)" hint="% of orders that are COD vs prepaid. Default 100.">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className={inputClass}
                    value={form.codMixPct}
                    onChange={(e) => set("codMixPct", e.target.value)}
                  />
                </Field>
                <Field label="RTO product loss (%)" hint="% of product cost assumed damaged/unsellable on RTO. Default 10.">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className={inputClass}
                    value={form.rtoProductLossPct}
                    onChange={(e) => set("rtoProductLossPct", e.target.value)}
                  />
                </Field>
                <Field label="Target margin buffer (%)" hint="Safety margin below break-even CAC. Default 15.">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className={inputClass}
                    value={form.targetMarginBufferPct}
                    onChange={(e) => set("targetMarginBufferPct", e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowLinks((s) => !s)}
            className="text-sm text-(--muted) underline underline-offset-2 hover:text-(--foreground)"
          >
            {showLinks ? "Hide optional links" : "Add supplier / store links (optional)"}
          </button>
          {showLinks ? (
            <Card className="mt-3 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Supplier name">
                  <input className={inputClass} value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} />
                </Field>
                <Field label="Supplier URL">
                  <input className={inputClass} value={form.supplierUrl} onChange={(e) => set("supplierUrl", e.target.value)} />
                </Field>
                <Field label="IndiaMART URL">
                  <input className={inputClass} value={form.indiamartUrl} onChange={(e) => set("indiamartUrl", e.target.value)} />
                </Field>
                <Field label="Dropshipping supplier URL">
                  <input className={inputClass} value={form.dropshippingSupplierUrl} onChange={(e) => set("dropshippingSupplierUrl", e.target.value)} />
                </Field>
                <Field label="Existing store URL">
                  <input className={inputClass} value={form.existingStoreUrl} onChange={(e) => set("existingStoreUrl", e.target.value)} />
                </Field>
                <Field label="Product URL">
                  <input className={inputClass} value={form.productUrl} onChange={(e) => set("productUrl", e.target.value)} />
                </Field>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-2">
          <SecondaryButton href="/">Cancel</SecondaryButton>
          <PrimaryButton type="submit">Continue to research →</PrimaryButton>
        </div>
      </form>
    </main>
  );
}
