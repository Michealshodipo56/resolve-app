/**
 * Create-market and stake form validation (mirrors contract limits).
 */

import { CONTRACT_LIMITS } from "@resolve-protocol/sdk";
import { z } from "zod";
import { getAppConfig } from "./config";
import { bytesLength } from "./format";

const STELLAR_ADDRESS = /^G[A-Z0-9]{55}$/;
const CONTRACT_ADDRESS = /^C[A-Z0-9]{55}$/;

export const createMarketSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, "Question is required")
      .refine(
        (v) => bytesLength(v) <= CONTRACT_LIMITS.MAX_QUESTION_LEN,
        `Question must be ≤ ${CONTRACT_LIMITS.MAX_QUESTION_LEN} bytes`,
      ),
    description: z
      .string()
      .trim()
      .refine(
        (v) => bytesLength(v) <= CONTRACT_LIMITS.MAX_DESCRIPTION_LEN,
        `Description must be ≤ ${CONTRACT_LIMITS.MAX_DESCRIPTION_LEN} bytes`,
      ),
    resolver: z
      .string()
      .trim()
      .regex(STELLAR_ADDRESS, "Resolver must be a valid G… address"),
    token: z.string().trim(),
    closeAtLocal: z.string().min(1, "Close time is required"),
    resolutionTimeoutHours: z.coerce
      .number()
      .min(1, "Resolution timeout must be at least 1 hour")
      .max(365 * 24, "Resolution timeout cannot exceed 365 days"),
  })
  .superRefine((data, ctx) => {
    const closeMs = Date.parse(data.closeAtLocal);
    if (!Number.isFinite(closeMs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeAtLocal"],
        message: "Invalid close time",
      });
      return;
    }
    const closeAt = Math.floor(closeMs / 1000);
    const now = Math.floor(Date.now() / 1000);
    const minClose = now + Number(CONTRACT_LIMITS.MIN_MARKET_DURATION_SECS);
    if (closeAt < minClose) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeAtLocal"],
        message: `Close time must be at least ${CONTRACT_LIMITS.MIN_MARKET_DURATION_SECS}s from now`,
      });
    }
  });

export type CreateMarketInput = z.infer<typeof createMarketSchema>;

export function resolveTokenId(inputToken?: string): string {
  const config = getAppConfig();
  const token = (inputToken || "").trim() || config.settlementTokenId;
  if (!token) {
    throw new Error(
      "Settlement token is required. Set NEXT_PUBLIC_SETTLEMENT_TOKEN_ID or enter a token contract ID.",
    );
  }
  if (!CONTRACT_ADDRESS.test(token)) {
    throw new Error("Token must be a valid C… contract ID");
  }
  return token;
}

export const stakeSchema = z.object({
  side: z.enum(["yes", "no"]),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Enter a positive amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
});

export type StakeInput = z.infer<typeof stakeSchema>;
