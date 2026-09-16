"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createMarketSchema, resolveTokenId } from "@/lib/validation";
import { getAppConfig } from "@/lib/config";
import { useTxFlow } from "@/lib/tx";
import { useWallet } from "@/lib/wallet";
import { bytesLength } from "@/lib/format";
import { CONTRACT_LIMITS } from "@resolve-protocol/sdk";
import { TxSummaryModal } from "./TxSummaryModal";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateMarketForm() {
  const wallet = useWallet();
  const tx = useTxFlow();
  const router = useRouter();
  const config = getAppConfig();

  const defaultClose = useMemo(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return toLocalInputValue(d);
  }, []);

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [resolver, setResolver] = useState("");
  const [token, setToken] = useState(config.settlementTokenId);
  const [closeAtLocal, setCloseAtLocal] = useState(defaultClose);
  const [resolutionTimeoutHours, setResolutionTimeoutHours] = useState(72);
  const [formError, setFormError] = useState<string | null>(null);

  const modalOpen = tx.phase !== "idle";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!wallet.address) {
      setFormError("Connect a wallet to create a market.");
      return;
    }

    const parsed = createMarketSchema.safeParse({
      question,
      description,
      resolver: resolver || wallet.address,
      token,
      closeAtLocal,
      resolutionTimeoutHours,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    let tokenId: string;
    try {
      tokenId = resolveTokenId(parsed.data.token);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid token");
      return;
    }

    const closeAt = Math.floor(Date.parse(parsed.data.closeAtLocal) / 1000);
    const resolutionTimeout = Math.floor(
      parsed.data.resolutionTimeoutHours * 3600,
    );

    tx.requestReview({
      summary: {
        title: "Create market",
        lines: [
          { label: "Question", value: parsed.data.question },
          { label: "Resolver", value: parsed.data.resolver },
          { label: "Token", value: tokenId },
          { label: "Close at (unix)", value: String(closeAt) },
          {
            label: "Resolution timeout",
            value: `${resolutionTimeout}s (${parsed.data.resolutionTimeoutHours}h)`,
          },
          { label: "Creator", value: wallet.address },
        ],
      },
      build: async (client) =>
        client.createMarket({
          creator: wallet.address!,
          resolver: parsed.data.resolver,
          question: parsed.data.question,
          description: parsed.data.description,
          token: tokenId,
          closeAt,
          resolutionTimeout,
        }),
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
        <div>
          <h1 className="font-serif text-4xl text-ink">Create market</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Parameters are validated against contract limits before you sign.
          </p>
        </div>

        <label className="block text-sm">
          <span className="flex justify-between text-ink-faint">
            <span>Question</span>
            <span>
              {bytesLength(question)}/{CONTRACT_LIMITS.MAX_QUESTION_LEN} bytes
            </span>
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            required
            className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="flex justify-between text-ink-faint">
            <span>Description</span>
            <span>
              {bytesLength(description)}/{CONTRACT_LIMITS.MAX_DESCRIPTION_LEN}{" "}
              bytes
            </span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="text-ink-faint">Resolver address</span>
          <input
            value={resolver}
            onChange={(e) => setResolver(e.target.value)}
            placeholder={wallet.address ?? "G…"}
            className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Defaults to your connected wallet if left blank.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-ink-faint">Settlement token (C…)</span>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="C…"
            className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-ink-faint">Staking closes</span>
            <input
              type="datetime-local"
              value={closeAtLocal}
              onChange={(e) => setCloseAtLocal(e.target.value)}
              required
              className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-faint">Resolution timeout (hours)</span>
            <input
              type="number"
              min={1}
              max={365 * 24}
              value={resolutionTimeoutHours}
              onChange={(e) => setResolutionTimeoutHours(Number(e.target.value))}
              className="mt-1 w-full border border-ink-line bg-paper-elev px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
        </div>

        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}

        {wallet.status !== "connected" ? (
          <p className="text-sm text-ink-soft">Connect a wallet to continue.</p>
        ) : null}

        <button
          type="submit"
          disabled={wallet.status !== "connected"}
          className="w-full bg-accent px-4 py-2.5 text-sm font-medium text-paper hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-ink-line disabled:text-ink-faint"
        >
          Review &amp; create
        </button>
      </form>

      <TxSummaryModal
        open={modalOpen}
        phase={tx.phase}
        summary={tx.summary}
        error={tx.error}
        hash={tx.hash}
        onConfirm={() => void tx.confirm()}
        onCancel={() => {
          const done = tx.phase === "confirmed";
          tx.cancel();
          if (done) router.push("/");
        }}
      />
    </>
  );
}
