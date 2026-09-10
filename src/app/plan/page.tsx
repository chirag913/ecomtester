"use client";

import { ProductPicker } from "@/components/ProductPicker";

export default function PlanIndexPage() {
  return <ProductPicker destination={(id) => `/plan/${id}`} title="Plan my test — pick a product" />;
}
