/**
 * Display formatting helpers (pure; safe for unit tests).
 */

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function formatTokenAmount(
  amount: bigint | string | number | null | undefined,
  decimals = 7,
  options?: { maxFrac?: number },
): string {
  if (amount === null || amount === undefined || amount === "") return "—";

  let value: bigint;
  try {
    value = typeof amount === "bigint" ? amount : BigInt(String(amount));
  } catch {
    return "—";
  }

  const negative = value < 0n;
  const abs = negative ? -value : value;
  const factor = 10n ** BigInt(decimals);
  const whole = abs / factor;
  const frac = abs % factor;
  const maxFrac = options?.maxFrac ?? Math.min(decimals, 4);

  let fracStr = frac.toString().padStart(decimals, "0");
  if (maxFrac < decimals) {
    fracStr = fracStr.slice(0, maxFrac);
  }
  fracStr = fracStr.replace(/0+$/, "");

  const body =
    fracStr.length > 0
      ? `${whole.toLocaleString("en-US")}.${fracStr}`
      : whole.toLocaleString("en-US");

  return negative ? `-${body}` : body;
}

export function formatPoolRatio(
  yesPool: bigint | string,
  noPool: bigint | string,
): { yesPct: number; noPct: number; total: bigint } {
  const yes = typeof yesPool === "bigint" ? yesPool : BigInt(yesPool || "0");
  const no = typeof noPool === "bigint" ? noPool : BigInt(noPool || "0");
  const total = yes + no;
  if (total === 0n) {
    return { yesPct: 50, noPct: 50, total };
  }
  const yesPct = Number((yes * 10000n) / total) / 100;
  const noPct = Math.round((100 - yesPct) * 100) / 100;
  return { yesPct, noPct, total };
}

export function formatDeadline(unixSeconds: number | bigint | string): string {
  const secs = Number(unixSeconds);
  if (!Number.isFinite(secs) || secs <= 0) return "—";
  const date = new Date(secs * 1000);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

export function formatRelativeDeadline(
  unixSeconds: number | bigint | string,
  nowMs: number = Date.now(),
): string {
  const secs = Number(unixSeconds);
  if (!Number.isFinite(secs)) return "—";
  const diffMs = secs * 1000 - nowMs;
  const abs = Math.abs(diffMs);
  const mins = Math.floor(abs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let unit: string;
  if (days > 0) unit = `${days}d`;
  else if (hours > 0) unit = `${hours}h`;
  else if (mins > 0) unit = `${mins}m`;
  else unit = "<1m";

  return diffMs >= 0 ? `in ${unit}` : `${unit} ago`;
}

export function bytesLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
