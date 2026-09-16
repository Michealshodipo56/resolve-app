'use strict';

var stellarSdk = require('@stellar/stellar-sdk');
var contract = require('@stellar/stellar-sdk/contract');
var rpc = require('@stellar/stellar-sdk/rpc');

// src/client.ts

// src/errors.ts
var ResolveErrorCode = /* @__PURE__ */ ((ResolveErrorCode2) => {
  ResolveErrorCode2["MARKET_NOT_FOUND"] = "MARKET_NOT_FOUND";
  ResolveErrorCode2["MARKET_CLOSED"] = "MARKET_CLOSED";
  ResolveErrorCode2["MARKET_NOT_RESOLVED"] = "MARKET_NOT_RESOLVED";
  ResolveErrorCode2["INVALID_OUTCOME"] = "INVALID_OUTCOME";
  ResolveErrorCode2["UNAUTHORIZED_RESOLVER"] = "UNAUTHORIZED_RESOLVER";
  ResolveErrorCode2["ALREADY_RESOLVED"] = "ALREADY_RESOLVED";
  ResolveErrorCode2["ALREADY_CLAIMED"] = "ALREADY_CLAIMED";
  ResolveErrorCode2["NOT_WINNER"] = "NOT_WINNER";
  ResolveErrorCode2["NOT_REFUNDABLE"] = "NOT_REFUNDABLE";
  ResolveErrorCode2["INVALID_AMOUNT"] = "INVALID_AMOUNT";
  ResolveErrorCode2["DEADLINE_NOT_REACHED"] = "DEADLINE_NOT_REACHED";
  ResolveErrorCode2["RESOLUTION_TIMEOUT_NOT_REACHED"] = "RESOLUTION_TIMEOUT_NOT_REACHED";
  ResolveErrorCode2["INVALID_SIDE"] = "INVALID_SIDE";
  ResolveErrorCode2["INVALID_MARKET_CONFIG"] = "INVALID_MARKET_CONFIG";
  ResolveErrorCode2["INVALID_QUESTION"] = "INVALID_QUESTION";
  ResolveErrorCode2["OVERFLOW"] = "OVERFLOW";
  ResolveErrorCode2["NO_POSITION"] = "NO_POSITION";
  ResolveErrorCode2["MARKET_STILL_OPEN"] = "MARKET_STILL_OPEN";
  return ResolveErrorCode2;
})(ResolveErrorCode || {});
var RESOLVE_ERROR_NUMBERS = {
  ["MARKET_NOT_FOUND" /* MARKET_NOT_FOUND */]: 1,
  ["MARKET_CLOSED" /* MARKET_CLOSED */]: 2,
  ["MARKET_NOT_RESOLVED" /* MARKET_NOT_RESOLVED */]: 3,
  ["INVALID_OUTCOME" /* INVALID_OUTCOME */]: 4,
  ["UNAUTHORIZED_RESOLVER" /* UNAUTHORIZED_RESOLVER */]: 5,
  ["ALREADY_RESOLVED" /* ALREADY_RESOLVED */]: 6,
  ["ALREADY_CLAIMED" /* ALREADY_CLAIMED */]: 7,
  ["NOT_WINNER" /* NOT_WINNER */]: 8,
  ["NOT_REFUNDABLE" /* NOT_REFUNDABLE */]: 9,
  ["INVALID_AMOUNT" /* INVALID_AMOUNT */]: 10,
  ["DEADLINE_NOT_REACHED" /* DEADLINE_NOT_REACHED */]: 11,
  ["RESOLUTION_TIMEOUT_NOT_REACHED" /* RESOLUTION_TIMEOUT_NOT_REACHED */]: 12,
  ["INVALID_SIDE" /* INVALID_SIDE */]: 13,
  ["INVALID_MARKET_CONFIG" /* INVALID_MARKET_CONFIG */]: 14,
  ["INVALID_QUESTION" /* INVALID_QUESTION */]: 15,
  ["OVERFLOW" /* OVERFLOW */]: 16,
  ["NO_POSITION" /* NO_POSITION */]: 17,
  ["MARKET_STILL_OPEN" /* MARKET_STILL_OPEN */]: 18
};
var NUMBER_TO_CODE = Object.fromEntries(
  Object.entries(RESOLVE_ERROR_NUMBERS).map(([code, num]) => [
    num,
    code
  ])
);
var CODE_MESSAGES = {
  ["MARKET_NOT_FOUND" /* MARKET_NOT_FOUND */]: "Market ID was not found in storage",
  ["MARKET_CLOSED" /* MARKET_CLOSED */]: "Market is not open for staking (past deadline or already settled)",
  ["MARKET_NOT_RESOLVED" /* MARKET_NOT_RESOLVED */]: "Market has not been resolved or invalidated yet",
  ["INVALID_OUTCOME" /* INVALID_OUTCOME */]: "Outcome value is not a recognized enum variant",
  ["UNAUTHORIZED_RESOLVER" /* UNAUTHORIZED_RESOLVER */]: "Caller is not the designated resolver for this market",
  ["ALREADY_RESOLVED" /* ALREADY_RESOLVED */]: "Market has already been resolved or invalidated",
  ["ALREADY_CLAIMED" /* ALREADY_CLAIMED */]: "Position has already been claimed or refunded",
  ["NOT_WINNER" /* NOT_WINNER */]: "Caller has no winning stake for the resolved outcome",
  ["NOT_REFUNDABLE" /* NOT_REFUNDABLE */]: "Position is not eligible for a refund",
  ["INVALID_AMOUNT" /* INVALID_AMOUNT */]: "Amount must be strictly positive",
  ["DEADLINE_NOT_REACHED" /* DEADLINE_NOT_REACHED */]: "Close time has not been reached yet",
  ["RESOLUTION_TIMEOUT_NOT_REACHED" /* RESOLUTION_TIMEOUT_NOT_REACHED */]: "Resolution timeout has not elapsed; invalidation is not yet allowed",
  ["INVALID_SIDE" /* INVALID_SIDE */]: "Side must be Yes or No",
  ["INVALID_MARKET_CONFIG" /* INVALID_MARKET_CONFIG */]: "Market configuration is logically invalid",
  ["INVALID_QUESTION" /* INVALID_QUESTION */]: "Question string is empty or exceeds the maximum length",
  ["OVERFLOW" /* OVERFLOW */]: "Arithmetic overflow during payout or pool accounting",
  ["NO_POSITION" /* NO_POSITION */]: "No position exists for this user on this market",
  ["MARKET_STILL_OPEN" /* MARKET_STILL_OPEN */]: "Market still has an open staking window; resolution is not allowed yet"
};
var ResolveError = class _ResolveError extends Error {
  code;
  contractCode;
  constructor(code, message) {
    const contractCode = RESOLVE_ERROR_NUMBERS[code];
    super(message ?? CODE_MESSAGES[code]);
    this.name = "ResolveError";
    this.code = code;
    this.contractCode = contractCode;
  }
  static fromContractCode(contractCode) {
    const code = NUMBER_TO_CODE[contractCode];
    if (!code) return null;
    return new _ResolveError(code);
  }
};
function resolveErrorCodeFromNumber(contractCode) {
  return NUMBER_TO_CODE[contractCode] ?? null;
}
function parseResolveError(err) {
  if (err instanceof ResolveError) {
    return err;
  }
  if (typeof err === "number" && Number.isInteger(err)) {
    return ResolveError.fromContractCode(err);
  }
  if (typeof err === "bigint") {
    return ResolveError.fromContractCode(Number(err));
  }
  if (typeof err === "string") {
    return parseFromString(err);
  }
  if (err && typeof err === "object") {
    const obj = err;
    for (const key of ["contractCode", "errorCode", "code", "value"]) {
      const n = toInt(obj[key]);
      if (n !== null) {
        const parsed = ResolveError.fromContractCode(n);
        if (parsed) return parsed;
      }
    }
    if ("error" in obj) {
      const nested = parseResolveError(obj.error);
      if (nested) return nested;
    }
    if ("result" in obj) {
      const nested = parseResolveError(obj.result);
      if (nested) return nested;
    }
    if (typeof obj.message === "string") {
      const fromMessage = parseFromString(obj.message);
      if (fromMessage) return fromMessage;
    }
    try {
      const json = JSON.stringify(obj);
      const fromJson = parseFromString(json);
      if (fromJson) return fromJson;
    } catch {
    }
  }
  return null;
}
function toInt(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}
function parseFromString(text) {
  const upper = text.toUpperCase();
  for (const code of Object.values(ResolveErrorCode)) {
    if (upper.includes(code)) {
      return new ResolveError(code);
    }
  }
  const patterns = [
    /Error\(Contract,\s*#(\d+)\)/i,
    /ContractError\((\d+)\)/i,
    /contract error[:\s#]*(\d+)/i,
    /"code"\s*:\s*(\d+)/i,
    /\berror[_\s-]?code["\s:=]+(\d+)/i,
    /#(\d{1,2})\b/
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      const parsed = ResolveError.fromContractCode(n);
      if (parsed) return parsed;
    }
  }
  return null;
}
function resolveErrorTypes() {
  const out = {};
  for (const [code, num] of Object.entries(RESOLVE_ERROR_NUMBERS)) {
    out[num] = { message: CODE_MESSAGES[code] };
  }
  return out;
}
var PLACEHOLDER_CONTRACT_ID = "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
function assertOverrideContractId(config) {
  if (!config.contractId || config.contractId === PLACEHOLDER_CONTRACT_ID || !config.contractId.startsWith("C")) ;
}
var TESTNET = {
  networkPassphrase: stellarSdk.Networks.TESTNET,
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  contractId: PLACEHOLDER_CONTRACT_ID
};
var FUTURENET = {
  networkPassphrase: stellarSdk.Networks.FUTURENET,
  rpcUrl: "https://rpc-futurenet.stellar.org",
  horizonUrl: "https://horizon-futurenet.stellar.org",
  contractId: PLACEHOLDER_CONTRACT_ID
};
function withContractId(base, contractId, overrides = {}) {
  if (!contractId || contractId === PLACEHOLDER_CONTRACT_ID) {
    throw new Error(
      "contractId must be a real deployed Resolve contract ID (override the preset placeholder)"
    );
  }
  const config = {
    ...base,
    ...overrides,
    contractId
  };
  assertOverrideContractId(config);
  return config;
}
var networks = {
  testnet: TESTNET,
  futurenet: FUTURENET,
  withContractId,
  PLACEHOLDER_CONTRACT_ID
};

// src/types.ts
var Side = /* @__PURE__ */ ((Side2) => {
  Side2[Side2["Yes"] = 0] = "Yes";
  Side2[Side2["No"] = 1] = "No";
  return Side2;
})(Side || {});
var Outcome = /* @__PURE__ */ ((Outcome2) => {
  Outcome2[Outcome2["Yes"] = 0] = "Yes";
  Outcome2[Outcome2["No"] = 1] = "No";
  Outcome2[Outcome2["Invalid"] = 2] = "Invalid";
  return Outcome2;
})(Outcome || {});
var MarketStatus = /* @__PURE__ */ ((MarketStatus2) => {
  MarketStatus2[MarketStatus2["Open"] = 0] = "Open";
  MarketStatus2[MarketStatus2["Resolved"] = 1] = "Resolved";
  MarketStatus2[MarketStatus2["Invalid"] = 2] = "Invalid";
  return MarketStatus2;
})(MarketStatus || {});
var ClaimKind = /* @__PURE__ */ ((ClaimKind2) => {
  ClaimKind2[ClaimKind2["Payout"] = 0] = "Payout";
  ClaimKind2[ClaimKind2["Refund"] = 1] = "Refund";
  return ClaimKind2;
})(ClaimKind || {});
var CONTRACT_LIMITS = {
  MAX_QUESTION_LEN: 256,
  MAX_DESCRIPTION_LEN: 1024,
  MIN_MARKET_DURATION_SECS: 60n,
  MIN_RESOLUTION_TIMEOUT_SECS: 3600n,
  MAX_RESOLUTION_TIMEOUT_SECS: 365n * 24n * 60n * 60n
};

// src/client.ts
function toBigInt(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new RangeError(`expected integer, got ${value}`);
    }
    return BigInt(value);
  }
  return BigInt(value);
}
function addressScVal(address) {
  return stellarSdk.Address.fromString(address).toScVal();
}
function u64ScVal(value) {
  return stellarSdk.nativeToScVal(toBigInt(value), { type: "u64" });
}
function i128ScVal(value) {
  return stellarSdk.nativeToScVal(toBigInt(value), { type: "i128" });
}
function stringScVal(value) {
  return stellarSdk.nativeToScVal(value, { type: "string" });
}
function enumScVal(variant) {
  return stellarSdk.xdr.ScVal.scvVec([stellarSdk.xdr.ScVal.scvSymbol(variant)]);
}
function sideScVal(side) {
  switch (side) {
    case 0 /* Yes */:
      return enumScVal("Yes");
    case 1 /* No */:
      return enumScVal("No");
    default:
      throw new ResolveError("INVALID_SIDE" /* INVALID_SIDE */);
  }
}
function outcomeScVal(outcome) {
  switch (outcome) {
    case 0 /* Yes */:
      return enumScVal("Yes");
    case 1 /* No */:
      return enumScVal("No");
    case 2 /* Invalid */:
      return enumScVal("Invalid");
    default:
      throw new RangeError(`invalid Outcome: ${outcome}`);
  }
}
function sideName(side) {
  return side === 0 /* Yes */ ? "Yes" : "No";
}
function outcomeName(outcome) {
  if (outcome === 0 /* Yes */) return "Yes";
  if (outcome === 1 /* No */) return "No";
  return "Invalid";
}
function parseEnumVariant(raw) {
  if (typeof raw === "string" || typeof raw === "number") return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "string" || typeof first === "number") return first;
  }
  if (raw && typeof raw === "object") {
    const obj = raw;
    if (typeof obj.tag === "string") return obj.tag;
    if (typeof obj.name === "string") return obj.name;
  }
  return null;
}
function mapSide(raw) {
  const v = parseEnumVariant(raw);
  if (v === 0 || v === "Yes" || v === "yes") return 0 /* Yes */;
  if (v === 1 || v === "No" || v === "no") return 1 /* No */;
  throw new RangeError(`unable to map Side from ${JSON.stringify(raw)}`);
}
function mapOutcome(raw) {
  if (raw === null || raw === void 0) return null;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw;
    if (obj.tag === "None" || obj.tag === "Unset") return null;
    if (obj.tag === "Some" && Array.isArray(obj.values)) {
      return mapOutcome(obj.values[0] ?? null);
    }
    if (obj.tag === "Yes") return 0 /* Yes */;
    if (obj.tag === "No") return 1 /* No */;
    if (obj.tag === "Invalid") return 2 /* Invalid */;
  }
  const v = parseEnumVariant(raw);
  if (v === "Unset" || v === "unset") return null;
  if (v === "Yes" || v === "yes") return 0 /* Yes */;
  if (v === "No" || v === "no") return 1 /* No */;
  if (v === "Invalid" || v === "invalid") return 2 /* Invalid */;
  if (v === 0) return null;
  if (v === 1) return 0 /* Yes */;
  if (v === 2) return 1 /* No */;
  if (v === 3) return 2 /* Invalid */;
  throw new RangeError(`unable to map Outcome from ${JSON.stringify(raw)}`);
}
function mapMarketStatus(raw) {
  const v = parseEnumVariant(raw);
  if (v === 0 || v === "Open" || v === "open") return 0 /* Open */;
  if (v === 1 || v === "Resolved" || v === "resolved") {
    return 1 /* Resolved */;
  }
  if (v === 2 || v === "Invalid" || v === "invalid") {
    return 2 /* Invalid */;
  }
  throw new RangeError(
    `unable to map MarketStatus from ${JSON.stringify(raw)}`
  );
}
function mapFinalizedAt(raw) {
  if (raw === null || raw === void 0) return null;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw;
    if (obj.tag === "None") return null;
    if (obj.tag === "Some" && Array.isArray(obj.values)) {
      return mapFinalizedAt(obj.values[0] ?? null);
    }
  }
  const n = toBigInt(raw);
  return n === 0n ? null : n;
}
function field(obj, ...keys) {
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return void 0;
}
function mapMarket(raw) {
  if (!raw || typeof raw !== "object") {
    throw new TypeError("get_market returned unexpected value");
  }
  const o = raw;
  return {
    id: toBigInt(field(o, "id")),
    creator: String(field(o, "creator")),
    resolver: String(field(o, "resolver")),
    question: String(field(o, "question")),
    description: String(field(o, "description")),
    token: String(field(o, "token")),
    createdAt: toBigInt(
      field(o, "created_at", "createdAt")
    ),
    closeAt: toBigInt(
      field(o, "close_at", "closeAt")
    ),
    resolutionTimeout: toBigInt(
      field(o, "resolution_timeout", "resolutionTimeout")
    ),
    yesPool: toBigInt(
      field(o, "yes_pool", "yesPool")
    ),
    noPool: toBigInt(
      field(o, "no_pool", "noPool")
    ),
    status: mapMarketStatus(field(o, "status")),
    outcome: mapOutcome(field(o, "outcome")),
    finalizedAt: mapFinalizedAt(field(o, "finalized_at", "finalizedAt"))
  };
}
function mapPosition(raw) {
  if (!raw || typeof raw !== "object") {
    throw new TypeError("get_position returned unexpected value");
  }
  const o = raw;
  return {
    yesAmount: toBigInt(
      field(o, "yes_amount", "yesAmount")
    ),
    noAmount: toBigInt(
      field(o, "no_amount", "noAmount")
    ),
    claimed: Boolean(field(o, "claimed"))
  };
}
function validateConfig(config) {
  if (!config.rpcUrl) {
    throw new Error("ResolveClient: rpcUrl is required");
  }
  if (!config.networkPassphrase) {
    throw new Error("ResolveClient: networkPassphrase is required");
  }
  if (!config.contractId || config.contractId === PLACEHOLDER_CONTRACT_ID) {
    throw new Error(
      "ResolveClient: contractId must be a real deployed contract ID (override the network preset placeholder)"
    );
  }
  if (!config.contractId.startsWith("C")) {
    throw new Error(
      `ResolveClient: contractId looks invalid (expected C...): ${config.contractId}`
    );
  }
}
function rethrowContractError(err) {
  const parsed = parseResolveError(err);
  if (parsed) throw parsed;
  throw err;
}
var ResolveClient = class _ResolveClient {
  config;
  server;
  constructor(config, rpc$1) {
    validateConfig(config);
    this.config = Object.freeze({ ...config });
    this.server = rpc$1 ?? new rpc.Server(config.rpcUrl, {
      allowHttp: config.rpcUrl.startsWith("http://")
    });
  }
  /** Create a client from a network preset + required contractId override. */
  static fromNetwork(network, rpc) {
    return new _ResolveClient(network, rpc);
  }
  clientOptions(methodOpts) {
    const publicKey = methodOpts?.publicKey ?? this.config.publicKey ?? void 0;
    return {
      contractId: this.config.contractId,
      networkPassphrase: this.config.networkPassphrase,
      rpcUrl: this.config.rpcUrl,
      server: this.server,
      publicKey,
      signTransaction: methodOpts?.signTransaction ?? this.config.signTransaction,
      signAuthEntry: methodOpts?.signAuthEntry ?? this.config.signAuthEntry,
      errorTypes: resolveErrorTypes()
    };
  }
  async buildTx(method, args, parseResultXdr, methodOpts) {
    try {
      return await contract.AssembledTransaction.build({
        method,
        args,
        ...this.clientOptions(methodOpts),
        fee: methodOpts?.fee ?? this.config.fee,
        timeoutInSeconds: methodOpts?.timeoutInSeconds ?? this.config.timeoutInSeconds,
        simulate: methodOpts?.simulate ?? true,
        parseResultXdr
      });
    } catch (err) {
      rethrowContractError(err);
    }
  }
  async simulateRead(method, args, parse, methodOpts) {
    const tx = await this.buildTx(method, args, parse, {
      ...methodOpts,
      simulate: true
    });
    try {
      return tx.result;
    } catch (err) {
      rethrowContractError(err);
    }
  }
  // --- Writes ---
  /**
   * Build `create_market`. Returns AssembledTransaction whose result is the new market id.
   */
  async createMarket(params, opts) {
    return this.buildTx(
      "create_market",
      [
        addressScVal(params.creator),
        addressScVal(params.resolver),
        stringScVal(params.question),
        stringScVal(params.description),
        addressScVal(params.token),
        u64ScVal(params.closeAt),
        u64ScVal(params.resolutionTimeout)
      ],
      (val) => toBigInt(stellarSdk.scValToNative(val)),
      { publicKey: params.creator, ...opts }
    );
  }
  /** Build `stake`. */
  async stake(params, opts) {
    return this.buildTx(
      "stake",
      [
        addressScVal(params.user),
        u64ScVal(params.marketId),
        sideScVal(params.side),
        i128ScVal(params.amount)
      ],
      () => null,
      { publicKey: params.user, ...opts }
    );
  }
  /** Stake on Yes. */
  async stakeYes(params, opts) {
    return this.stake({ ...params, side: 0 /* Yes */ }, opts);
  }
  /** Stake on No. */
  async stakeNo(params, opts) {
    return this.stake({ ...params, side: 1 /* No */ }, opts);
  }
  /** Build `resolve`. */
  async resolveMarket(params, opts) {
    return this.buildTx(
      "resolve",
      [u64ScVal(params.marketId), outcomeScVal(params.outcome)],
      () => null,
      opts
    );
  }
  /** Build `invalidate`. */
  async invalidateMarket(params, opts) {
    return this.buildTx(
      "invalidate",
      [addressScVal(params.caller), u64ScVal(params.marketId)],
      () => null,
      { publicKey: params.caller, ...opts }
    );
  }
  /** Build `claim`. Result is the paid i128 amount. */
  async claim(params, opts) {
    return this.buildTx(
      "claim",
      [addressScVal(params.user), u64ScVal(params.marketId)],
      (val) => toBigInt(stellarSdk.scValToNative(val)),
      { publicKey: params.user, ...opts }
    );
  }
  // --- Reads (RPC simulation) ---
  async getMarket(marketId, opts) {
    return this.simulateRead(
      "get_market",
      [u64ScVal(marketId)],
      (val) => mapMarket(stellarSdk.scValToNative(val)),
      opts
    );
  }
  async getPosition(marketId, user, opts) {
    return this.simulateRead(
      "get_position",
      [u64ScVal(marketId), addressScVal(user)],
      (val) => mapPosition(stellarSdk.scValToNative(val)),
      opts
    );
  }
  async getClaimable(marketId, user, opts) {
    return this.simulateRead(
      "get_claimable",
      [u64ScVal(marketId), addressScVal(user)],
      (val) => toBigInt(stellarSdk.scValToNative(val)),
      opts
    );
  }
  async getNextMarketId(opts) {
    return this.simulateRead(
      "next_market_id",
      [],
      (val) => toBigInt(stellarSdk.scValToNative(val)),
      opts
    );
  }
};
var scValHelpers = {
  addressScVal,
  u64ScVal,
  i128ScVal,
  stringScVal,
  enumScVal,
  sideScVal,
  outcomeScVal,
  sideName,
  outcomeName,
  mapSide,
  mapOutcome,
  mapMarketStatus
};

// src/amounts.ts
var DEFAULT_DECIMALS = 7;
function assertDecimals(decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 38) {
    throw new RangeError(`decimals must be an integer in [0, 38], got ${decimals}`);
  }
}
function scaleFactor(decimals) {
  return 10n ** BigInt(decimals);
}
function toContractAmount(amount, decimals = DEFAULT_DECIMALS) {
  assertDecimals(decimals);
  if (typeof amount === "bigint") {
    return amount * scaleFactor(decimals);
  }
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new RangeError("amount must be a finite number");
    }
    return toContractAmount(String(amount), decimals);
  }
  const trimmed = amount.trim();
  if (!trimmed || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new RangeError(`invalid amount: ${amount}`);
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart = "0", fracPart = ""] = unsigned.split(".");
  if (fracPart.length > decimals) {
    throw new RangeError(
      `amount has more than ${decimals} fractional digits: ${amount}`
    );
  }
  const fracPadded = fracPart.padEnd(decimals, "0");
  const raw = BigInt(wholePart) * scaleFactor(decimals) + BigInt(fracPadded || "0");
  return negative ? -raw : raw;
}
function fromContractAmount(amount, decimals = DEFAULT_DECIMALS) {
  assertDecimals(decimals);
  const value = typeof amount === "bigint" ? amount : typeof amount === "number" ? BigInt(Math.trunc(amount)) : BigInt(amount);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const factor = scaleFactor(decimals);
  const whole = abs / factor;
  const frac = abs % factor;
  if (decimals === 0) {
    return `${negative ? "-" : ""}${whole.toString()}`;
  }
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const body = fracStr.length > 0 ? `${whole.toString()}.${fracStr}` : whole.toString();
  return negative ? `-${body}` : body;
}
var ResolveEventName = {
  MarketCreated: "MarketCreated",
  Staked: "Staked",
  MarketResolved: "MarketResolved",
  MarketInvalidated: "MarketInvalidated",
  Claimed: "Claimed"
};
var RESOLVE_EVENT_NAMES = [
  ResolveEventName.MarketCreated,
  ResolveEventName.Staked,
  ResolveEventName.MarketResolved,
  ResolveEventName.MarketInvalidated,
  ResolveEventName.Claimed
];
function topicSymbol(name) {
  return stellarSdk.nativeToScVal(name, { type: "symbol" }).toXDR("base64");
}
function topicU64(value) {
  return stellarSdk.nativeToScVal(BigInt(value), { type: "u64" }).toXDR("base64");
}
function topicAddress(address) {
  return stellarSdk.nativeToScVal(address, { type: "address" }).toXDR("base64");
}
function marketCreatedTopics(opts) {
  return {
    eventName: ResolveEventName.MarketCreated,
    topics: [
      topicSymbol(ResolveEventName.MarketCreated),
      opts?.marketId !== void 0 ? topicU64(opts.marketId) : null,
      opts?.creator ? topicAddress(opts.creator) : null
    ]
  };
}
function stakedTopics(opts) {
  return {
    eventName: ResolveEventName.Staked,
    topics: [
      topicSymbol(ResolveEventName.Staked),
      opts?.marketId !== void 0 ? topicU64(opts.marketId) : null,
      opts?.user ? topicAddress(opts.user) : null
    ]
  };
}
function marketResolvedTopics(opts) {
  return {
    eventName: ResolveEventName.MarketResolved,
    topics: [
      topicSymbol(ResolveEventName.MarketResolved),
      opts?.marketId !== void 0 ? topicU64(opts.marketId) : null,
      opts?.resolver ? topicAddress(opts.resolver) : null
    ]
  };
}
function marketInvalidatedTopics(opts) {
  return {
    eventName: ResolveEventName.MarketInvalidated,
    topics: [
      topicSymbol(ResolveEventName.MarketInvalidated),
      opts?.marketId !== void 0 ? topicU64(opts.marketId) : null,
      opts?.caller ? topicAddress(opts.caller) : null
    ]
  };
}
function claimedTopics(opts) {
  return {
    eventName: ResolveEventName.Claimed,
    topics: [
      topicSymbol(ResolveEventName.Claimed),
      opts?.marketId !== void 0 ? topicU64(opts.marketId) : null,
      opts?.user ? topicAddress(opts.user) : null
    ]
  };
}
function decodeEventTopic(topicXdrBase64) {
  const scVal = stellarSdk.xdr.ScVal.fromXDR(topicXdrBase64, "base64");
  try {
    return stellarSdk.scValToNative(scVal);
  } catch {
    switch (scVal.switch().name) {
      case "scvSymbol":
        return scVal.sym().toString();
      case "scvAddress":
        return stellarSdk.Address.fromScVal(scVal).toString();
      case "scvU64":
        return BigInt(scVal.u64().toString());
      case "scvU32":
        return scVal.u32();
      default:
        return scVal;
    }
  }
}
function parseSide(value) {
  if (value === 0 /* Yes */ || value === "Yes" || value === "yes") return 0 /* Yes */;
  if (value === 1 /* No */ || value === "No" || value === "no") return 1 /* No */;
  throw new RangeError(`invalid Side: ${value}`);
}
function parseOutcome(value) {
  if (value === 0 /* Yes */ || value === "Yes" || value === "yes") {
    return 0 /* Yes */;
  }
  if (value === 1 /* No */ || value === "No" || value === "no") {
    return 1 /* No */;
  }
  if (value === 2 /* Invalid */ || value === "Invalid" || value === "invalid") {
    return 2 /* Invalid */;
  }
  throw new RangeError(`invalid Outcome: ${value}`);
}
function parseClaimKind(value) {
  if (value === 0 /* Payout */ || value === "Payout" || value === "payout") {
    return 0 /* Payout */;
  }
  if (value === 1 /* Refund */ || value === "Refund" || value === "refund") {
    return 1 /* Refund */;
  }
  throw new RangeError(`invalid ClaimKind: ${value}`);
}

Object.defineProperty(exports, "basicNodeSigner", {
  enumerable: true,
  get: function () { return contract.basicNodeSigner; }
});
exports.CONTRACT_LIMITS = CONTRACT_LIMITS;
exports.ClaimKind = ClaimKind;
exports.FUTURENET = FUTURENET;
exports.MarketStatus = MarketStatus;
exports.Outcome = Outcome;
exports.PLACEHOLDER_CONTRACT_ID = PLACEHOLDER_CONTRACT_ID;
exports.RESOLVE_ERROR_NUMBERS = RESOLVE_ERROR_NUMBERS;
exports.RESOLVE_EVENT_NAMES = RESOLVE_EVENT_NAMES;
exports.ResolveClient = ResolveClient;
exports.ResolveError = ResolveError;
exports.ResolveErrorCode = ResolveErrorCode;
exports.ResolveEventName = ResolveEventName;
exports.Side = Side;
exports.TESTNET = TESTNET;
exports.claimedTopics = claimedTopics;
exports.decodeEventTopic = decodeEventTopic;
exports.fromContractAmount = fromContractAmount;
exports.mapMarket = mapMarket;
exports.mapPosition = mapPosition;
exports.marketCreatedTopics = marketCreatedTopics;
exports.marketInvalidatedTopics = marketInvalidatedTopics;
exports.marketResolvedTopics = marketResolvedTopics;
exports.networks = networks;
exports.parseClaimKind = parseClaimKind;
exports.parseOutcome = parseOutcome;
exports.parseResolveError = parseResolveError;
exports.parseSide = parseSide;
exports.resolveErrorCodeFromNumber = resolveErrorCodeFromNumber;
exports.resolveErrorTypes = resolveErrorTypes;
exports.scValHelpers = scValHelpers;
exports.stakedTopics = stakedTopics;
exports.toContractAmount = toContractAmount;
exports.withContractId = withContractId;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map