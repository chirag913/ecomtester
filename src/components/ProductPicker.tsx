"use client";

import Link from "next/link";
import { useProducts } from "@/lib/storage";
import { Card, PrimaryButton } from "@/components/ui";

export function ProductPicker({ destination, title }: { destination: (id: string) => string; title: string }) {
  const products = useProducts();

  if (products.length === 0) {
    return (
      <main className="flex-1 mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold mb-3">{title}</h1>
        <p className="text-sm text-(--muted) mb-6">
          You haven&apos;t checked a product yet. Start there first — economics and test plan come from it.
        </p>
        <PrimaryButton href="/check/new">Check a product</PrimaryButton>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-xl font-semibold mb-6">{title}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <Link key={p.id} href={destination(p.id)}>
            <Card className="hover:border-(--foreground)/30 transition-colors h-full">
              <div className="text-sm font-semibold text-(--foreground)">{p.inputs.productName}</div>
              <div className="text-xs text-(--muted) mt-1">
                {p.inputs.productCategory} · ₹{p.inputs.sellingPrice}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
