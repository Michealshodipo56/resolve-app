/**
 * Public runtime configuration. Only NEXT_PUBLIC_* vars are used.
 */

export type StellarNetworkName = "testnet" | "futurenet" | "mainnet" | "custom";

export type AppConfig = {
  network: StellarNetworkName;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  contractId: string;
  indexerApiUrl: string;
  settlementTokenId: string;
  tokenDecimals: number;
};

const DEFAULT_PASSPHRASE = "Test SDF Network ; September 2015";

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

export function getAppConfig(): AppConfig {
  return {
    network: (trim(process.env.NEXT_PUBLIC_STELLAR_NETWORK) ||
      "testnet") as StellarNetworkName,
    rpcUrl: trim(process.env.NEXT_PUBLIC_SOROBAN_RPC_URL),
    horizonUrl: trim(process.env.NEXT_PUBLIC_HORIZON_URL),
    networkPassphrase:
      trim(process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE) || DEFAULT_PASSPHRASE,
    contractId: trim(process.env.NEXT_PUBLIC_RESOLVE_CONTRACT_ID),
    indexerApiUrl: trim(process.env.NEXT_PUBLIC_INDEXER_API_URL),
    settlementTokenId: trim(process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ID),
    tokenDecimals: 7,
  };
}

export function assertWriteConfig(config: AppConfig): void {
  const missing: string[] = [];
  if (!config.rpcUrl) missing.push("NEXT_PUBLIC_SOROBAN_RPC_URL");
  if (!config.contractId) missing.push("NEXT_PUBLIC_RESOLVE_CONTRACT_ID");
  if (!config.networkPassphrase) missing.push("NEXT_PUBLIC_NETWORK_PASSPHRASE");
  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.join(", ")}. Copy .env.example to .env.local and fill in deployment values.`,
    );
  }
}

export function hasIndexer(config: AppConfig = getAppConfig()): boolean {
  return Boolean(config.indexerApiUrl);
}

export function hasContract(config: AppConfig = getAppConfig()): boolean {
  return Boolean(config.contractId && config.rpcUrl);
}
