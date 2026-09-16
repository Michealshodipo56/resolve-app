/**
 * Resolve SDK client factory for browser and server components.
 * Writes and authoritative reads go through the SDK → Soroban RPC.
 */

import {
  ResolveClient,
  type ResolveClientOptions,
  type TxMethodOptions,
} from "@resolve-protocol/sdk";
import { assertWriteConfig, getAppConfig } from "./config";

export type AssembledLike = {
  // Compatible with stellar-sdk AssembledTransaction.signAndSend without
  // forcing exact optional parameter contravariance against `unknown`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signAndSend?: (...args: any[]) => Promise<any>;
  toXDR?: () => string;
  built?: { toXDR?: () => string };
  simulationData?: unknown;
  result?: unknown;
};

let readClient: ResolveClient | null = null;

export function getNetworkOptions(): ResolveClientOptions {
  const config = getAppConfig();
  assertWriteConfig(config);
  return {
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
    contractId: config.contractId,
    horizonUrl: config.horizonUrl || undefined,
  };
}

/** Shared read-only client (no signer). */
export function getReadClient(): ResolveClient {
  if (!readClient) {
    readClient = new ResolveClient(getNetworkOptions());
  }
  return readClient;
}

/** Fresh client bound to the connected wallet signer. */
export function createWriteClient(
  publicKey: string,
  signTransaction: NonNullable<ResolveClientOptions["signTransaction"]>,
  signAuthEntry?: ResolveClientOptions["signAuthEntry"],
): ResolveClient {
  return new ResolveClient({
    ...getNetworkOptions(),
    publicKey,
    signTransaction,
    signAuthEntry,
  });
}

export function defaultTxOptions(
  overrides?: TxMethodOptions,
): TxMethodOptions {
  return {
    simulate: true,
    ...overrides,
  };
}

/**
 * Submit an assembled transaction. Prefers signAndSend when the SDK/wallet
 * wiring supports it; otherwise signs XDR via the provided wallet callback.
 */
export async function submitAssembled(
  tx: AssembledLike,
  signAndSubmit: (xdr: string) => Promise<string>,
): Promise<{ hash: string }> {
  if (typeof tx.signAndSend === "function") {
    const result = await tx.signAndSend();
    const hash =
      (result && typeof result === "object" && "hash" in result
        ? String((result as { hash?: string }).hash ?? "")
        : "") || "";
    if (!hash) {
      throw new Error("Transaction submitted but no hash was returned.");
    }
    return { hash };
  }

  const xdr =
    (typeof tx.toXDR === "function" ? tx.toXDR() : undefined) ??
    (typeof tx.built?.toXDR === "function" ? tx.built.toXDR() : undefined);

  if (!xdr) {
    throw new Error(
      "Assembled transaction has no XDR. Ensure the Resolve SDK build exposes toXDR or signAndSend.",
    );
  }

  const hash = await signAndSubmit(xdr);
  return { hash };
}
