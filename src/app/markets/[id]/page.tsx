import { MarketDetail } from "@/components/MarketDetail";

export const metadata = {
  title: "Market",
};

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const marketId = Number(id);

  if (!Number.isInteger(marketId) || marketId < 0) {
    return (
      <div className="border border-danger/30 bg-danger-soft px-6 py-8" role="alert">
        <h1 className="font-serif text-xl text-danger">Invalid market id</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Market ids must be non-negative integers.
        </p>
      </div>
    );
  }

  return <MarketDetail marketId={marketId} />;
}
