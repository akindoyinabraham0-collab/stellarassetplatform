# Stellar Asset Platform

Tokenize real-world assets (real estate, commodities, art) on Stellar Soroban — enabling fractional ownership, instant transfer, dividends, and global access.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Smart Contract](#smart-contract)
- [Frontend](#frontend)
- [CLI](#cli)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Use Cases](#use-cases)
- [License](#license)

---

## Problem

Real-world assets like real estate, commodities, and fine art suffer from:

- **Illiquidity** — selling a property takes months
- **High barriers** — minimum investments of $10k+
- **Slow settlement** — cross-border transfers take days
- **Opacity** — ownership records are fragmented

## Solution

Tokenize assets on Stellar Soroban:

- **Fractional ownership** — buy/sell any fraction of an asset
- **Fast settlement** — 3–5 seconds, 24/7
- **Global access** — anyone with an internet connection
- **Transparent** — all ownership on-chain
- **Dividends** — distribute rental income / yield to token holders
- **Compliance** — freeze addresses, pause transfers in emergencies

## Features

### Smart Contract (Rust / Soroban)

| Category | Functions |
|----------|-----------|
| **Token (ERC-20-like)** | `balance`, `total_supply`, `transfer`, `approve`, `allowance`, `transfer_from`, `burn` |
| **Admin** | `initialize`, `mint`, `freeze`/`unfreeze`, `pause`/`unpause` |
| **Metadata** | `metadata`, `set_metadata`, `name`, `symbol`, `decimals` |
| **Dividends** | `deposit_dividend`, `claim_dividend`, `unclaimed_dividends` |
| **Events** | `transfer`, `approve`, `mint`, `burn`, `dividend`, `xfer_from` |

### Frontend (React + Vite + TypeScript)

| Tab | Features |
|-----|----------|
| **Dashboard** | Load asset by contract ID, view metadata, balance, total supply, pause status, linked documents |
| **Mint** | Admin-only token minting to any address |
| **Transfer** | Direct transfers + allowance-based transfers (`transfer_from`) via mode toggle |
| **Burn** | Token holders can destroy their own tokens |
| **Admin** | Freeze/unfreeze, pause/unpause, approve spenders, deposit dividends, claim dividends, update metadata |

### CLI (Rust)

All contract operations available as CLI commands that execute `soroban` directly — deploy, initialize, mint, transfer, freeze, pause, dividends, and more.

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
                                     │
                          ┌──────────▼──────────┐
                          │   CLI (asset-cli)    │
                          │  Rust -> soroban    │
                          └─────────────────────┘
```

## Project Structure

```
StellarAssetPlatform/
├── contracts/asset_token/       # Soroban smart contract (Rust)
│   ├── src/
│   │   ├── lib.rs               # Full token + asset management (462 lines)
│   │   └── test.rs              # 22 unit tests
│   └── Cargo.toml
├── frontend/                    # React + Vite + Freighter
│   ├── src/
│   │   ├── App.tsx              # Main app with tab navigation
│   │   ├── App.css              # Dark-theme styling
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx    # Freighter wallet connection
│   │   │   ├── AssetDashboard.tsx   # Asset metadata & balance display
│   │   │   ├── MintAsset.tsx        # Token minting form
│   │   │   ├── TransferAsset.tsx    # Direct + allowance transfers
│   │   │   ├── BurnAsset.tsx        # Token burning form
│   │   │   └── AdminPanel.tsx       # Freeze, pause, dividends, metadata
│   │   └── utils/
│   │       ├── contract.ts      # Soroban RPC client (all read/write calls)
│   │       └── index.ts         # Barrel exports
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── cli/                         # Rust CLI (executes soroban commands)
│   ├── src/main.rs
│   └── Cargo.toml
├── scripts/
│   ├── deploy.ps1               # One-click deploy script
│   └── test.ps1                 # Run contract tests
├── .env.example                 # Environment variable template
├── .gitignore
└── README.md
```

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Rust](https://rustup.rs) | latest stable | Compile contract & CLI |
| [Node.js](https://nodejs.org) | >= 18 | Frontend |
| [npm](https://npmjs.com) | >= 9 | Frontend dependencies |
| [Freighter Wallet](https://freighter.app) | latest | Browser extension for signing |
| [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) | latest | Deploy & invoke contracts (`cargo install soroban-cli`) |

## Quick Start

### 1. Build & Test Contract

```bash
cd contracts/asset_token
cargo build --release
cargo test
```

### 2. Deploy to Testnet

Use the deploy script (recommended):

```powershell
.\scripts\deploy.ps1 -Admin GABC...
```

Or manually:

```bash
# Deploy wasm
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/asset_token.wasm \
  --source <SECRET> \
  --network testnet

# Initialize asset
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

### 3. Configure Environment

```bash
cp .env.example frontend/.env
# Edit frontend/.env if needed (defaults point to testnet)
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, connect Freighter, enter your contract ID.

## Smart Contract

The `AssetToken` contract (`contracts/asset_token/src/lib.rs`) implements a full tokenized asset system on Soroban.

### Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 1 | `AlreadyInitialized` | Contract already initialized |
| 2 | `NotInitialized` | Contract not yet initialized |
| 3 | `OnlyAdmin` | Caller is not the contract admin |
| 4 | `InsufficientBalance` | Not enough tokens to transfer/burn |
| 5 | `InsufficientAllowance` | Spender allowance exceeded |
| 6 | `Frozen` | Address is frozen |
| 7 | `ContractPaused` | All transfers paused |
| 8 | `NoDividends` | No dividends to claim or supply is zero |
| 9 | `InvalidAmount` | Amount must be positive |
| 10 | `SelfTransfer` | Cannot transfer to self |

### Token Interface

| Function | Parameters | Auth | Description |
|----------|-----------|------|-------------|
| `balance(owner)` | `Address` | — | Query token balance |
| `total_supply()` | — | — | Total tokens minted |
| `transfer(from, to, amount)` | `Address, Address, i128` | `from` | Send tokens |
| `approve(owner, spender, amount)` | `Address, Address, i128` | `owner` | Allow spender allowance |
| `allowance(owner, spender)` | `Address, Address` | — | Check allowance |
| `transfer_from(spender, from, to, amount)` | `Address, Address, Address, i128` | `spender` | Spend allowance |
| `burn(from, amount)` | `Address, i128` | `from` | Destroy tokens |
| `decimals()` | — | — | Returns 7 |

### Admin Interface

| Function | Parameters | Auth | Description |
|----------|-----------|------|-------------|
| `initialize(...)` | `admin, name, symbol, desc, type, location, valuation, shares, docs` | `admin` | Set up asset |
| `mint(admin, to, amount)` | `Address, Address, i128` | `admin` | Issue new tokens |
| `freeze(admin, target)` | `Address, Address` | `admin` | Freeze an address |
| `unfreeze(admin, target)` | `Address, Address` | `admin` | Unfreeze an address |
| `pause(admin)` | `Address` | `admin` | Pause all transfers |
| `unpause(admin)` | `Address` | `admin` | Resume transfers |

### Metadata

| Function | Parameters | Auth | Description |
|----------|-----------|------|-------------|
| `metadata()` | — | — | View full asset details |
| `set_metadata(admin, ...)` | Same as `initialize` | `admin` | Update asset info |
| `name()` | — | — | Asset name |
| `symbol()` | — | — | Asset symbol |

### Dividends

| Function | Parameters | Auth | Description |
|----------|-----------|------|-------------|
| `deposit_dividend(admin, amount)` | `Address, i128` | `admin` | Deposit yield to distribute |
| `claim_dividend(holder)` | `Address` | `holder` | Claim accrued dividends |
| `unclaimed_dividends(holder)` | `Address` | — | Check pending dividends |

Dividends use a per-share accounting model. Each time the admin deposits, the `dividend_per_share` increases proportionally. Holders claim their share based on their token balance × the per-share delta since their last claim.

## Frontend

### Tab Reference

#### Dashboard
Enter a contract ID and load asset data. Displays name, symbol, description, type, location, valuation, total shares, total supply, your balance, pause status, and linked documents.

#### Mint
Admin-only. Enter a recipient address and amount to mint new tokens.

#### Transfer
Two modes switchable via toggle:

- **Direct Transfer** — send tokens from your wallet to another address
- **Allowance Transfer** — transfer tokens on behalf of an address that approved you (calls `transfer_from`)

#### Burn
Destroy tokens from your own balance. Enter an amount and confirm.

#### Admin
All admin operations in one place:

- **Freeze / Unfreeze** — restrict/restore an address
- **Pause / Unpause** — emergency stop / resume all transfers
- **Approve Spender** — grant allowance to another address
- **Dividends** — deposit yield (admin) or claim your share (any holder)
- **Update Metadata** — modify name, symbol, description, type, location, valuation, shares, and document URIs

### RPC Client

All contract interactions go through `frontend/src/utils/contract.ts`, which handles:

- **Read operations** — simulated via `server.simulateContract`
- **Write operations** — built, signed via Freighter, submitted, and polled until confirmation

The RPC URL and network are configurable via environment variables (defaults to Testnet).

## CLI

The CLI (`cli/`) executes `soroban contract invoke` commands directly instead of just printing them.

### Build

```bash
cd cli
cargo build --release
```

### Usage

```bash
# Get asset info
./asset-cli info -c <CONTRACT_ID>

# Mint tokens
./asset-cli mint -c <CONTRACT_ID> -t <TO> -a 1000 -s <SOURCE>

# Transfer
./asset-cli transfer -c <CONTRACT_ID> -f <FROM> -t <TO> -a 100 -s <SOURCE>

# Check balance
./asset-cli balance -c <CONTRACT_ID> -a <ADDRESS>

# Freeze / Unfreeze
./asset-cli freeze -c <CONTRACT_ID> -t <TARGET> -s <SOURCE>
./asset-cli unfreeze -c <CONTRACT_ID> -t <TARGET> -s <SOURCE>

# Pause / Unpause
./asset-cli pause -c <CONTRACT_ID> -s <SOURCE>
./asset-cli unpause -c <CONTRACT_ID> -s <SOURCE>

# Dividends
./asset-cli dividend -c <CONTRACT_ID> -a 5000 -s <SOURCE>
./asset-cli claim -c <CONTRACT_ID> -h <HOLDER>

# Deploy & initialize
./asset-cli init \
  --admin G... \
  --name "Manhattan Tower" \
  --symbol MHT \
  --description "..." \
  --type RealEstate \
  --location "New York, USA" \
  --valuation 50000000000000000 \
  --shares 100000 \
  --documents "ipfs://QmX..." \
  --wasm target/wasm32-unknown-unknown/release/asset_token.wasm
```

All commands accept `--network` (default: `testnet`) and `--rpc` (optional custom endpoint).

## Environment Configuration

Copy `.env.example` to `frontend/.env`:

```env
# Soroban RPC endpoint (default: https://soroban-testnet.stellar.org)
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Stellar network passphrase (TESTNET or PUBLIC)
VITE_STELLAR_NETWORK=TESTNET
```

The frontend reads these at build time via Vite's `import.meta.env`. Both fall back to Testnet defaults if unset.

## Deployment

### Scripted Deploy

```powershell
.\scripts\deploy.ps1 -Admin GABC... -Name "Manhattan Tower" -Symbol MHT -Description "..." -Type RealEstate -Location "New York, USA" -Valuation 50000000000000000 -Shares 100000 -Documents "ipfs://QmX..."
```

The script (`scripts/deploy.ps1`) automates:

1. Building the contract wasm
2. Deploying to the specified network
3. Initializing the asset with full metadata
4. Verifying the deployment

### Manual Deploy

See [Quick Start > Deploy to Testnet](#2-deploy-to-testnet).

## Testing

### Contract Tests

```bash
cd contracts/asset_token
cargo test
```

22 unit tests covering:

| Test | Description |
|------|-------------|
| `test_initialize` | Basic initialization |
| `test_double_init` | Re-initialization rejected |
| `test_mint` | Token minting |
| `test_transfer` | Basic transfer |
| `test_insufficient_balance` | Transfer with insufficient balance |
| `test_self_transfer` | Self-transfer rejected |
| `test_approve_transfer_from` | Allowance + transfer_from flow |
| `test_insufficient_allowance` | Overspend rejected |
| `test_burn` | Token burning |
| `test_freeze` | Freeze blocks transfer |
| `test_unfreeze` | Unfreeze restores transfer |
| `test_pause` | Pause blocks all transfers |
| `test_unpause` | Unpause resumes transfers |
| `test_dividend` | Deposit + claim flow |
| `test_metadata_update` | set_metadata works |
| `test_non_admin_mint` | Non-admin mint rejected |
| `test_events` | Events emitted on transfer |
| `test_multiple_mints` | Multiple mints accumulate |
| `test_approve_zero` | Allowance set to zero |
| `test_decimals` | Returns 7 |
| `test_name_symbol` | name() and symbol() |

### Test Script

```powershell
.\scripts\test.ps1
```

## Use Cases

- **Real estate** — Tokenize property, distribute rental dividends
- **Commodities** — Gold, silver, oil backed tokens
- **Art** — Fractionalize high-value artwork
- **Carbon credits** — Tokenized verified offsets
- **Invoice factoring** — Trade receivables as tokens

## License

MIT
