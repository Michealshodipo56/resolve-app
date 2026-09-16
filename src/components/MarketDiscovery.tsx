"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMarkets } from "@/lib/indexer";
import type { IndexerMarket } from "@/lib/market-status";
import { mapIndexerError } from "@/lib/errors";
import { hasIndexer, getAppConfig } from "@/lib/config";
import { MarketCard } from "./MarketCard";
import { EmptyState, ErrorState, LoadingState } from "./States";

type Filter = "all" | "open" | "resolved" | "invalid";

export function MarketDiscovery() {
  const [filter, setFilter] = useState<Filter>("all");
  const [markets, setMarkets] = useState<IndexerMarket[] | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasIndexer()) {
      setMarkets(null);
      setError({
        title: "Indexer not configured",
        message:
          "Set NEXT_PUBLIC_INDEXER_API_URL to discover markets. This app will not invent market lists.",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetchMarkets({
        status: filter === "all" ? undefined : filter,
        limit: 50,
      });
      setMarkets(res.markets);
    } catch (err) {
      const mapped = mapIndexerError(err);
      setMarkets(null);
      setError({ title: mapped.title, message: mapped.message });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const indexerUrl = getAppConfig().indexerApiUrl;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-line pb-6">
        <div>
          <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            Markets
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Binary YES/NO markets indexed from on-chain events. Settlement always
            goes through the contract — the indexer is discovery only.
          </p>
        </div>
        <div className="flex gap-1 text-sm" role="tablist" aria-label="Filter">
          {(["all", "open", "resolved", "invalid"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize ${
                filter === f
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {indexerUrl ? (
        <p className="mt-3 text-xs text-ink-faint">
          Indexer: <span className="font-mono">{indexerUrl}</span>
        </p>
      ) : null}

      {loading ? <LoadingState label="Loading markets from indexer…" /> : null}

      {!loading && error ? (
        <div className="mt-8">
          <ErrorState
            title={error.title}
            message={error.message}
            onRetry={() => void load()}
          />
        </div>
      ) : null}

      {!loading && !error && markets && markets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No markets yet"
            description="Create the first market, or wait for the indexer to catch up with contract events."
          />
        </div>
      ) : null}

      {!loading && !error && markets && markets.length > 0 ? (
        <div className="mt-4">
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
