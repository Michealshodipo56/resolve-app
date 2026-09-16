import { xdr } from '@stellar/stellar-sdk';
import { SignTransaction, SignAuthEntry, AssembledTransaction } from '@stellar/stellar-sdk/contract';
export { SignAuthEntry, SignTransaction, basicNodeSigner } from '@stellar/stellar-sdk/contract';
import { Server } from '@stellar/stellar-sdk/rpc';

/**
 * Core types mirroring the Resolve Soroban contract.
 */

/** Network + deployment configuration. `contractId` must be set by the caller. */
type ResolveNetworkConfig = {
    networkPassphrase: string;
    rpcUrl: string;
    /** Deployed Resolve contract ID (C...). Must be provided — presets use a placeholder. */
    contractId: string;
    horizonUrl?: string;
};
/** Optional signing / account context for write transactions. */
type ResolveClientOptions = ResolveNetworkConfig & {
    /** Source account public key used when assembling transactions. */
    publicKey?: string;
    /** Transaction signer (e.g. from `basicNodeSigner` or a wallet). */
    signTransaction?: SignTransaction;
    /** Auth-entry signer for Soroban authorization. */
    signAuthEntry?: SignAuthEntry;
    /** Override default base fee (stroops as string). */
    fee?: string;
    /** Transaction timeout in seconds. */
    timeoutInSeconds?: number;
};
/** Stake side. Matches contract `Side` (u32). */
declare enum Side {
    Yes = 0,
    No = 1
}
/** Resolution outcome. Matches contract `Outcome` (u32). */
declare enum Outcome {
    Yes = 0,
    No = 1,
    Invalid = 2
}
/** Market lifecycle status. Matches contract `MarketStatus` (u32). */
declare enum MarketStatus {
    Open = 0,
    Resolved = 1,
    Invalid = 2
}
/** Claim settlement kind. Matches contract `ClaimKind` (u32). */
declare enum ClaimKind {
    Payout = 0,
    Refund = 1
}
/** On-chain market state returned by `get_market`. */
type Market = {
    id: bigint;
    creator: string;
    resolver: string;
    question: string;
    description: string;
    token: string;
    createdAt: bigint;
    closeAt: bigint;
    resolutionTimeout: bigint;
    yesPool: bigint;
    noPool: bigint;
    status: MarketStatus;
    outcome: Outcome | null;
    finalizedAt: bigint | null;
};
/** User position for a market returned by `get_position`. */
type Position = {
    yesAmount: bigint;
    noAmount: bigint;
    claimed: boolean;
};
type CreateMarketParams = {
    creator: string;
    resolver: string;
    question: string;
    description: string;
    token: string;
    /** Unix timestamp (seconds) after which staking is closed. */
    closeAt: bigint | number;
    /** Seconds after `closeAt` before permissionless invalidation. */
    resolutionTimeout: bigint | number;
};
type StakeParams = {
    user: string;
    marketId: bigint | number;
    side: Side;
    /** Contract-scale i128 amount (use `toContractAmount` for human units). */
    amount: bigint | number | string;
};
type ResolveMarketParams = {
    marketId: bigint | number;
    outcome: Outcome;
};
type InvalidateMarketParams = {
    caller: string;
    marketId: bigint | number;
};
type ClaimParams = {
    user: string;
    marketId: bigint | number;
};
/** Options passed through to AssembledTransaction construction. */
type TxMethodOptions = {
    fee?: string;
    timeoutInSeconds?: number;
    /** When false, skip simulation (useful for offline XDR assembly). Default true. */
    simulate?: boolean;
    publicKey?: string;
    signTransaction?: SignTransaction;
    signAuthEntry?: SignAuthEntry;
};
/** Contract constraints mirrored for client-side validation helpers. */
declare const CONTRACT_LIMITS: {
    readonly MAX_QUESTION_LEN: 256;
    readonly MAX_DESCRIPTION_LEN: 1024;
    readonly MIN_MARKET_DURATION_SECS: 60n;
    readonly MIN_RESOLUTION_TIMEOUT_SECS: 3600n;
    readonly MAX_RESOLUTION_TIMEOUT_SECS: bigint;
};

/**
 * ResolveClient — typed wrappers around the Resolve Soroban contract.
 *
 * Uses `@stellar/stellar-sdk/contract` AssembledTransaction for simulate/sign/send.
 * Reads always go to RPC (no mocked balances or market state).
 */

type AnyAssembledTx<T = unknown> = AssembledTransaction<T>;
declare function addressScVal(address: string): xdr.ScVal;
declare function u64ScVal(value: bigint | number): xdr.ScVal;
declare function i128ScVal(value: bigint | number | string): xdr.ScVal;
declare function stringScVal(value: string): xdr.ScVal;
/** Encode a unit `#[contracttype]` enum variant as ScVec([Symbol(name)]). */
declare function enumScVal(variant: string): xdr.ScVal;
declare function sideScVal(side: Side): xdr.ScVal;
declare function outcomeScVal(outcome: Outcome): xdr.ScVal;
declare function sideName(side: Side): string;
declare function outcomeName(outcome: Outcome): string;
declare function mapSide(raw: unknown): Side;
declare function mapOutcome(raw: unknown): Outcome | null;
declare function mapMarketStatus(raw: unknown): MarketStatus;
/** Map a native ScVal decode of `Market` into the SDK `Market` type. */
declare function mapMarket(raw: unknown): Market;
/** Map a native ScVal decode of `Position` into the SDK `Position` type. */
declare function mapPosition(raw: unknown): Position;
/**
 * High-level client for the Resolve prediction-market contract.
 *
 * Write methods return `AssembledTransaction` so callers can `signAndSend()`,
 * inspect simulation, or export XDR. Read methods simulate via RPC and return
 * mapped TypeScript values.
 */
declare class ResolveClient {
    readonly config: Readonly<ResolveClientOptions>;
    readonly server: Server;
    constructor(config: ResolveClientOptions, rpc?: Server);
    /** Create a client from a network preset + required contractId override. */
    static fromNetwork(network: ResolveClientOptions, rpc?: Server): ResolveClient;
    private clientOptions;
    private buildTx;
    private simulateRead;
    /**
     * Build `create_market`. Returns AssembledTransaction whose result is the new market id.
     */
    createMarket(params: CreateMarketParams, opts?: TxMethodOptions): Promise<AnyAssembledTx<bigint>>;
    /** Build `stake`. */
    stake(params: StakeParams, opts?: TxMethodOptions): Promise<AnyAssembledTx<null>>;
    /** Stake on Yes. */
    stakeYes(params: Omit<StakeParams, "side">, opts?: TxMethodOptions): Promise<AnyAssembledTx<null>>;
    /** Stake on No. */
    stakeNo(params: Omit<StakeParams, "side">, opts?: TxMethodOptions): Promise<AnyAssembledTx<null>>;
    /** Build `resolve`. */
    resolveMarket(params: ResolveMarketParams, opts?: TxMethodOptions): Promise<AnyAssembledTx<null>>;
    /** Build `invalidate`. */
    invalidateMarket(params: InvalidateMarketParams, opts?: TxMethodOptions): Promise<AnyAssembledTx<null>>;
    /** Build `claim`. Result is the paid i128 amount. */
    claim(params: ClaimParams, opts?: TxMethodOptions): Promise<AnyAssembledTx<bigint>>;
    getMarket(marketId: bigint | number, opts?: TxMethodOptions): Promise<Market>;
    getPosition(marketId: bigint | number, user: string, opts?: TxMethodOptions): Promise<Position>;
    getClaimable(marketId: bigint | number, user: string, opts?: TxMethodOptions): Promise<bigint>;
    getNextMarketId(opts?: TxMethodOptions): Promise<bigint>;
}
/** Encode helpers exported for advanced / testing use. */
declare const scValHelpers: {
    addressScVal: typeof addressScVal;
    u64ScVal: typeof u64ScVal;
    i128ScVal: typeof i128ScVal;
    stringScVal: typeof stringScVal;
    enumScVal: typeof enumScVal;
    sideScVal: typeof sideScVal;
    outcomeScVal: typeof outcomeScVal;
    sideName: typeof sideName;
    outcomeName: typeof outcomeName;
    mapSide: typeof mapSide;
    mapOutcome: typeof mapOutcome;
    mapMarketStatus: typeof mapMarketStatus;
};

/**
 * Human ↔ contract amount helpers for SEP-41 / Soroban i128 token amounts.
 */
/**
 * Convert a human-readable decimal amount into contract i128 units.
 * Pass a `bigint` only when it already represents whole human units (not stroops).
 * Prefer string input for fractional amounts.
 *
 * @example toContractAmount("1.5", 7) → 15000000n
 */
declare function toContractAmount(amount: string | number | bigint, decimals?: number): bigint;
/**
 * Convert contract i128 units into a human-readable decimal string (no float).
 *
 * @example fromContractAmount(15000000n, 7) → "1.5"
 */
declare function fromContractAmount(amount: bigint | number | string, decimals?: number): string;

/**
 * Contract error codes (1–18) and normalization helpers.
 */
/** Stable string identifiers for Resolve contract errors. */
declare enum ResolveErrorCode {
    MARKET_NOT_FOUND = "MARKET_NOT_FOUND",
    MARKET_CLOSED = "MARKET_CLOSED",
    MARKET_NOT_RESOLVED = "MARKET_NOT_RESOLVED",
    INVALID_OUTCOME = "INVALID_OUTCOME",
    UNAUTHORIZED_RESOLVER = "UNAUTHORIZED_RESOLVER",
    ALREADY_RESOLVED = "ALREADY_RESOLVED",
    ALREADY_CLAIMED = "ALREADY_CLAIMED",
    NOT_WINNER = "NOT_WINNER",
    NOT_REFUNDABLE = "NOT_REFUNDABLE",
    INVALID_AMOUNT = "INVALID_AMOUNT",
    DEADLINE_NOT_REACHED = "DEADLINE_NOT_REACHED",
    RESOLUTION_TIMEOUT_NOT_REACHED = "RESOLUTION_TIMEOUT_NOT_REACHED",
    INVALID_SIDE = "INVALID_SIDE",
    INVALID_MARKET_CONFIG = "INVALID_MARKET_CONFIG",
    INVALID_QUESTION = "INVALID_QUESTION",
    OVERFLOW = "OVERFLOW",
    NO_POSITION = "NO_POSITION",
    MARKET_STILL_OPEN = "MARKET_STILL_OPEN"
}
/** Numeric contract error values matching `Error` in the Soroban contract. */
declare const RESOLVE_ERROR_NUMBERS: Record<ResolveErrorCode, number>;
/** Typed error thrown / returned when a Resolve contract error is recognized. */
declare class ResolveError extends Error {
    readonly code: ResolveErrorCode;
    readonly contractCode: number;
    constructor(code: ResolveErrorCode, message?: string);
    static fromContractCode(contractCode: number): ResolveError | null;
}
/**
 * Map a contract error number (1–18) to a stable `ResolveErrorCode`.
 * Returns `null` for unknown codes.
 */
declare function resolveErrorCodeFromNumber(contractCode: number): ResolveErrorCode | null;
/**
 * Normalize arbitrary RPC / SDK / wallet errors into a `ResolveError` when
 * a known Resolve contract error code (1–18) can be extracted.
 */
declare function parseResolveError(err: unknown): ResolveError | null;
/** AssembledTransaction `errorTypes` map keyed by contract error value. */
declare function resolveErrorTypes(): Record<number, {
    message: string;
}>;

/**
 * Placeholder contract ID used in network presets.
 * Callers MUST override `contractId` with a real deployment before submitting txs.
 */
declare const PLACEHOLDER_CONTRACT_ID = "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
/** Stellar Testnet preset. Override `contractId` before use. */
declare const TESTNET: ResolveNetworkConfig;
/** Stellar Futurenet preset. Override `contractId` before use. */
declare const FUTURENET: ResolveNetworkConfig;
/**
 * Merge a network preset with required overrides (at minimum a real `contractId`).
 */
declare function withContractId(base: ResolveNetworkConfig, contractId: string, overrides?: Partial<Omit<ResolveNetworkConfig, "contractId">>): ResolveNetworkConfig;
declare const networks: {
    readonly testnet: ResolveNetworkConfig;
    readonly futurenet: ResolveNetworkConfig;
    readonly withContractId: typeof withContractId;
    readonly PLACEHOLDER_CONTRACT_ID: "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
};

/**
 * Event topic helpers for indexing Resolve contract events.
 *
 * Contract events (from `#[contractevent]`):
 * - MarketCreated — topics: market_id, creator
 * - Staked — topics: market_id, user
 * - MarketResolved — topics: market_id, resolver
 * - MarketInvalidated — topics: market_id, caller
 * - Claimed — topics: market_id, user
 */

/** Canonical event names matching the Rust `#[contractevent]` structs. */
declare const ResolveEventName: {
    readonly MarketCreated: "MarketCreated";
    readonly Staked: "Staked";
    readonly MarketResolved: "MarketResolved";
    readonly MarketInvalidated: "MarketInvalidated";
    readonly Claimed: "Claimed";
};
type ResolveEventName = (typeof ResolveEventName)[keyof typeof ResolveEventName];
/** All Resolve event names (useful for catch-all indexer subscriptions). */
declare const RESOLVE_EVENT_NAMES: readonly ResolveEventName[];
type EventTopicFilter = {
    /** Base64-encoded ScVal topics for `getEvents` filters (`null` = wildcard). */
    topics: Array<string | null>;
    eventName: ResolveEventName;
};
/**
 * Build RPC topic filters for MarketCreated.
 * Topics: [event_name, market_id?, creator?]
 */
declare function marketCreatedTopics(opts?: {
    marketId?: bigint | number;
    creator?: string;
}): EventTopicFilter;
/**
 * Build RPC topic filters for Staked.
 * Topics: [event_name, market_id?, user?]
 */
declare function stakedTopics(opts?: {
    marketId?: bigint | number;
    user?: string;
}): EventTopicFilter;
/**
 * Build RPC topic filters for MarketResolved.
 * Topics: [event_name, market_id?, resolver?]
 */
declare function marketResolvedTopics(opts?: {
    marketId?: bigint | number;
    resolver?: string;
}): EventTopicFilter;
/**
 * Build RPC topic filters for MarketInvalidated.
 * Topics: [event_name, market_id?, caller?]
 */
declare function marketInvalidatedTopics(opts?: {
    marketId?: bigint | number;
    caller?: string;
}): EventTopicFilter;
/**
 * Build RPC topic filters for Claimed.
 * Topics: [event_name, market_id?, user?]
 */
declare function claimedTopics(opts?: {
    marketId?: bigint | number;
    user?: string;
}): EventTopicFilter;
/** Decode a single base64 ScVal topic into a native JS value when possible. */
declare function decodeEventTopic(topicXdrBase64: string): unknown;
/** Map raw u32 / name side to enum (throws on invalid). */
declare function parseSide(value: number | string): Side;
/** Map raw u32 / name outcome to enum (throws on invalid). */
declare function parseOutcome(value: number | string): Outcome;
/** Map raw u32 / name claim kind to enum (throws on invalid). */
declare function parseClaimKind(value: number | string): ClaimKind;

export { CONTRACT_LIMITS, ClaimKind, type ClaimParams, type CreateMarketParams, type EventTopicFilter, FUTURENET, type InvalidateMarketParams, type Market, MarketStatus, Outcome, PLACEHOLDER_CONTRACT_ID, type Position, RESOLVE_ERROR_NUMBERS, RESOLVE_EVENT_NAMES, ResolveClient, type ResolveClientOptions, ResolveError, ResolveErrorCode, ResolveEventName, type ResolveMarketParams, type ResolveNetworkConfig, Side, type StakeParams, TESTNET, type TxMethodOptions, claimedTopics, decodeEventTopic, fromContractAmount, mapMarket, mapPosition, marketCreatedTopics, marketInvalidatedTopics, marketResolvedTopics, networks, parseClaimKind, parseOutcome, parseResolveError, parseSide, resolveErrorCodeFromNumber, resolveErrorTypes, scValHelpers, stakedTopics, toContractAmount, withContractId };
