"use client";

import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAppConfig } from "./config";
import { mapWalletError, type TxUiError } from "./errors";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong_network";

type WalletContextValue = {
  status: WalletStatus;
  address: string | null;
  error: TxUiError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  signTransaction: (
    xdr: string,
  ) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
  networkPassphrase: string;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "resolve.wallet.id";

function mapNetwork(name: string): WalletNetwork {
  switch (name) {
    case "mainnet":
      return WalletNetwork.PUBLIC;
    case "futurenet":
      return WalletNetwork.FUTURENET;
    case "testnet":
    default:
      return WalletNetwork.TESTNET;
  }
}

function getKit(): StellarWalletsKit {
  const config = getAppConfig();
  const kit = new StellarWalletsKit({
    network: mapNetwork(config.network),
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  });
  return kit;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const config = getAppConfig();
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<TxUiError | null>(null);

  useEffect(() => {
    const instance = getKit();
    setKit(instance);

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    let cancelled = false;
    (async () => {
      try {
        setStatus("connecting");
        instance.setWallet(saved);
        const { address: addr } = await instance.getAddress();
        if (cancelled) return;
        setAddress(addr);
        setStatus("connected");
      } catch {
        if (cancelled) return;
        window.localStorage.removeItem(STORAGE_KEY);
        setStatus("disconnected");
        setAddress(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!kit) return;
    setError(null);
    setStatus("connecting");
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          window.localStorage.setItem(STORAGE_KEY, option.id);
          const { address: addr } = await kit.getAddress();
          setAddress(addr);
          setStatus("connected");
        },
      });
      // Modal closed without selection
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setStatus("disconnected");
      }
    } catch (err) {
      setError(mapWalletError(err));
      setStatus("disconnected");
      setAddress(null);
    }
  }, [kit]);

  const disconnect = useCallback(async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAddress(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!kit || !address) {
        throw new Error("Wallet is not connected.");
      }
      try {
        const result = await kit.signTransaction(xdr, {
          address,
          networkPassphrase: config.networkPassphrase,
        });
        return {
          signedTxXdr: result.signedTxXdr,
          signerAddress: address,
        };
      } catch (err) {
        const mapped = mapWalletError(err);
        setError(mapped);
        throw Object.assign(new Error(mapped.message), { ui: mapped });
      }
    },
    [kit, address, config.networkPassphrase],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      error,
      connect,
      disconnect,
      clearError: () => setError(null),
      signTransaction,
      networkPassphrase: config.networkPassphrase,
    }),
    [
      status,
      address,
      error,
      connect,
      disconnect,
      signTransaction,
      config.networkPassphrase,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
