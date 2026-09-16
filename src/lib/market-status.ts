/**
 * Market / position categorization for portfolio and detail views.
 * Derived from on-chain or indexer fields — never invents outcomes.
 */

import { MarketStatus, Outcome, type Market, type Position } from "@resolve-protocol/sdk";

export type PortfolioCategory =
  | "open"
  | "won"
  | "lost"
  | "claimable"
  | "refundable"
  | "resolved";

export type MarketViewStatus =
  | "open"
  | "awaiting_resolution"
  | "resolved"
  | "invalid";

export type IndexerMarket = {
  id: number;
  creator: string;
  resolver: string;
  question: string | null;
  description: string | null;
  token: string;
  createdAt: number | null;
  closeAt: number;
  resolutionTimeout: number;
  yesPool: string;
  noPool: string;
  status: "open" | "resolved" | "invalid";
  outcome: "yes" | "no" | "invalid" | null;
  finalizedAt: number | null;
  createdTx: string | null;
  updatedAt: string;
};

export type IndexerPosition = {
  marketId: number;
  userAddress: string;
  yesAmount: string;
  noAmount: string;
  claimed: boolean;
  updatedAt: string;
};

function isOpenStatus(
  status: MarketStatus | IndexerMarket["status"],
): boolean {
  return status === MarketStatus.Open || status === "open";
}

function isResolvedStatus(
  status: MarketStatus | IndexerMarket["status"],
): boolean {
  return status === MarketStatus.Resolved || status === "resolved";
}

function isInvalidStatus(
  status: MarketStatus | IndexerMarket["status"],
): boolean {
  return status === MarketStatus.Invalid || status === "invalid";
}

function isYesOutcome(
  outcome: Outcome | "yes" | "no" | "invalid" | null | undefined,
): boolean {
  return outcome === Outcome.Yes || outcome === "yes";
}

function isNoOutcome(
  outcome: Outcome | "yes" | "no" | "invalid" | null | undefined,
): boolean {
  return outcome === Outcome.No || outcome === "no";
}

function isInvalidOutcome(
  outcome: Outcome | "yes" | "no" | "invalid" | null | undefined,
): boolean {
  return outcome === Outcome.Invalid || outcome === "invalid";
}

export function deriveMarketViewStatus(
  status: MarketStatus | IndexerMarket["status"],
  closeAt: number | bigint,
  nowSec: number = Math.floor(Date.now() / 1000),
): MarketViewStatus {
  const close = Number(closeAt);

  if (isResolvedStatus(status)) {
    return "resolved";
  }
  if (isInvalidStatus(status)) {
    return "invalid";
  }
  if (isOpenStatus(status) && nowSec >= close) {
    return "awaiting_resolution";
  }
  return "open";
}

export function marketStatusLabel(status: MarketViewStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "awaiting_resolution":
      return "Awaiting resolution";
    case "resolved":
      return "Resolved";
    case "invalid":
      return "Invalid";
  }
}

export function outcomeLabel(
  outcome: Outcome | "yes" | "no" | "invalid" | null | undefined,
): string {
  if (isYesOutcome(outcome)) return "YES";
  if (isNoOutcome(outcome)) return "NO";
  if (isInvalidOutcome(outcome)) return "Invalid";
  return "—";
}

/**
 * Categorize a user position for portfolio sections.
 * Claimable/refundable require settlement eligibility; when claimable amount
 * is unknown we use market outcome + claimed flag as a best-effort label and
 * still require an on-chain claim call.
 */
export function categorizePosition(input: {
  marketStatus: MarketViewStatus;
  outcome: Outcome | "yes" | "no" | "invalid" | null;
  yesAmount: bigint;
  noAmount: bigint;
  claimed: boolean;
  claimable?: bigint | null;
}): PortfolioCategory {
  const { marketStatus, outcome, yesAmount, noAmount, claimed, claimable } =
    input;

  if (yesAmount === 0n && noAmount === 0n) {
    return "resolved";
  }

  if (marketStatus === "open" || marketStatus === "awaiting_resolution") {
    return "open";
  }

  if (claimed) {
    return "resolved";
  }

  if (claimable !== undefined && claimable !== null) {
    if (claimable > 0n) {
      const isRefund =
        marketStatus === "invalid" || isInvalidOutcome(outcome);
      return isRefund ? "refundable" : "claimable";
    }
    if (marketStatus === "resolved") {
      return isWinningSide(outcome, yesAmount, noAmount) ? "claimable" : "lost";
    }
    if (marketStatus === "invalid") {
      return "refundable";
    }
  }

  if (marketStatus === "invalid") {
    return "refundable";
  }

  if (marketStatus === "resolved") {
    if (isWinningSide(outcome, yesAmount, noAmount)) {
      return "won";
    }
    if (hasLosingOnly(outcome, yesAmount, noAmount)) {
      return "lost";
    }
    return "claimable";
  }

  return "resolved";
}

function isWinningSide(
  outcome: Outcome | "yes" | "no" | "invalid" | null,
  yesAmount: bigint,
  noAmount: bigint,
): boolean {
  if (isYesOutcome(outcome)) {
    return yesAmount > 0n;
  }
  if (isNoOutcome(outcome)) {
    return noAmount > 0n;
  }
  return false;
}

function hasLosingOnly(
  outcome: Outcome | "yes" | "no" | "invalid" | null,
  yesAmount: bigint,
  noAmount: bigint,
): boolean {
  if (isYesOutcome(outcome)) {
    return yesAmount === 0n && noAmount > 0n;
  }
  if (isNoOutcome(outcome)) {
    return noAmount === 0n && yesAmount > 0n;
  }
  return false;
}

export function sdkMarketToView(market: Market) {
  return {
    id: Number(market.id),
    creator: market.creator,
    resolver: market.resolver,
    question: market.question,
    description: market.description,
    token: market.token,
    createdAt: Number(market.createdAt),
    closeAt: Number(market.closeAt),
    resolutionTimeout: Number(market.resolutionTimeout),
    yesPool: market.yesPool.toString(),
    noPool: market.noPool.toString(),
    status:
      market.status === MarketStatus.Open
        ? ("open" as const)
        : market.status === MarketStatus.Resolved
          ? ("resolved" as const)
          : ("invalid" as const),
    outcome:
      market.outcome === null
        ? null
        : market.outcome === Outcome.Yes
          ? ("yes" as const)
          : market.outcome === Outcome.No
            ? ("no" as const)
            : ("invalid" as const),
    finalizedAt: market.finalizedAt === null ? null : Number(market.finalizedAt),
  };
}

export function emptyPosition(): Position {
  return { yesAmount: 0n, noAmount: 0n, claimed: false };
}
