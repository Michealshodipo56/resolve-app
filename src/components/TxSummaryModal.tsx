"use client";

import type { TxPhase, TxSummary } from "@/lib/tx";
import type { TxUiError } from "@/lib/errors";

export function TxSummaryModal({
  open,
  phase,
  summary,
  error,
  hash,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  phase: TxPhase;
  summary: TxSummary | null;
  error: TxUiError | null;
  hash: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || !summary) return null;

  const busy = phase === "signing" || phase === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-summary-title"
    >
      <div className="w-full max-w-md border border-ink-line bg-paper p-6 shadow-lg">
        <h2 id="tx-summary-title" className="font-serif text-2xl text-ink">
          {phase === "confirmed"
            ? "Confirmed"
            : phase === "error"
              ? "Failed"
              : summary.title}
        </h2>

        {phase === "review" || phase === "signing" || phase === "pending" ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Review what you are about to sign. Nothing is submitted until you
              confirm in your wallet.
            </p>
            <dl className="mt-5 space-y-3 border-y border-ink-line py-4">
              {summary.lines.map((line) => (
                <div
                  key={line.label}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <dt className="text-ink-faint">{line.label}</dt>
                  <dd className="max-w-[60%] break-all text-right font-medium text-ink">
                    {line.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {phase === "signing" ? (
          <p className="mt-4 text-sm text-ink-soft">Waiting for wallet signature…</p>
        ) : null}
        {phase === "pending" ? (
          <p className="mt-4 text-sm text-ink-soft">Submitting and confirming…</p>
        ) : null}

        {phase === "confirmed" && hash ? (
          <p className="mt-4 break-all font-mono text-xs text-ink-soft">
            Tx hash: {hash}
          </p>
        ) : null}

        {phase === "error" && error ? (
          <div className="mt-4 border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <div className="font-medium">{error.title}</div>
            <p className="mt-1 text-ink-soft">{error.message}</p>
            {error.code ? (
              <p className="mt-1 font-mono text-xs">{error.code}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          {phase === "review" ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 text-sm text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accent-hover"
              >
                Sign in wallet
              </button>
            </>
          ) : null}
          {busy ? (
            <button
              type="button"
              disabled
              className="bg-ink-line px-4 py-2 text-sm text-ink-faint"
            >
              {phase === "signing" ? "Signing…" : "Confirming…"}
            </button>
          ) : null}
          {phase === "confirmed" || phase === "error" ? (
            <button
              type="button"
              onClick={onCancel}
              className="bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accent-hover"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
