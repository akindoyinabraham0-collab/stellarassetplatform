# Stellar Asset Platform

Tokenize real-world assets (real estate, commodities, art) on Stellar Soroban — enabling fractional ownership, instant transfer, dividends, and global access.

## Problem

Real-world assets like real estate, commodities, and fine art suffer from:
- **Illiquidity** — selling a property takes months
- **High barriers** — minimum investments of $10k+
- **Slow settlement** — cross-border transfers take days
- **Opacity** — ownership records are fragmented

## Solution

Tokenize assets on Stellar Soroban:
- **Fractional ownership** — buy/sell any fraction of an asset
- **Fast settlement** — 3-5 seconds, 24/7
- **Global access** — anyone with an internet connection
- **Transparent** — all ownership on-chain
- **Dividends** — distribute rental income / yield to token holders

## Project Structure

```
StellarAssetPlatform/
├── contracts/asset_token/       # Soroban smart contract (Rust)
│   ├── src/
│   │   ├── lib.rs               # Full token + asset management
│   │   └── test.rs              # 20+ unit tests
│   └── Cargo.toml
├── frontend/                    # React + Vite + Freighter
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── AssetDashboard.tsx
│   │   │   ├── MintAsset.tsx
│   │   │   ├── TransferAsset.tsx
│   │   │   └── AdminPanel.tsx
│   │   └── utils/contract.ts    # Real Soroban RPC calls
│   └── package.json
├── cli/                         # Rust CLI helper
├── scripts/
│   ├── deploy.ps1               # One-click deploy script
│   └── test.ps1                 # Run contract tests
└── README.md
```

## Prerequisites

- [Rust](https://rustup.rs) — for contract & CLI
- [Node.js](https://nodejs.org) >= 18 — for frontend
- [Freighter Wallet](https://freighter.app) — browser extension
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) — `cargo install soroban-cli`

## Quick Start

### 1. Build & Test Contract

```bash
cd contracts/asset_token
cargo build --release
cargo test
```

### 2. Deploy to Testnet

```powershell
# Or use the script:
.\scripts\deploy.ps1 -Admin GABC...
```

Or manually:
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/asset_token.wasm \
  --source <SECRET> \
  --network testnet

soroban contract invoke \
  --id <CONTRACT_ID> --fn initialize \
  --source <SECRET> --network testnet \
  --arg <ADMIN> \
  --arg '"Manhattan Tower"' \
  --arg '"MHT"' \
  --arg '"Fractional ownership in commercial tower"' \
  --arg '"RealEstate"' \
  --arg '"New York, USA"' \
  --arg '50000000000000000' \
  --arg '100000' \
  --arg '["ipfs://QmDeed1", "ipfs://QmAppraisal1"]'
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, connect Freighter, enter contract ID.

## Contract Functions

| Category | Function | Description |
|----------|----------|-------------|
| **Token** | `balance` | Query token balance |
| | `total_supply` | Total tokens minted |
| | `transfer` | Send tokens (with freeze check) |
| | `approve` | Allow spender to use tokens |
| | `transfer_from` | Spender transfers on your behalf |
| | `burn` | Destroy your tokens |
| **Admin** | `mint` | Issue new tokens |
| | `freeze` / `unfreeze` | Freeze/unfreeze an address |
| | `pause` / `unpause` | Emergency pause all transfers |
| **Metadata** | `initialize` | Set up asset |
| | `metadata` | View asset details |
| | `set_metadata` | Update asset info |
| **Dividends** | `deposit_dividend` | Admin deposits yield |
| | `claim_dividend` | Holder claims their share |
| | `unclaimed_dividends` | Check pending dividends |

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│     Frontend        │     │   Soroban RPC    │
│  (React + Vite)     │────▶│  (HTTPS)         │
│  Freighter Wallet   │◀────│  Stellar Network │
└─────────────────────┘     └────────┬─────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  AssetToken Contract │
                          │  ┌────────────────┐ │
                          │  │ Token (ERC-20)  │ │
                          │  │ Metadata       │ │
                          │  │ Freeze/Pause   │ │
                          │  │ Dividends      │ │
                          │  └────────────────┘ │
                          └─────────────────────┘
```

## Use Cases

- **Real estate** — Tokenize property, distribute rental dividends
- **Commodities** — Gold, silver, oil backed tokens
- **Art** — Fractionalize high-value artwork
- **Carbon credits** — Tokenized verified offsets
- **Invoice factoring** — Trade receivables as tokens

## License

MIT
