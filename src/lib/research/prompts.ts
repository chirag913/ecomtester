import type { ResearchTopic } from "@/lib/types";

export interface ResearchPromptContext {
  productName: string;
  productCategory: string;
  sellingPrice?: number;
  productUrl?: string;
  supplierUrl?: string;
  existingStoreUrl?: string;
}

export interface ResearchPromptSpec {
  topic: ResearchTopic;
  title: string;
  chatGptPrompt: (ctx: ResearchPromptContext) => string;
  claudeCodePrompt: (ctx: ResearchPromptContext) => string;
  manualSteps: string[];
}

const commonFooter = `
Requirements for your answer:
- Use current information — search the live web, don't rely on memory.
- Separate DIRECT EVIDENCE (things you actually found, with source + URL) from INFERENCE (your reasoning when no direct evidence exists).
- Rate your CONFIDENCE (HIGH / MEDIUM / LOW) for each finding and explain why.
- Explicitly list what you could NOT determine — never guess and present it as fact.
- Cite source URLs for every claim.`;

export const RESEARCH_PROMPTS: ResearchPromptSpec[] = [
  {
    topic: "meta_saturation",
    title: "Meta Ads / Saturation Research",
    chatGptPrompt: (ctx) => `I'm evaluating whether to test "${ctx.productName}" (category: ${ctx.productCategory}) as a paid Meta ads product for the Indian market.

Research and report:
1. Is this product (or close variants) currently being advertised on Meta (Facebook/Instagram) by Indian sellers? Search Meta Ad Library (facebook.com/ads/library) for the exact product name and close alternative names.
2. Are there active or recent (last 60-90 days) Indian advertisers running ads for it?
3. Does this look like an older/well-known dropshipping winner that audiences have already seen many times?
4. How competitive does it appear (many sellers vs few)?
5. Are there recurring creatives/hooks/angles being reused across advertisers?
6. Any obvious differentiation opportunity (bundle, angle, positioning) that isn't already saturated?
${commonFooter}`,
    claudeCodePrompt: (ctx) => `Research current Meta advertising activity and saturation for the product "${ctx.productName}" (category: ${ctx.productCategory}) in the Indian ecommerce market${ctx.productUrl ? ` (reference: ${ctx.productUrl})` : ""}.

Use web search to check: Meta Ad Library activity, recent Indian sellers/ads for this or similar products, whether this looks like an established dropshipping winner, competitive intensity, recurring creative angles, and any differentiation gaps.
${commonFooter}
If exact ad counts cannot be reliably determined, say so explicitly rather than estimating a number.`,
    manualSteps: [
      "Open Meta Ad Library: facebook.com/ads/library",
      "Search the exact product name, then alternative/generic names for the same product.",
      "Filter by country: India, category: All ads (or Housing/Employment/Credit doesn't apply — use All).",
      "Search for likely Indian seller/brand names selling this product.",
      "Note how many distinct, currently-active advertisers you find (exact counts are often unreliable — describe what you observe instead).",
      "Screenshot any relevant ads as evidence, and note the creative angle/hook used.",
      "Record your findings, including what you could NOT determine.",
    ],
  },
  {
    topic: "pricing",
    title: "Indian Market Price Research",
    chatGptPrompt: (ctx) => `Research current Indian retail selling prices for "${ctx.productName}" (category: ${ctx.productCategory})${ctx.sellingPrice ? `. My planned selling price is ₹${ctx.sellingPrice}.` : "."}

Find and report:
1. Low market price currently seen in India (marketplaces, D2C stores, social sellers).
2. Common/typical price point.
3. Premium price point (if a premium positioning exists).
4. A recommended test price range considering market price, perceived value, and positioning — not just margin maximization.
${commonFooter}`,
    claudeCodePrompt: (ctx) => `Research current Indian market pricing for "${ctx.productName}" (category: ${ctx.productCategory})${ctx.sellingPrice ? `, compared against a planned selling price of ₹${ctx.sellingPrice}` : ""}.

Search Indian marketplaces (Amazon.in, Flipkart, Meesho), D2C/Shopify stores, and Instagram sellers for current prices. Report low/common/premium price bands and a recommended test range.
${commonFooter}`,
    manualSteps: [
      "Search the product on Amazon.in, Flipkart, and Meesho — note the price range.",
      "Search Google Shopping / Google for '<product name> price India'.",
      "Check 2-3 Instagram or Shopify sellers advertising the same or similar product.",
      "Note the lowest, most common, and any premium price points you find.",
      "Record source URLs and the date you checked.",
    ],
  },
  {
    topic: "rto_benchmark",
    title: "RTO Research",
    chatGptPrompt: (ctx) => `I need category-level and payment-method RTO (Return to Origin) benchmark data for Indian D2C/dropshipping ecommerce, specifically for a product like "${ctx.productName}" (category: ${ctx.productCategory}) sold primarily via COD.

Research and report:
1. Typical RTO ranges for this product category in Indian D2C/COD ecommerce.
2. How COD vs prepaid affects RTO rates.
3. Any product-specific factors (size, fragility, price point, perceived value) that would push RTO higher or lower than the category average.
4. Cite sources — industry reports, courier/logistics company data, seller forums/case studies.
${commonFooter}
Give a LOW–BASE–HIGH range, not a single number, and state your confidence.`,
    claudeCodePrompt: (ctx) => `Research RTO (Return to Origin) benchmarks for Indian COD ecommerce in the category "${ctx.productCategory}", relevant to the product "${ctx.productName}".

Look for logistics/courier industry reports, D2C brand case studies, and seller community data on RTO rates by category and by payment method (COD vs prepaid).
${commonFooter}
Report as a LOW-BASE-HIGH % range with a confidence rating, and note what's category-level inference vs product-specific evidence.`,
    manualSteps: [
      "Search '<category> RTO rate India COD ecommerce' and read logistics/courier blog posts (Shiprocket, Delhivery, etc. publish category benchmarks).",
      "Search for seller forum posts or case studies mentioning RTO % for similar products.",
      "Note whether findings are category-level (inferred) or product-specific (direct evidence).",
      "Record a LOW-BASE-HIGH range rather than a single number, with your confidence level.",
    ],
  },
  {
    topic: "supplier_availability",
    title: "Supplier Availability Research",
    chatGptPrompt: (ctx) => `Find current Indian and dropshipping suppliers for "${ctx.productName}" (category: ${ctx.productCategory})${ctx.supplierUrl ? `. I already have one candidate: ${ctx.supplierUrl}` : "."}

Research and report:
1. Indian suppliers (IndiaMART, Alibaba India-ready sellers, local wholesalers) — availability, typical MOQ, unit cost range.
2. Dropshipping-friendly suppliers (no-MOQ, ship-on-demand) if any exist.
3. Estimated lead time for fulfillment.
4. Any red flags (single-supplier risk, inconsistent quality reports, etc.).
${commonFooter}`,
    claudeCodePrompt: (ctx) => `Research supplier availability for "${ctx.productName}" (category: ${ctx.productCategory}) for an Indian ecommerce seller${ctx.supplierUrl ? `, starting from this candidate supplier: ${ctx.supplierUrl}` : ""}.

Check IndiaMART, Alibaba, and dropshipping-oriented platforms. Report supplier availability, approximate cost range, MOQ, and lead time.
${commonFooter}`,
    manualSteps: [
      "Search the product on IndiaMART.com — note number of listed suppliers and price range.",
      "Search Alibaba.com for suppliers that ship to India or have India-based warehousing.",
      "Check if any dropshipping-specific supplier (no MOQ) exists for this product.",
      "Record supplier names/links, MOQ, price range, and estimated lead time.",
    ],
  },
  {
    topic: "prepaid_apps",
    title: "Shopify COD-to-Prepaid App Research",
    chatGptPrompt: () => `Research current (up-to-date) Shopify apps that help Indian COD-heavy stores increase prepaid order share.

Cover apps that offer: COD-to-prepaid conversion nudges, prepaid incentives/discounts, WhatsApp-based order confirmation, OTP/COD verification to reduce fake orders, and partial-COD (partial upfront payment) where supported.

For each app found, report: name, current pricing (as far as you can verify), user reviews/signals, core functionality, and known limitations.
${commonFooter}`,
    claudeCodePrompt: () => `Research current Shopify apps for COD-to-prepaid conversion for Indian ecommerce stores — covering prepaid incentives, WhatsApp order confirmation, OTP/COD verification, and partial-COD support.

For each app: current pricing, functionality, review signals, and limitations, with sources.
${commonFooter}`,
    manualSteps: [
      "Open the Shopify App Store and search 'COD to prepaid', 'OTP COD verification', and 'partial COD'.",
      "Shortlist 3-5 apps and open each listing.",
      "Note pricing tier, star rating, review count, and stated functionality.",
      "Check a few reviews for real merchant feedback and limitations.",
    ],
  },
  {
    topic: "testing_strategy",
    title: "Current Meta Testing Strategy Research",
    chatGptPrompt: () => `What is the current (as of today) best-practice Meta Ads campaign structure for testing a new ecommerce product with a small daily budget (₹1,200-₹2,000/day) targeting India?

Cover: current recommended campaign objective, ABO vs CBO for testing, current placement recommendations (Advantage+ placements vs manual), and any recent Meta platform changes that affect small-budget testing.
${commonFooter}`,
    claudeCodePrompt: () => `Research the current best-practice Meta Ads test-campaign structure for a small-budget (₹1,200-2,000/day) Indian ecommerce product test — objective, ABO vs CBO, placements, and any recent platform changes relevant to testing at this budget.
${commonFooter}`,
    manualSteps: [
      "Search 'Meta Ads campaign structure 2026 ecommerce testing' for recent guidance.",
      "Check Meta's own Business Help Center for current campaign objective and placement recommendations.",
      "Look for recent (last 3-6 months) creator/agency posts on small-budget testing structure changes.",
      "Note the date of any guidance you find — Meta's platform changes frequently.",
    ],
  },
];

export function getResearchPrompt(topic: ResearchTopic): ResearchPromptSpec {
  const spec = RESEARCH_PROMPTS.find((p) => p.topic === topic);
  if (!spec) throw new Error(`No research prompt defined for topic: ${topic}`);
  return spec;
}
