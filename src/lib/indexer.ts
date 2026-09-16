/**
 * Indexer HTTP client for discovery/list reads.
 * Indexer is never authority for settlement — claim/stake always go through SDK → RPC.
 */

import { getAppConfig, hasIndexer } from "./config";
import { mapIndexerError } from "./errors";
import type { IndexerMarket, IndexerPosition } from "./market-status";

export class IndexerRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "IndexerRequestError";
    this.status = status;
  }
}

function baseUrl(): string {
  const url = getAppConfig().indexerApiUrl.replace(/\/$/, "");
  if (!url) {
    throw new IndexerRequestError(
      "NEXT_PUBLIC_INDEXER_API_URL is not configured.",
    );
  }
  return url;
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    const mapped = mapIndexerError(err);
    throw new IndexerRequestError(mapped.message);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // ignore
    }
    throw new IndexerRequestError(
      `Indexer returned ${res.status}: ${detail}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export type MarketsListResponse = {
  markets: IndexerMarket[];
  nextCursor: number | null;
};

export type MarketResponse = {
  market: IndexerMarket;
};

export type UserPositionsResponse = {
  address: string;
  positions: IndexerPosition[];
};

export async function fetchMarkets(opts?: {
  status?: "open" | "resolved" | "invalid";
  limit?: number;
  cursor?: number;
}): Promise<MarketsListResponse> {
  if (!hasIndexer()) {
    throw new IndexerRequestError(
      "Indexer URL is not configured. Set NEXT_PUBLIC_INDEXER_API_URL.",
    );
  }
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.cursor !== undefined) params.set("cursor", String(opts.cursor));
  const qs = params.toString();
  return getJson<MarketsListResponse>(`/markets${qs ? `?${qs}` : ""}`);
}

export async function fetchMarket(id: number | string): Promise<IndexerMarket> {
  if (!hasIndexer()) {
    throw new IndexerRequestError(
      "Indexer URL is not configured. Set NEXT_PUBLIC_INDEXER_API_URL.",
    );
  }
  const data = await getJson<MarketResponse>(`/markets/${id}`);
  return data.market;
}

export async function fetchUserPositions(
  address: string,
): Promise<IndexerPosition[]> {
  if (!hasIndexer()) {
    throw new IndexerRequestError(
      "Indexer URL is not configured. Set NEXT_PUBLIC_INDEXER_API_URL.",
    );
  }
  const data = await getJson<UserPositionsResponse>(
    `/users/${encodeURIComponent(address)}/positions`,
  );
  return data.positions;
}

export async function fetchIndexerHealth(): Promise<{
  status: string;
  cursor: string | null;
  lastIngestAt: string | null;
}> {
  return getJson("/health");
}
