"use client";

import { ProductPicker } from "@/components/ProductPicker";

export default function ScaleIndexPage() {
  return <ProductPicker destination={(id) => `/scale/${id}`} title="Analyze my results — pick a product" />;
}
