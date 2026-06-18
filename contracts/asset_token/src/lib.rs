#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, symbol_short,
    Address, Env, Map, String, Vec,
};

#[derive(Debug, Clone, PartialEq)]
#[contracttype]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    OnlyAdmin = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    Frozen = 6,
    ContractPaused = 7,
    NoDividends = 8,
    InvalidAmount = 9,
    SelfTransfer = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetMetadata {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub asset_type: String,
    pub location: String,
    pub valuation: i128,
    pub total_shares: i128,
    pub documents: Vec<String>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Metadata,
    Balance(Address),
    Allowance(Address, Address),
    Frozen(Address),
    Paused,
    TotalSupply,
    DividendPerShare,
    DividendBalance(Address),
    PaidDividends(Address),
    TotalDividends,
}

pub const DECIMALS: u32 = 7;

#[contract]
pub struct AssetToken;

#[contractimpl]
impl AssetToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        description: String,
        asset_type: String,
        location: String,
        valuation: i128,
        total_shares: i128,
        documents: Vec<String>,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        env.storage().instance().set(&DataKey::DividendPerShare, &0i128);
        env.storage().instance().set(&DataKey::TotalDividends, &0i128);

        let metadata = AssetMetadata {
            name,
            symbol,
            description,
            asset_type,
            location,
            valuation,
            total_shares,
            documents,
        };
        env.storage().instance().set(&DataKey::Metadata, &metadata);
    }

    // ---- Metadata ----

    pub fn metadata(env: Env) -> AssetMetadata {
        env.storage()
            .instance()
            .get(&DataKey::Metadata)
            .expect("not initialized")
    }

    pub fn set_metadata(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        description: String,
        asset_type: String,
        location: String,
        valuation: i128,
        total_shares: i128,
        documents: Vec<String>,
    ) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        let metadata = AssetMetadata {
            name,
            symbol,
            description,
            asset_type,
            location,
            valuation,
            total_shares,
            documents,
        };
        env.storage().instance().set(&DataKey::Metadata, &metadata);
    }

    pub fn name(env: Env) -> String {
        let m = Self::metadata(env);
        m.name
    }

    pub fn symbol(env: Env) -> String {
        let m = Self::metadata(env);
        m.symbol
    }

    pub fn decimals(env: Env) -> u32 {
        DECIMALS
    }

    // ---- Token ----

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn balance(env: Env, owner: Address) -> i128 {
        Self::get_balance(&env, &owner)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        if from == to {
            panic_with_error!(&env, Error::SelfTransfer);
        }
        from.require_auth();
        Self::require_not_frozen(&env, &from);
        Self::require_not_paused(&env);

        let from_bal = Self::get_balance(&env, &from);
        if from_bal < amount {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        Self::set_balance(&env, &from, from_bal - amount);
        let to_bal = Self::get_balance(&env, &to);
        Self::set_balance(&env, &to, to_bal + amount);

        env.events().publish(
            (symbol_short!("transfer"), from, to),
            amount,
        );
    }

    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128) {
        if amount < 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        owner.require_auth();
        Self::require_not_frozen(&env, &owner);
        Self::require_not_paused(&env);

        env.storage()
            .instance()
            .set(&DataKey::Allowance(owner.clone(), spender.clone()), &amount);

        env.events().publish(
            (symbol_short!("approve"), owner, spender),
            amount,
        );
    }

    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Allowance(owner, spender))
            .unwrap_or(0)
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        if from == to {
            panic_with_error!(&env, Error::SelfTransfer);
        }
        spender.require_auth();
        Self::require_not_frozen(&env, &from);
        Self::require_not_paused(&env);

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, Error::InsufficientAllowance);
        }

        let from_bal = Self::get_balance(&env, &from);
        if from_bal < amount {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        Self::set_balance(&env, &from, from_bal - amount);
        let to_bal = Self::get_balance(&env, &to);
        Self::set_balance(&env, &to, to_bal + amount);

        env.storage()
            .instance()
            .set(
                &DataKey::Allowance(from.clone(), spender.clone()),
                &(allowance - amount),
            );

        env.events().publish(
            (symbol_short!("xfer_from"), spender, from, to),
            amount,
        );
    }

    // ---- Admin: Mint / Burn ----

    pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        admin.require_auth();
        Self::require_admin(&env, &admin);
        Self::require_not_paused(&env);

        let supply = Self::total_supply(env.clone());
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply + amount));

        let bal = Self::get_balance(&env, &to);
        Self::set_balance(&env, &to, bal + amount);

        env.events().publish((symbol_short!("mint"), admin, to), amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        from.require_auth();
        Self::require_not_frozen(&env, &from);
        Self::require_not_paused(&env);

        let bal = Self::get_balance(&env, &from);
        if bal < amount {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        let supply = Self::total_supply(env.clone());
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply - amount));

        Self::set_balance(&env, &from, bal - amount);

        env.events().publish((symbol_short!("burn"), from), amount);
    }

    // ---- Compliance: Freeze / Pause ----

    pub fn freeze(env: Env, admin: Address, target: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::Frozen(target), &true);
    }

    pub fn unfreeze(env: Env, admin: Address, target: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().remove(&DataKey::Frozen(target));
    }

    pub fn is_frozen(env: Env, addr: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Frozen(addr))
            .unwrap_or(false)
    }

    pub fn pause(env: Env, admin: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::Paused, &true);
    }

    pub fn unpause(env: Env, admin: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    // ---- Dividends ----

    pub fn deposit_dividend(env: Env, admin: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        admin.require_auth();
        Self::require_admin(&env, &admin);

        let supply = Self::total_supply(env.clone());
        if supply == 0 {
            panic_with_error!(&env, Error::NoDividends);
        }

        let current_per_share: i128 = env
            .storage()
            .instance()
            .get(&DataKey::DividendPerShare)
            .unwrap_or(0);
        let new_per_share = current_per_share + (amount / supply);
        env.storage()
            .instance()
            .set(&DataKey::DividendPerShare, &new_per_share);

        let total_div: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDividends)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalDividends, &(total_div + amount));
    }

    pub fn claim_dividend(env: Env, holder: Address) {
        holder.require_auth();

        let unclaimed = Self::unclaimed_dividends(env.clone(), holder.clone());
        if unclaimed <= 0 {
            panic_with_error!(&env, Error::NoDividends);
        }

        let paid: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PaidDividends(holder.clone()))
            .unwrap_or(0);
        let dpr: i128 = env
            .storage()
            .instance()
            .get(&DataKey::DividendPerShare)
            .unwrap_or(0);
        let bal = Self::get_balance(&env, &holder);

        env.storage()
            .instance()
            .set(&DataKey::PaidDividends(holder.clone()), &(paid + dpr * bal));

        env.events()
            .publish((symbol_short!("dividend"), holder), unclaimed);
    }

    pub fn unclaimed_dividends(env: Env, holder: Address) -> i128 {
        let dpr: i128 = env
            .storage()
            .instance()
            .get(&DataKey::DividendPerShare)
            .unwrap_or(0);
        let bal = Self::get_balance(&env, &holder);
        let paid: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PaidDividends(holder))
            .unwrap_or(0);
        dpr * bal - paid
    }

    // ---- Internal ----

    fn get_balance(env: &Env, owner: &Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(owner.clone()))
            .unwrap_or(0)
    }

    fn set_balance(env: &Env, owner: &Address, amount: i128) {
        env.storage()
            .instance()
            .set(&DataKey::Balance(owner.clone()), &amount);
    }

    fn require_admin(env: &Env, addr: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if addr != &admin {
            panic_with_error!(env, Error::OnlyAdmin);
        }
    }

    fn require_not_frozen(env: &Env, addr: &Address) {
        let frozen: bool = env
            .storage()
            .instance()
            .get(&DataKey::Frozen(addr.clone()))
            .unwrap_or(false);
        if frozen {
            panic_with_error!(env, Error::Frozen);
        }
    }

    fn require_not_paused(env: &Env) {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            panic_with_error!(env, Error::ContractPaused);
        }
    }
}

mod test;
