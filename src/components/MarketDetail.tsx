"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatDeadline,
  formatPoolRatio,
  formatRelativeDeadline,
  formatTokenAmount,
  shortenAddress,
} from "@/lib/format";
import { fetchMarket } from "@/lib/indexer";
import { hasContract, hasIndexer } from "@/lib/config";
import { mapIndexerError, mapRpcReadError } from "@/lib/errors";
import {
  categorizePosition,
  deriveMarketViewStatus,
  emptyPosition,
  outcomeLabel,
  sdkMarketToView,
  type IndexerMarket,
  type PortfolioCategory,
} from "@/lib/market-status";
import { getReadClient } from "@/lib/sdk";
import { useWallet } from "@/lib/wallet";
import type { Position } from "@resolve-protocol/sdk";
import { StatusBadgeFromView } from "./StatusBadge";
import { ClaimRefundActions, StakeForm } from "./StakeForm";
import { EmptyState, ErrorState, LoadingState } from "./States";

export function MarketDetail({ marketId }: { marketId: number }) {
  const wallet = useWallet();
  const [market, setMarket] = useState<IndexerMarket | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [claimable, setClaimable] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [positionError, setPositionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPositionError(null);

    try {
      let loaded: IndexerMarket | null = null;

      if (hasIndexer()) {
        try {
          loaded = await fetchMarket(marketId);
        } catch (err) {
          // Fall through to RPC if indexer fails and contract is configured
          if (!hasContract()) {
            const mapped = mapIndexerError(err);
            throw Object.assign(new Error(mapped.message), {
              title: mapped.title,
            });
          }
        }
      }

      if (!loaded && hasContract()) {
        try {
          const client = getReadClient();
          const onchain = await client.getMarket(marketId);
          loaded = {
            ...sdkMarketToView(onchain),
            createdTx: null,
            updatedAt: new Date().toISOString(),
          };
        } catch (err) {
          const mapped = mapRpcReadError(err);
          throw Object.assign(new Error(mapped.message), {
            title: mapped.title,
          });
        }
      }

      if (!loaded) {
        throw Object.assign(
          new Error(
            "Configure NEXT_PUBLIC_INDEXER_API_URL and/or NEXT_PUBLIC_RESOLVE_CONTRACT_ID + RPC to load markets. No fake data will be shown.",
          ),
          { title: "Market unavailable" },
        );
      }

      setMarket(loaded);

      if (wallet.address && hasContract()) {
        try {
          const client = getReadClient();
          const [pos, claim] = await Promise.all([
            client.getPosition(marketId, wallet.address),
            client.getClaimable(marketId, wallet.address).catch(() => null),
          ]);
          setPosition(pos);
          setClaimable(claim);
        } catch (err) {
          setPosition(emptyPosition());
          setClaimable(null);
          setPositionError(mapRpcReadError(err).message);
        }
      } else {
        setPosition(null);
        setClaimable(null);
      }
    } catch (err) {
      setMarket(null);
      setError({
        title:
          err && typeof err === "object" && "title" in err
            ? String((err as { title: string }).title)
            : "Failed to load market",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [marketId, wallet.address]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading market…" />;
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

  if (!market) {
    return (
      <EmptyState
        title="Market not found"
        description="No market with this id was returned by the indexer or contract."
      />
    );
  }

  const viewStatus = deriveMarketViewStatus(market.status, market.closeAt);
  const { yesPct, noPct, total } = formatPoolRatio(market.yesPool, market.noPool);
  const stakingOpen = viewStatus === "open";

  let category: PortfolioCategory | null = null;
  if (position && (position.yesAmount > 0n || position.noAmount > 0n)) {
    category = categorizePosition({
      marketStatus: viewStatus,
      outcome: market.outcome,
      yesAmount: position.yesAmount,
      noAmount: position.noAmount,
      claimed: position.claimed,
      claimable,
    });
  }

  const showClaim =
    category === "claimable" ||
    category === "won" ||
    (claimable !== null && claimable > 0n && !position?.claimed);
  const showRefund =
    category === "refundable" ||
    (viewStatus === "invalid" &&
      position &&
      !position.claimed &&
      (position.yesAmount > 0n || position.noAmount > 0n));

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-faint">#{market.id}</span>
          <StatusBadgeFromView status={viewStatus} />
          {market.outcome ? (
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              Result: {outcomeLabel(market.outcome)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-serif text-3xl leading-snug text-ink sm:text-4xl">
          {market.question?.trim() || `Market #${market.id}`}
        </h1>

        {market.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {market.description}
          </p>
        ) : null}

        <dl className="mt-8 grid gap-4 border-y border-ink-line py-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">
              Close time
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatDeadline(market.closeAt)}
              <span className="ml-2 text-ink-faint">
                ({formatRelativeDeadline(market.closeAt)})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">
              Resolver
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-ink">
              {shortenAddress(market.resolver, 6)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">
              Settlement token
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-ink">
              {shortenAddress(market.token, 6)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">
              Creator
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-ink">
              {shortenAddress(market.creator, 6)}
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <h2 className="font-serif text-xl text-ink">Pools</h2>
          <div className="mt-3 mb-1 flex justify-between text-xs uppercase tracking-wide text-ink-faint">
            <span>YES {yesPct.toFixed(1)}%</span>
            <span>NO {noPct.toFixed(1)}%</span>
          </div>
          <div className="flex h-2 overflow-hidden bg-paper-mute">
            <div className="bg-accent" style={{ width: `${yesPct}%` }} />
            <div className="bg-ink/40" style={{ width: `${noPct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-ink-faint">YES</div>
              <div className="font-medium text-ink">
                {formatTokenAmount(market.yesPool)}
              </div>
            </div>
            <div>
              <div className="text-ink-faint">NO</div>
              <div className="font-medium text-ink">
                {formatTokenAmount(market.noPool)}
              </div>
            </div>
            <div>
              <div className="text-ink-faint">Total</div>
              <div className="font-medium text-ink">
                {formatTokenAmount(total.toString())}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-serif text-xl text-ink">Your position</h2>
          {!wallet.address ? (
            <p className="mt-2 text-sm text-ink-soft">
              Connect a wallet to view your position.
            </p>
          ) : positionError ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {positionError}
            </p>
          ) : position ? (
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-ink-faint">YES stake</dt>
                <dd className="font-medium text-ink">
                  {formatTokenAmount(position.yesAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">NO stake</dt>
                <dd className="font-medium text-ink">
                  {formatTokenAmount(position.noAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Claimed</dt>
                <dd className="font-medium text-ink">
                  {position.claimed ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Claimable (RPC)</dt>
                <dd className="font-medium text-ink">
                  {claimable === null ? "—" : formatTokenAmount(claimable)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">No on-chain position.</p>
          )}
        </div>
      </div>

      <aside className="space-y-6 border-t border-ink-line pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        {stakingOpen ? (
          <StakeForm marketId={marketId} onSuccess={() => void load()} />
        ) : (
          <div className="border border-dashed border-ink-line p-4 text-sm text-ink-soft">
            Staking is closed for this market.
          </div>
        )}

        {showRefund ? (
          <ClaimRefundActions
            marketId={marketId}
            claimable={claimable}
            label="Refund"
            onSuccess={() => void load()}
          />
        ) : null}

        {showClaim && !showRefund ? (
          <ClaimRefundActions
            marketId={marketId}
            claimable={claimable}
            label="Claim"
            onSuccess={() => void load()}
          />
        ) : null}
      </aside>
    </div>
  );
}
