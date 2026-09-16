"use client";

import { WalletProvider } from "@/lib/wallet";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
