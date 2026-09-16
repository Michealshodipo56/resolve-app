import { describe, expect, it } from "vitest";
import {
  bytesLength,
  formatPoolRatio,
  formatTokenAmount,
  shortenAddress,
} from "@/lib/format";
import {
  categorizePosition,
  deriveMarketViewStatus,
  outcomeLabel,
} from "@/lib/market-status";

describe("formatTokenAmount", () => {
  it("formats contract-scale amounts with defaults", () => {
    expect(formatTokenAmount(15_000_000n)).toBe("1.5");
    expect(formatTokenAmount("10000000")).toBe("1");
    expect(formatTokenAmount(0n)).toBe("0");
  });

  it("returns em dash for empty input", () => {
    expect(formatTokenAmount(null)).toBe("—");
    expect(formatTokenAmount(undefined)).toBe("—");
  });
});

describe("formatPoolRatio", () => {
  it("splits 50/50 when empty", () => {
    expect(formatPoolRatio(0n, 0n)).toEqual({
      yesPct: 50,
      noPct: 50,
      total: 0n,
    });
  });

  it("computes percentages from pools", () => {
    const r = formatPoolRatio(1000n, 500n);
    expect(r.total).toBe(1500n);
    expect(r.yesPct).toBeCloseTo(66.66, 1);
  });
});

describe("shortenAddress", () => {
  it("shortens long addresses", () => {
    const addr = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    expect(shortenAddress(addr, 4)).toMatch(/GAAA…AWHF/);
  });
});

describe("bytesLength", () => {
  it("counts utf-8 bytes", () => {
    expect(bytesLength("hi")).toBe(2);
    expect(bytesLength("é")).toBe(2);
  });
});

describe("market status helpers", () => {
  it("derives awaiting_resolution after close while open", () => {
    expect(deriveMarketViewStatus("open", 100, 200)).toBe("awaiting_resolution");
    expect(deriveMarketViewStatus("open", 300, 200)).toBe("open");
    expect(deriveMarketViewStatus("resolved", 100, 200)).toBe("resolved");
  });

  it("labels outcomes", () => {
    expect(outcomeLabel("yes")).toBe("YES");
    expect(outcomeLabel("invalid")).toBe("Invalid");
    expect(outcomeLabel(null)).toBe("—");
  });

  it("categorizes portfolio positions", () => {
    expect(
      categorizePosition({
        marketStatus: "open",
        outcome: null,
        yesAmount: 10n,
        noAmount: 0n,
        claimed: false,
      }),
    ).toBe("open");

    expect(
      categorizePosition({
        marketStatus: "resolved",
        outcome: "yes",
        yesAmount: 10n,
        noAmount: 0n,
        claimed: false,
        claimable: 15n,
      }),
    ).toBe("claimable");

    expect(
      categorizePosition({
        marketStatus: "resolved",
        outcome: "yes",
        yesAmount: 0n,
        noAmount: 10n,
        claimed: false,
        claimable: 0n,
      }),
    ).toBe("lost");

    expect(
      categorizePosition({
        marketStatus: "invalid",
        outcome: "invalid",
        yesAmount: 5n,
        noAmount: 0n,
        claimed: false,
        claimable: 5n,
      }),
    ).toBe("refundable");
  });
});
