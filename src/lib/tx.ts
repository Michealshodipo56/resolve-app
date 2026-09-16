"use client";

import { useCallback, useState } from "react";
import { Side, toContractAmount } from "@resolve-protocol/sdk";
import { getAppConfig } from "./config";
import { mapWalletError, type TxUiError } from "./errors";
import type { AssembledLike } from "./sdk";
import { createWriteClient } from "./sdk";
import { useWallet } from "./wallet";

export type TxPhase =
  | "idle"
  | "review"
  | "signing"
  | "pending"
  | "confirmed"
  | "error";

export type TxSummary = {
  title: string;
  lines: { label: string; value: string }[];
};

type WriteClient = ReturnType<typeof createWriteClient>;

export type PendingTx = {
  summary: TxSummary;
  /** Build assembled tx with a write-capable ResolveClient already configured. */
  build: (client: WriteClient) => Promise<AssembledLike>;
};

export function useTxFlow() {
  const wallet = useWallet();
  const config = getAppConfig();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [summary, setSummary] = useState<TxSummary | null>(null);
  const [error, setError] = useState<TxUiError | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingTx | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setSummary(null);
    setError(null);
    setHash(null);
    setPending(null);
  }, []);

  const requestReview = useCallback(
    (tx: PendingTx) => {
      if (wallet.status !== "connected" || !wallet.address) {
        setError({
          kind: "disconnected",
          title: "Wallet disconnected",
          message: "Connect a Stellar wallet before signing.",
        });
        setPhase("error");
        return;
      }
      setError(null);
      setHash(null);
      setPending(tx);
      setSummary(tx.summary);
      setPhase("review");
    },
    [wallet.status, wallet.address],
  );

  const confirm = useCallback(async () => {
    if (!pending || !wallet.address) return;
    setPhase("signing");
    setError(null);

    try {
      const client = createWriteClient(wallet.address, async (xdr) => {
        const signed = await wallet.signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress,
        };
      });

      const assembled = await pending.build(client);
      setPhase("pending");

      if (typeof assembled.signAndSend !== "function") {
        throw new Error(
          "SDK transaction does not support signAndSend. Rebuild @resolve-protocol/sdk.",
        );
      }

      const result = await assembled.signAndSend();
      const txHash =
        result && typeof result === "object" && "hash" in result
          ? String((result as { hash?: string }).hash ?? "")
          : "";

      if (!txHash) {
        throw new Error("Transaction submitted but no hash was returned.");
      }

      setHash(txHash);
      setPhase("confirmed");
    } catch (err) {
      setError(mapWalletError(err));
      setPhase("error");
    }
  }, [pending, wallet]);

  return {
    phase,
    summary,
    error,
    hash,
    requestReview,
    confirm,
    cancel: reset,
    reset,
    address: wallet.address,
    walletStatus: wallet.status,
    decimals: config.tokenDecimals,
  };
}

export function stakeAmountToContract(amount: string, decimals: number): bigint {
  return toContractAmount(amount, decimals);
}

export function sideFromInput(side: "yes" | "no"): Side {
  return side === "yes" ? Side.Yes : Side.No;
}
