# Resolve App

Reference web application for **Resolve** — binary YES/NO prediction markets on Stellar (Soroban).

## Architecture

```text
Wallet → resolve-app → @resolve-protocol/sdk → Soroban RPC → Resolve Contract → Token (SEP-41)
                              ↑
                    resolve-indexer (events only; not settlement authority)
```

| Path | Role |
|------|------|
| Wallet | User auth + transaction signing (`@creit.tech/stellar-wallets-kit`) |
| App | UI, validation, tx review, discovery |
| SDK | Contract reads/writes |
| RPC | Authoritative chain state |
| Indexer | Market lists / portfolio discovery from events |

**The indexer is never authority for settlement.** Claims, stakes, and create-market always go through the SDK to the contract. If RPC or the indexer fails, the UI shows an error — it does not invent pools or balances.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- `@resolve-protocol/sdk` via `file:../resolve-sdk`
- Stellar Wallets Kit for Freighter and other wallets

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Market discovery (indexer) |
| `/markets/[id]` | Market detail, stake, claim/refund |
| `/create` | Create market |
| `/portfolio` | Positions by category |

## Setup

### Prerequisites

- Node.js 20+
- Built sibling SDK: `cd ../resolve-sdk && npm install && npm run build`
- Optional indexer running (default `http://localhost:3080`)

### Install & run

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SOROBAN_RPC_URL, NEXT_PUBLIC_RESOLVE_CONTRACT_ID,
# NEXT_PUBLIC_SETTLEMENT_TOKEN_ID, NEXT_PUBLIC_INDEXER_API_URL, etc.

npm install
# On Windows, if a nested package postinstall fails with `yarn setup || true`:
#   npm install --ignore-scripts

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |

## Configuration

All browser config uses `NEXT_PUBLIC_*` variables (see `.env.example`):

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=
NEXT_PUBLIC_HORIZON_URL=
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_RESOLVE_CONTRACT_ID=
NEXT_PUBLIC_INDEXER_API_URL=http://localhost:3080
NEXT_PUBLIC_SETTLEMENT_TOKEN_ID=
```

## Wallet / transaction UX

The app handles disconnected, connecting, wrong network, rejected signatures, failed transactions, pending confirmation, confirmed, insufficient balance, and mapped contract errors (`parseResolveError`). Stake, create, and claim flows show a **review summary** before the wallet prompt.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
