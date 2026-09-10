import { PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { GuidedSteps } from "@/components/GuidedSteps";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
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

        <div className="mt-9">
          <PrimaryButton href="/check/new" className="px-8 py-3 text-base">
            Check a product →
          </PrimaryButton>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="text-xs font-medium uppercase tracking-widest text-(--muted-2) mb-6 text-center">
          Three steps. Follow them in order.
        </div>
        <GuidedSteps />
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
