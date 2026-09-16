/**
 * Human-readable error mapping for wallet, network, and contract failures.
 * Never invents financial data — only maps known error shapes to UI copy.
 */

import { parseResolveError } from "@resolve-protocol/sdk";

export type TxUiErrorKind =
  | "disconnected"
  | "connecting"
  | "wrong_network"
  | "rejected"
  | "failed"
  | "pending"
  | "insufficient_balance"
  | "contract"
  | "config"
  | "indexer"
  | "rpc"
  | "unknown";

export type TxUiError = {
  kind: TxUiErrorKind;
  title: string;
  message: string;
  code?: string;
};

export function mapWalletError(err: unknown): TxUiError {
  const text = errorText(err).toLowerCase();

  if (
    text.includes("user rejected") ||
    text.includes("user denied") ||
    text.includes("rejected by user") ||
    text.includes("cancelled") ||
    text.includes("canceled")
  ) {
    return {
      kind: "rejected",
      title: "Signature rejected",
      message: "You rejected the request in your wallet. No transaction was submitted.",
    };
  }

  if (
    text.includes("wrong network") ||
    text.includes("incorrect network") ||
    text.includes("network mismatch") ||
    text.includes("passphrase")
  ) {
    return {
      kind: "wrong_network",
      title: "Wrong network",
      message:
        "Your wallet is on a different Stellar network than this app. Switch network and try again.",
    };
  }

  if (
    text.includes("insufficient") ||
    text.includes("balance too low") ||
    text.includes("underfunded")
  ) {
    return {
      kind: "insufficient_balance",
      title: "Insufficient balance",
      message:
        "Your account does not have enough tokens (or XLM for fees) to complete this action.",
    };
  }

  const contract = parseResolveError(err);
  if (contract) {
    return {
      kind: "contract",
      title: "Contract rejected the transaction",
      message: contract.message,
      code: contract.code,
    };
  }

  if (text.includes("failed to fetch") || text.includes("networkerror") || text.includes("rpc")) {
    return {
      kind: "rpc",
      title: "Network request failed",
      message:
        "Could not reach the Soroban RPC endpoint. Check NEXT_PUBLIC_SOROBAN_RPC_URL and your connection.",
    };
  }

  return {
    kind: "unknown",
    title: "Transaction failed",
    message: errorText(err) || "An unexpected error occurred.",
  };
}

export function mapIndexerError(err: unknown): TxUiError {
  return {
    kind: "indexer",
    title: "Indexer unavailable",
    message:
      errorText(err) ||
      "Could not load markets from the indexer. Settlement state is never taken from the indexer — fix INDEXER_API_URL or try again.",
  };
}

export function mapRpcReadError(err: unknown): TxUiError {
  const contract = parseResolveError(err);
  if (contract) {
    return {
      kind: "contract",
      title: "Contract read failed",
      message: contract.message,
      code: contract.code,
    };
  }
  return {
    kind: "rpc",
    title: "Could not read on-chain state",
    message:
      errorText(err) ||
      "RPC request failed. This app will not show invented balances or pools.",
  };
}

function errorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
