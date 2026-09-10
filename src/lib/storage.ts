"use client";

import { useSyncExternalStore } from "react";
import type {
  AdSet,
  AdSetDailyMetrics,
  DeliveryMetrics,
  PricingResearch,
  ProductInputs,
  RealizedEconomicsInputs,
  ResearchEntry,
  RtoEstimate,
  SaturationAssessment,
} from "@/lib/types";

const STORAGE_KEY = "ecom-tester:products:v1";

export interface StoredProduct {
  id: string;
  createdAt: string;
  updatedAt: string;
  inputs: ProductInputs;
  research: ResearchEntry[];
  rtoResearchEstimate?: RtoEstimate;
  actualRtoEstimate?: RtoEstimate;
  saturation?: SaturationAssessment;
  pricing?: PricingResearch;
  supplierAvailable?: boolean | null;
  adSets: AdSet[];
  adSetMetrics: AdSetDailyMetrics[];
  deliveryMetrics?: DeliveryMetrics;
  realizedInputs?: RealizedEconomicsInputs;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readFromDisk(): StoredProduct[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --- External store: a single in-memory cache + pub/sub, so React can read
// localStorage via useSyncExternalStore without violating the "no setState
// in effect" rule and without re-parsing JSON on every render. ---
let cache: StoredProduct[] = readFromDisk();
const listeners = new Set<() => void>();

function notify() {
  cache = readFromDisk();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (isBrowser()) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): StoredProduct[] {
  return cache;
}

const EMPTY_SNAPSHOT: StoredProduct[] = [];

function getServerSnapshot(): StoredProduct[] {
  return EMPTY_SNAPSHOT;
}

function writeAll(products: StoredProduct[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  notify();
}

/** Read-only list of all stored products, sorted most-recently-updated first. React-reactive. */
export function useProducts(): StoredProduct[] {
  const products = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Read-only single product by id. React-reactive — updates when the store changes. */
export function useProduct(id: string): StoredProduct | undefined {
  const products = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return products.find((p) => p.id === id);
}

export function getProduct(id: string): StoredProduct | undefined {
  return readFromDisk().find((p) => p.id === id);
}

function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createProduct(inputs: ProductInputs): StoredProduct {
  const now = new Date().toISOString();
  const product: StoredProduct = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    inputs,
    research: [],
    adSets: [],
    adSetMetrics: [],
  };
  const all = readFromDisk();
  all.push(product);
  writeAll(all);
  return product;
}

export function updateProduct(id: string, patch: Partial<StoredProduct>): StoredProduct | undefined {
  const all = readFromDisk();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated: StoredProduct = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteProduct(id: string) {
  writeAll(readFromDisk().filter((p) => p.id !== id));
}
