import { PortfolioView } from "@/components/PortfolioView";

export const metadata = {
  title: "Portfolio",
};

export default function PortfolioPage() {
  return (
    <section>
      <div className="border-b border-ink-line pb-6">
        <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Portfolio
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Positions discovered via the indexer, categorized by market state.
          Claim and refund amounts are confirmed on-chain at settlement time.
        </p>
      </div>
      <div className="mt-8">
        <PortfolioView />
      </div>
    </section>
  );
}
