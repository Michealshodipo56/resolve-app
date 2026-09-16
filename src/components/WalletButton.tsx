"use client";

import { useWallet } from "@/lib/wallet";
import { shortenAddress } from "@/lib/format";

export function WalletButton() {
  const { status, address, connect, disconnect, error, clearError } = useWallet();

  if (status === "connecting") {
    return (
      <button
        type="button"
        disabled
        className="rounded-sm border border-ink-line bg-paper-elev px-3 py-2 text-sm text-ink-faint"
      >
        Connecting…
      </button>
    );
  }

  if (status === "connected" && address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden font-mono text-xs text-ink-soft sm:inline"
          title={address}
        >
          {shortenAddress(address, 5)}
        </span>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="rounded-sm border border-ink-line bg-paper-elev px-3 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          clearError();
          void connect();
        }}
        className="rounded-sm bg-accent px-3 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-hover"
      >
        Connect wallet
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-danger" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
