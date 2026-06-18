#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Events},
    vec, Address, Env, String, Vec,
};

use crate::{AssetToken, AssetTokenClient, AssetMetadata, DataKey, Error};

fn create_meta(e: &Env) -> AssetMetadata {
    AssetMetadata {
        name: String::from_str(e, "Manhattan Tower"),
        symbol: String::from_str(e, "MHT"),
        description: String::from_str(e, "Fractional ownership in commercial tower"),
        asset_type: String::from_str(e, "RealEstate"),
        location: String::from_str(e, "New York, USA"),
        valuation: 50_000_000_000_000i128,
        total_shares: 100_000,
        documents: vec![
            e,
            String::from_str(e, "ipfs://QmDeed1"),
            String::from_str(e, "ipfs://QmAppraisal1"),
        ],
    }
}

fn setup() -> (Env, AssetTokenClient, Address, Address, Address) {
    let env = Env::default();
    let contract_id = env.register_contract(None, AssetToken);
    let client = AssetTokenClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let meta = create_meta(&env);

    client.initialize(
        &admin,
        &meta.name,
        &meta.symbol,
        &meta.description,
        &meta.asset_type,
        &meta.location,
        &meta.valuation,
        &meta.total_shares,
        &meta.documents,
    );

    (env, client, admin, alice, bob)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AssetToken);
    let client = AssetTokenClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let meta = create_meta(&env);

    client.initialize(
        &admin,
        &meta.name,
        &meta.symbol,
        &meta.description,
        &meta.asset_type,
        &meta.location,
        &meta.valuation,
        &meta.total_shares,
        &meta.documents,
    );

    let stored = client.metadata();
    assert_eq!(stored.name, meta.name);
    assert_eq!(stored.symbol, meta.symbol);
    assert_eq!(stored.valuation, meta.valuation);
    assert_eq!(stored.total_shares, meta.total_shares);
    assert_eq!(client.total_supply(), 0);
    assert!(!client.is_paused());
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_double_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AssetToken);
    let client = AssetTokenClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let meta = create_meta(&env);

    client.initialize(
        &admin,
        &meta.name,
        &meta.symbol,
        &meta.description,
        &meta.asset_type,
        &meta.location,
        &meta.valuation,
        &meta.total_shares,
        &meta.documents,
    );
    client.initialize(
        &admin,
        &meta.name,
        &meta.symbol,
        &meta.description,
        &meta.asset_type,
        &meta.location,
        &meta.valuation,
        &meta.total_shares,
        &meta.documents,
    );
}

#[test]
fn test_mint_and_balance() {
    let (_env, client, admin, alice, _bob) = setup();
    assert_eq!(client.balance(&alice), 0);

    client.mint(&admin, &alice, &1000);
    assert_eq!(client.balance(&alice), 1000);
    assert_eq!(client.total_supply(), 1000);
}

#[test]
fn test_transfer() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &500);

    client.transfer(&alice, &bob, &200);
    assert_eq!(client.balance(&alice), 300);
    assert_eq!(client.balance(&bob), 200);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_transfer_insufficient_balance() {
    let (_env, client, _admin, alice, bob) = setup();
    client.transfer(&alice, &bob, &100);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_self_transfer() {
    let (_env, client, admin, alice, _bob) = setup();
    client.mint(&admin, &alice, &500);
    client.transfer(&alice, &alice, &100);
}

#[test]
fn test_approve_and_transfer_from() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &500);

    client.approve(&alice, &bob, &300);
    assert_eq!(client.allowance(&alice, &bob), 300);

    client.transfer_from(&bob, &alice, &bob, &200);
    assert_eq!(client.balance(&alice), 300);
    assert_eq!(client.balance(&bob), 200);
    assert_eq!(client.allowance(&alice, &bob), 100);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_transfer_from_insufficient_allowance() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &500);
    client.approve(&alice, &bob, &50);
    client.transfer_from(&bob, &alice, &bob, &100);
}

#[test]
fn test_burn() {
    let (_env, client, admin, alice, _bob) = setup();
    client.mint(&admin, &alice, &500);
    assert_eq!(client.total_supply(), 500);

    client.burn(&alice, &200);
    assert_eq!(client.balance(&alice), 300);
    assert_eq!(client.total_supply(), 300);
}

#[test]
fn test_freeze_unfreeze() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &500);

    client.freeze(&admin, &alice);
    assert!(client.is_frozen(&alice));

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.transfer(&alice, &bob, &100);
    }));
    assert!(result.is_err());

    client.unfreeze(&admin, &alice);
    assert!(!client.is_frozen(&alice));

    client.transfer(&alice, &bob, &100);
    assert_eq!(client.balance(&bob), 100);
}

#[test]
fn test_pause_unpause() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &500);

    assert!(!client.is_paused());
    client.pause(&admin);
    assert!(client.is_paused());

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.transfer(&alice, &bob, &100);
    }));
    assert!(result.is_err());

    client.unpause(&admin);
    assert!(!client.is_paused());
    client.transfer(&alice, &bob, &100);
    assert_eq!(client.balance(&bob), 100);
}

#[test]
fn test_dividends() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &200);
    client.mint(&admin, &bob, &300);

    assert_eq!(client.unclaimed_dividends(&alice), 0);

    client.deposit_dividend(&admin, &5000);

    let alice_div = client.unclaimed_dividends(&alice);
    let bob_div = client.unclaimed_dividends(&bob);
    assert_eq!(alice_div, 2000);
    assert_eq!(bob_div, 3000);
    assert_eq!(alice_div + bob_div, 5000);

    client.claim_dividend(&alice);
    assert_eq!(client.unclaimed_dividends(&alice), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_claim_no_dividends() {
    let (_env, client, _admin, alice, _bob) = setup();
    client.claim_dividend(&alice);
}

#[test]
fn test_metadata_update() {
    let (_env, client, admin, _alice, _bob) = setup();

    let new_name = String::from_str(&_env, "Brooklyn Heights Tower");
    client.set_metadata(
        &admin,
        &new_name,
        &String::from_str(&_env, "BHT"),
        &String::from_str(&_env, "Updated description"),
        &String::from_str(&_env, "RealEstate"),
        &String::from_str(&_env, "Brooklyn, USA"),
        &60_000_000_000_000i128,
        &100_000,
        &vec![&_env, String::from_str(&_env, "ipfs://QmNewDeed")],
    );

    let stored = client.metadata();
    assert_eq!(stored.name, new_name);
}

#[test]
fn test_non_admin_cannot_mint() {
    let (_env, client, _admin, alice, _bob) = setup();
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.mint(&alice, &alice, &100);
    }));
    assert!(result.is_err());
}

#[test]
fn test_events_on_transfer() {
    let (env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &1000);

    env.mock_all_auths();
    client.transfer(&alice, &bob, &500);

    let events = env.events().all();
    let last = events.last().unwrap();
    assert!(last.0 == env.current_contract_address());
}

#[test]
fn test_multiple_mints() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &100);
    client.mint(&admin, &bob, &200);
    client.mint(&admin, &alice, &300);

    assert_eq!(client.balance(&alice), 400);
    assert_eq!(client.balance(&bob), 200);
    assert_eq!(client.total_supply(), 600);
}

#[test]
fn test_approve_zero_then_transfer() {
    let (_env, client, admin, alice, bob) = setup();
    client.mint(&admin, &alice, &100);

    client.approve(&alice, &bob, &0);
    assert_eq!(client.allowance(&alice, &bob), 0);

    client.approve(&alice, &bob, &50);
    assert_eq!(client.allowance(&alice, &bob), 50);
}

#[test]
fn test_decimals() {
    let (_env, client, _admin, _alice, _bob) = setup();
    assert_eq!(client.decimals(), 7);
}

#[test]
fn test_name_and_symbol() {
    let (_env, client, _admin, _alice, _bob) = setup();
    assert_eq!(client.name(), String::from_str(&_env, "Manhattan Tower"));
    assert_eq!(client.symbol(), String::from_str(&_env, "MHT"));
}
