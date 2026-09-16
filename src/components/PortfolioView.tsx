"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatTokenAmount } from "@/lib/format";
import { fetchMarket, fetchUserPositions } from "@/lib/indexer";
import { hasContract, hasIndexer } from "@/lib/config";
import { mapIndexerError } from "@/lib/errors";
import {
  categorizePosition,
  deriveMarketViewStatus,
  outcomeLabel,
  type IndexerMarket,
  type IndexerPosition,
  type PortfolioCategory,
} from "@/lib/market-status";
import { getReadClient } from "@/lib/sdk";
import { useWallet } from "@/lib/wallet";
import { EmptyState, ErrorState, LoadingState } from "./States";

type PortfolioRow = {
  position: IndexerPosition;
  market: IndexerMarket | null;
  category: PortfolioCategory;
  claimable: bigint | null;
  marketError?: string;
};

const SECTIONS: { key: PortfolioCategory; title: string; blurb: string }[] = [
  {
    key: "open",
    title: "Open",
    blurb: "Markets still accepting stakes or awaiting resolution.",
  },
  {
    key: "claimable",
    title: "Claimable",
    blurb: "Winning positions ready to claim on-chain.",
  },
  {
    key: "refundable",
    title: "Refundable",
    blurb: "Invalid or refund-settled markets — recover deposits.",
  },
  {
    key: "won",
    title: "Won",
    blurb: "Resolved in your favor (claim if not yet settled).",
  },
  {
    key: "lost",
    title: "Lost",
    blurb: "Resolved against your stake.",
  },
  {
    key: "resolved",
    title: "Resolved",
    blurb: "Already claimed or otherwise finalized for you.",
  },
];

export function PortfolioView() {
  const wallet = useWallet();
  const [rows, setRows] = useState<PortfolioRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!wallet.address) {
      setRows(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!hasIndexer()) {
        throw Object.assign(
          new Error(
            "Set NEXT_PUBLIC_INDEXER_API_URL to list portfolio positions. Authoritative balances still come from RPC when viewing a market.",
          ),
          { title: "Indexer not configured" },
        );
      }

      const positions = await fetchUserPositions(wallet.address);
      const enriched: PortfolioRow[] = await Promise.all(
        positions.map(async (position) => {
          let market: IndexerMarket | null = null;
          let marketError: string | undefined;
          let claimable: bigint | null = null;

          try {
            market = await fetchMarket(position.marketId);
          } catch (err) {
            marketError = mapIndexerError(err).message;
          }

          if (hasContract()) {
            try {
              const client = getReadClient();
              claimable = await client.getClaimable(
                position.marketId,
                wallet.address!,
              );
            } catch {
              claimable = null;
            }
          }

          const viewStatus = market
            ? deriveMarketViewStatus(market.status, market.closeAt)
            : "open";

          const category = categorizePosition({
            marketStatus: viewStatus,
            outcome: market?.outcome ?? null,
            yesAmount: BigInt(position.yesAmount),
            noAmount: BigInt(position.noAmount),
            claimed: position.claimed,
            claimable,
          });

          return { position, market, category, claimable, marketError };
        }),
      );

      setRows(enriched);
    } catch (err) {
      setRows(null);
      if (err && typeof err === "object" && "title" in err) {
        setError({
          title: String((err as { title: string }).title),
          message: err instanceof Error ? err.message : String(err),
        });
      } else {
        const mapped = mapIndexerError(err);
        setError({ title: mapped.title, message: mapped.message });
      }
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(
      SECTIONS.map((s) => [s.key, [] as PortfolioRow[]]),
    ) as Record<PortfolioCategory, PortfolioRow[]>;
    for (const row of rows ?? []) {
      map[row.category].push(row);
    }
    return map;
  }, [rows]);

  if (wallet.status === "disconnected" || !wallet.address) {
    return (
      <EmptyState
        title="Connect your wallet"
        description="Portfolio positions are loaded for the connected Stellar address."
      />
    );
  }

  if (wallet.status === "connecting") {
    return <LoadingState label="Connecting wallet…" />;
  }

  if (loading) {
    return <LoadingState label="Loading positions…" />;
  }

  if (error) {
    return (
      <ErrorState
        title={error.title}
        message={error.message}
        onRetry={() => void load()}
      />
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="No positions"
        description="Stake on a market to see it here. Indexer lag may delay new positions."
      />
    );
  }

  return (
    <div className="space-y-10">
      {SECTIONS.map((section) => {
        const items = grouped[section.key];
        if (!items.length) return null;
        return (
          <section key={section.key}>
            <h2 className="font-serif text-2xl text-ink">{section.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{section.blurb}</p>
            <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line">
              {items.map((row) => (
                <li key={`${row.position.marketId}-${row.position.userAddress}`}>
                  <Link
                    href={`/markets/${row.position.marketId}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-paper-mute/60"
                  >
                    <div>
                      <div className="font-mono text-xs text-ink-faint">
                        #{row.position.marketId}
                      </div>
                      <div className="font-serif text-lg text-ink">
                        {row.market?.question?.trim() ||
                          `Market #${row.position.marketId}`}
                      </div>
                      {row.market?.outcome ? (
                        <div className="mt-1 text-xs text-ink-soft">
                          Result: {outcomeLabel(row.market.outcome)}
                        </div>
                      ) : null}
                      {row.marketError ? (
                        <div className="mt-1 text-xs text-danger">
                          Market metadata error: {row.marketError}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-sm text-ink-soft">
                      <div>
                        YES {formatTokenAmount(row.position.yesAmount)} · NO{" "}
                        {formatTokenAmount(row.position.noAmount)}
                      </div>
                      {row.claimable !== null ? (
                        <div className="text-xs">
                          Claimable {formatTokenAmount(row.claimable)}
                        </div>
                      ) : hasContract() ? (
                        <div className="text-xs text-ink-faint">
                          Claimable unavailable
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
