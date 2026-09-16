"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatTokenAmount } from "@/lib/format";
import { stakeSchema } from "@/lib/validation";
import { sideFromInput, stakeAmountToContract, useTxFlow } from "@/lib/tx";
import { useWallet } from "@/lib/wallet";
import { TxSummaryModal } from "./TxSummaryModal";

export function StakeForm({
  marketId,
  disabled,
  onSuccess,
}: {
  marketId: number;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const wallet = useWallet();
  const tx = useTxFlow();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const connected = wallet.status === "connected" && Boolean(wallet.address);

  const modalOpen = tx.phase !== "idle";

  const canSubmit = useMemo(
    () => connected && !disabled && amount.trim().length > 0,
    [connected, disabled, amount],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = stakeSchema.safeParse({ side, amount });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid stake");
      return;
    }
    if (!wallet.address) {
      setFormError("Connect a wallet to stake.");
      return;
    }

    const contractAmount = stakeAmountToContract(parsed.data.amount, tx.decimals);
    const sdkSide = sideFromInput(parsed.data.side);

    tx.requestReview({
      summary: {
        title: "Stake on market",
        lines: [
          { label: "Market", value: `#${marketId}` },
          { label: "Side", value: parsed.data.side.toUpperCase() },
          {
            label: "Amount",
            value: `${parsed.data.amount} (contract: ${contractAmount.toString()})`,
          },
          { label: "Account", value: wallet.address },
        ],
      },
      build: async (client) =>
        client.stake({
          user: wallet.address!,
          marketId,
          side: sdkSide,
          amount: contractAmount,
        }),
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={disabled || tx.phase === "signing" || tx.phase === "pending"}>
          <legend className="font-serif text-xl text-ink">Stake</legend>
          <p className="mt-1 text-sm text-ink-soft">
            Deposit settlement tokens into YES or NO. You may stake both sides.
          </p>

          <div className="mt-4 flex gap-2" role="group" aria-label="Side">
            {(["yes", "no"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 border px-3 py-2 text-sm font-medium uppercase tracking-wide ${
                  side === s
                    ? "border-accent bg-accent text-paper"
                    : "border-ink-line text-ink-soft hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-ink-faint">Amount</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>

          {formError ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}

          {!connected ? (
            <p className="mt-3 text-sm text-ink-soft">Connect a wallet to stake.</p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 w-full bg-accent px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-ink-line disabled:text-ink-faint"
          >
            Review stake
          </button>
        </fieldset>
      </form>

      <TxSummaryModal
        open={modalOpen}
        phase={tx.phase}
        summary={tx.summary}
        error={tx.error}
        hash={tx.hash}
        onConfirm={() => void tx.confirm()}
        onCancel={() => {
          const wasConfirmed = tx.phase === "confirmed";
          tx.cancel();
          if (wasConfirmed) onSuccess?.();
        }}
      />
    </>
  );
}

export function ClaimRefundActions({
  marketId,
  claimable,
  label,
  onSuccess,
}: {
  marketId: number;
  claimable: bigint | null;
  label: "Claim" | "Refund";
  onSuccess?: () => void;
}) {
  const wallet = useWallet();
  const tx = useTxFlow();
  const modalOpen = tx.phase !== "idle";

  function onClick() {
    if (!wallet.address) return;
    tx.requestReview({
      summary: {
        title: label === "Refund" ? "Claim refund" : "Claim payout",
        lines: [
          { label: "Market", value: `#${marketId}` },
          {
            label: "Estimated claimable",
            value:
              claimable === null
                ? "Unavailable (RPC)"
                : formatTokenAmount(claimable),
          },
          { label: "Account", value: wallet.address },
          {
            label: "Note",
            value:
              "Final amount is determined on-chain. Indexer estimates are not authoritative.",
          },
        ],
      },
      build: async (client) =>
        client.claim({ user: wallet.address!, marketId }),
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={wallet.status !== "connected"}
        className="w-full border border-accent bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-paper disabled:cursor-not-allowed disabled:border-ink-line disabled:bg-paper-mute disabled:text-ink-faint"
      >
        {label}
      </button>
      <TxSummaryModal
        open={modalOpen}
        phase={tx.phase}
        summary={tx.summary}
        error={tx.error}
        hash={tx.hash}
        onConfirm={() => void tx.confirm()}
        onCancel={() => {
          const wasConfirmed = tx.phase === "confirmed";
          tx.cancel();
          if (wasConfirmed) onSuccess?.();
        }}
      />
    </>
  );
}
