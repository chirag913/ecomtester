"use client";

import Link from "next/link";
import { useProducts } from "@/lib/storage";
import { Card } from "@/components/ui";

export function RecentProducts() {
  const products = useProducts();

  if (products.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-14">
      <div className="text-xs font-medium uppercase tracking-widest text-(--muted-2) mb-3">
        Continue a product
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.slice(0, 4).map((p) => (
          <Link key={p.id} href={`/check/${p.id}/verdict`}>
            <Card className="hover:border-(--foreground)/30 transition-colors h-full">
              <div className="text-sm font-semibold text-(--foreground)">{p.inputs.productName || "Untitled product"}</div>
              <div className="text-xs text-(--muted) mt-1">
                {p.inputs.productCategory || "—"} · ₹{p.inputs.sellingPrice || 0}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
