use clap::{Parser, Subcommand};
use std::process::Command;

#[derive(Parser)]
#[command(name = "asset-cli", about = "CLI for interacting with Stellar tokenized assets")]
struct Cli {
    #[arg(short, long, default_value = "testnet")]
    network: String,

    #[arg(short, long)]
    rpc: Option<String>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Deploy contract and initialize
    Init {
        #[arg(long)]
        admin: String,

        #[arg(long)]
        name: String,

        #[arg(long)]
        symbol: String,

        #[arg(long)]
        description: String,

        #[arg(long = "type")]
        asset_type: String,

        #[arg(long)]
        location: String,

        #[arg(long)]
        valuation: i128,

        #[arg(long)]
        shares: i128,

        #[arg(long)]
        documents: Vec<String>,

        #[arg(long)]
        wasm: String,
    },

    /// Get asset metadata
    Info {
        #[arg(short, long)]
        contract: String,
    },

    /// Mint tokens
    Mint {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        to: String,

        #[arg(short, long)]
        amount: i128,

        #[arg(short, long)]
        source: String,
    },

    /// Transfer tokens
    Transfer {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        from: String,

        #[arg(short, long)]
        to: String,

        #[arg(short, long)]
        amount: i128,

        #[arg(short, long)]
        source: String,
    },

    /// Check balance
    Balance {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        address: String,
    },

    /// Freeze an address
    Freeze {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        target: String,

        #[arg(short, long)]
        source: String,
    },

    /// Unfreeze an address
    Unfreeze {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        target: String,

        #[arg(short, long)]
        source: String,
    },

    /// Pause the contract
    Pause {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        source: String,
    },

    /// Unpause the contract
    Unpause {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        source: String,
    },

    /// Deposit dividends
    Dividend {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        amount: i128,

        #[arg(short, long)]
        source: String,
    },

    /// Claim dividends
    Claim {
        #[arg(short, long)]
        contract: String,

        #[arg(short, long)]
        holder: String,
    },
}

fn exec(args: &[&str]) {
    println!("> soroban {}", args.join(" "));
    let status = Command::new("soroban")
        .args(args)
        .status()
        .expect("Failed to run soroban CLI. Is it installed?");
    if !status.success() {
        eprintln!("Command exited with code {:?}", status.code());
    }
}

fn main() {
    let cli = Cli::parse();
    let network = &cli.network;

    match &cli.command {
        Commands::Init {
            admin,
            name,
            symbol,
            description,
            asset_type,
            location,
            valuation,
            shares,
            documents,
            wasm,
        } => {
            println!("=== Deploying Asset ===");
            println!("Name: {name} ({symbol})");
            println!("Type: {asset_type}");
            println!("Location: {location}");
            println!("Valuation: {valuation}");
            println!("Total Shares: {shares}");

            println!("\nStep 1: Deploy contract");
            exec(&[
                "contract", "deploy",
                "--wasm", wasm,
                "--source", admin,
                "--network", network,
            ]);

            println!("\nStep 2: Initialize");
            let docs_str = documents
                .iter()
                .map(|d| format!("\"{}\"", d))
                .collect::<Vec<_>>()
                .join(", ");
            exec(&[
                "contract", "invoke",
                "--id", "<CONTRACT_ID>",
                "--fn", "initialize",
                "--source", admin,
                "--network", network,
                "--arg", admin,
                "--arg", &format!("\"{name}\""),
                "--arg", &format!("\"{symbol}\""),
                "--arg", &format!("\"{description}\""),
                "--arg", &format!("\"{asset_type}\""),
                "--arg", &format!("\"{location}\""),
                "--arg", &valuation.to_string(),
                "--arg", &shares.to_string(),
                "--arg", &format!("[{docs_str}]"),
            ]);
        }

        Commands::Info { contract } => {
            println!("Fetching metadata for {contract}...");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "metadata",
                "--network", network,
            ]);
        }

        Commands::Mint {
            contract,
            to,
            amount,
            source,
        } => {
            println!("Minting {amount} to {to}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "mint",
                "--source", source,
                "--network", network,
                "--arg", source,
                "--arg", to,
                "--arg", &amount.to_string(),
            ]);
        }

        Commands::Transfer {
            contract,
            from,
            to,
            amount,
            source,
        } => {
            println!("Transferring {amount} from {from} to {to}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "transfer",
                "--source", source,
                "--network", network,
                "--arg", from,
                "--arg", to,
                "--arg", &amount.to_string(),
            ]);
        }

        Commands::Balance { contract, address } => {
            println!("Checking balance for {address}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "balance",
                "--network", network,
                "--arg", address,
            ]);
        }

        Commands::Freeze {
            contract,
            target,
            source,
        } => {
            println!("Freezing {target}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "freeze",
                "--source", source,
                "--network", network,
                "--arg", source,
                "--arg", target,
            ]);
        }

        Commands::Unfreeze {
            contract,
            target,
            source,
        } => {
            println!("Unfreezing {target}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "unfreeze",
                "--source", source,
                "--network", network,
                "--arg", source,
                "--arg", target,
            ]);
        }

        Commands::Pause { contract, source } => {
            println!("Pausing contract {contract}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "pause",
                "--source", source,
                "--network", network,
                "--arg", source,
            ]);
        }

        Commands::Unpause { contract, source } => {
            println!("Unpausing contract {contract}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "unpause",
                "--source", source,
                "--network", network,
                "--arg", source,
            ]);
        }

        Commands::Dividend {
            contract,
            amount,
            source,
        } => {
            println!("Depositing {amount} dividend to {contract}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "deposit_dividend",
                "--source", source,
                "--network", network,
                "--arg", source,
                "--arg", &amount.to_string(),
            ]);
        }

        Commands::Claim { contract, holder } => {
            println!("Claiming dividends for {holder}");
            exec(&[
                "contract", "invoke",
                "--id", contract,
                "--fn", "claim_dividend",
                "--source", holder,
                "--network", network,
                "--arg", holder,
            ]);
        }
    }
}