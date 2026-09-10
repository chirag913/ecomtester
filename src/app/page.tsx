import { PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { RecentProducts } from "@/components/RecentProducts";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-(--muted-2) mb-4">
          Ecom Tester
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-(--foreground)">
          Know before you spend.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-(--muted) max-w-xl mx-auto">
          Check the economics. Research the market. Build your test plan. Know when to kill,
          continue, or scale.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <PrimaryButton href="/check/new" className="w-full sm:w-auto px-8 py-3 text-base">
            Check a product
          </PrimaryButton>
          <SecondaryButton href="#how-it-works" className="w-full sm:w-auto">
            How it works
          </SecondaryButton>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SecondaryButton href="/plan" className="w-full sm:w-auto">
            Plan my test
          </SecondaryButton>
          <SecondaryButton href="/scale" className="w-full sm:w-auto">
            Analyze my results
          </SecondaryButton>
        </div>

        <RecentProducts />
      </section>

      <section id="how-it-works" className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-xs font-medium uppercase tracking-widest text-(--muted-2) mb-6 text-center">
          Built from a real ecommerce testing framework
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Product economics",
              body: "Deterministic unit economics — the 3× cost rule, RTO modeled properly, and your maximum viable CAC. No LLM guesswork on the math.",
            },
            {
              title: "Market research",
              body: "Reusable research prompts for Meta saturation, Indian pricing, RTO benchmarks, and suppliers — copy into ChatGPT or Claude, or do it manually.",
            },
            {
              title: "Test planner",
              body: "The default 4-ad-set testing framework, sized to your actual daily budget — not a one-size-fits-all number.",
            },
            {
              title: "Kill / continue / scale",
              body: "Rules from real mentorship: the first-day exception, the promising-ad-set rule, and don't-touch-a-winner discipline.",
            },
            {
              title: "Delivery / RTO economics",
              body: "Validates delivery data with mature-order confidence bands, then computes realized profit — not just cheap Meta purchases.",
            },
          ].map((f) => (
            <Card key={f.title}>
              <h3 className="text-sm font-semibold text-(--foreground) mb-2">{f.title}</h3>
              <p className="text-sm text-(--muted)">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <Card className="text-center">
          <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">
            Want help building this for real?
          </div>
          <p className="text-sm text-(--muted) mb-5">
            Ecom Tester supports Chirag Sharma&apos;s ecommerce mentorship. This tool gives you the
            decision framework — 1:1 mentorship helps you execute it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <PrimaryButton href="https://chiragsharma.co" className="w-full sm:w-auto">
              Apply for 1:1 mentorship
            </PrimaryButton>
            <SecondaryButton href="https://chiragsharma.co" className="w-full sm:w-auto">
              Visit chiragsharma.co
            </SecondaryButton>
          </div>
        </Card>
      </section>
    </main>
  );
}
