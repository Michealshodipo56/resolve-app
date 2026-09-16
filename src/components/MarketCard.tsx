import Link from "next/link";
import {
  formatDeadline,
  formatPoolRatio,
  formatRelativeDeadline,
  formatTokenAmount,
} from "@/lib/format";
import type { IndexerMarket } from "@/lib/market-status";
import { StatusBadge } from "./StatusBadge";

export function MarketCard({ market }: { market: IndexerMarket }) {
  const { yesPct, noPct, total } = formatPoolRatio(market.yesPool, market.noPool);
  const question = market.question?.trim() || `Market #${market.id}`;

  return (
    <article className="border-b border-ink-line py-6 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">#{market.id}</span>
            <StatusBadge market={market} />
          </div>
          <h2 className="font-serif text-2xl leading-snug text-ink">
            <Link
              href={`/markets/${market.id}`}
              className="transition-colors hover:text-accent"
            >
              {question}
            </Link>
          </h2>
        </div>
        <div className="text-right text-sm text-ink-soft">
          <div>Closes {formatRelativeDeadline(market.closeAt)}</div>
          <div className="text-xs text-ink-faint">{formatDeadline(market.closeAt)}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wide text-ink-faint">
            <span>YES {yesPct.toFixed(1)}%</span>
            <span>NO {noPct.toFixed(1)}%</span>
          </div>
          <div
            className="flex h-2 overflow-hidden bg-paper-mute"
            role="img"
            aria-label={`YES ${yesPct.toFixed(1)} percent, NO ${noPct.toFixed(1)} percent`}
          >
            <div className="bg-accent" style={{ width: `${yesPct}%` }} />
            <div className="bg-ink/40" style={{ width: `${noPct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-soft">
            <span>
              YES pool{" "}
              <strong className="font-medium text-ink">
                {formatTokenAmount(market.yesPool)}
              </strong>
            </span>
            <span>
              NO pool{" "}
              <strong className="font-medium text-ink">
                {formatTokenAmount(market.noPool)}
              </strong>
            </span>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs uppercase tracking-wide text-ink-faint">Total</div>
          <div className="font-serif text-xl text-ink">
            {formatTokenAmount(total.toString())}
          </div>
        </div>
      </div>
    </article>
  );
}
