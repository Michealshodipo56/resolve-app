import {
  deriveMarketViewStatus,
  marketStatusLabel,
  type IndexerMarket,
  type MarketViewStatus,
} from "@/lib/market-status";

const STYLES: Record<MarketViewStatus, string> = {
  open: "bg-accent-soft text-accent",
  awaiting_resolution: "bg-warn-soft text-warn",
  resolved: "bg-paper-mute text-ink-soft",
  invalid: "bg-danger-soft text-danger",
};

export function StatusBadge({
  market,
  nowSec,
}: {
  market: Pick<IndexerMarket, "status" | "closeAt">;
  nowSec?: number;
}) {
  const view = deriveMarketViewStatus(market.status, market.closeAt, nowSec);
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide ${STYLES[view]}`}
    >
      {marketStatusLabel(view)}
    </span>
  );
}

export function StatusBadgeFromView({ status }: { status: MarketViewStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide ${STYLES[status]}`}
    >
      {marketStatusLabel(status)}
    </span>
  );
}
