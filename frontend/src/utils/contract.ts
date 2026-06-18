import {
  SorobanRpc,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Networks,
  xdr,
} from "@stellar/stellar-sdk";
import { getPublicKey, signTransaction } from "@stellar/freighter-api";

const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;

export interface AssetMetadata {
  name: string;
  symbol: string;
  description: string;
  asset_type: string;
  location: string;
  valuation: number;
  total_shares: number;
  documents: string[];
}

const server = new SorobanRpc.Server(RPC_URL);

// ---- Helpers ----

function addressToScVal(addr: string) {
  return new xdr.ScVal(xdr.ScValType.scvAddress(), [
    xdr.ScAddress(xdr.ScAddressType.scAddressTypeAccount(), addr),
  ]);
}

function i128ToScVal(n: number | bigint) {
  const val = BigInt(n);
  const hi = val >> 64n;
  const lo = val & 0xffffffffffffffffn;
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts(
      { lo: xdr.Uint64.fromString(lo.toString()), hi: xdr.Uint64.fromString(hi.toString()) }
    )
  );
}

function scvToAddress(scv: xdr.ScVal): string {
  return scv.address().accountId()!;
}

function scvToI128(scv: xdr.ScVal): bigint {
  const parts = scv.i128();
  const hi = BigInt(parts.hi().toString());
  const lo = BigInt(parts.lo().toString());
  return (hi << 64n) | lo;
}

function scvToString(scv: xdr.ScVal): string {
  return scv.str().toString();
}

function scvToVec(scv: xdr.ScVal): xdr.ScVal[] {
  return scv.vec() || [];
}

// ---- Wallet ----

export async function connectWallet(): Promise<string> {
  return await getPublicKey();
}

// ---- Contract reads (simulate) ----

async function simulateCall<T>(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  parser: (scv: xdr.ScVal) => T
): Promise<T> {
  const result = await server.simulateContract(contractId, method, args);
  if (!result.result) {
    throw new Error(`Simulate failed for ${method}: no result`);
  }
  return parser(result.result.retval);
}

// ---- Contract writes (build + sign + submit) ----

async function submitTx(
  source: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const account = await server.getAccount(source);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contractId,
        function: method,
        args,
      })
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await signTransaction(prepared.toXDR(), {
    network: "TESTNET",
  });
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${sendResult.errorResult}`);
  }

  // Poll for completion
  for (let i = 0; i < 30; i++) {
    const status = await server.getTransaction(sendResult.hash);
    if (status.status === "SUCCESS") return sendResult.hash;
    if (status.status === "FAILED") throw new Error("Transaction failed");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction timeout");
}

// ---- Specific calls ----

export async function getMetadata(
  contractId: string
): Promise<AssetMetadata> {
  const meta = await simulateCall(contractId, "metadata", [], (scv) => {
    const fields = scv.map()!;
    const toStr = (v: xdr.ScVal) => scvToString(v);

    const docVec = fields.get(nativeToScVal("documents"))!;
    const docs = scvToVec(docVec).map(scvToString);

    return {
      name: toStr(fields.get(nativeToScVal("name"))!),
      symbol: toStr(fields.get(nativeToScVal("symbol"))!),
      description: toStr(fields.get(nativeToScVal("description"))!),
      asset_type: toStr(fields.get(nativeToScVal("asset_type"))!),
      location: toStr(fields.get(nativeToScVal("location"))!),
      valuation: Number(scvToI128(fields.get(nativeToScVal("valuation"))!)),
      total_shares: Number(
        scvToI128(fields.get(nativeToScVal("total_shares"))!)
      ),
      documents: docs,
    };
  });
  return meta;
}

export async function getBalance(
  contractId: string,
  address: string
): Promise<bigint> {
  return simulateCall(contractId, "balance", [nativeToScVal(address)], (scv) =>
    scvToI128(scv)
  );
}

export async function getTotalSupply(contractId: string): Promise<bigint> {
  return simulateCall(contractId, "total_supply", [], (scv) =>
    scvToI128(scv)
  );
}

export async function getAllowance(
  contractId: string,
  owner: string,
  spender: string
): Promise<bigint> {
  return simulateCall(
    contractId,
    "allowance",
    [nativeToScVal(owner), nativeToScVal(spender)],
    (scv) => scvToI128(scv)
  );
}

export async function isFrozen(
  contractId: string,
  address: string
): Promise<boolean> {
  return simulateCall(contractId, "is_frozen", [nativeToScVal(address)], (scv) =>
    scv["_value"] === true
  );
}

export async function isPaused(contractId: string): Promise<boolean> {
  return simulateCall(contractId, "is_paused", [], (scv) =>
    scv["_value"] === true
  );
}

export async function transfer(
  source: string,
  contractId: string,
  from: string,
  to: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "transfer", [
    nativeToScVal(from),
    nativeToScVal(to),
    i128ToScVal(amount),
  ]);
}

export async function mint(
  source: string,
  contractId: string,
  to: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "mint", [
    nativeToScVal(source),
    nativeToScVal(to),
    i128ToScVal(amount),
  ]);
}

export async function burn(
  source: string,
  contractId: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "burn", [
    nativeToScVal(source),
    i128ToScVal(amount),
  ]);
}

export async function approve(
  source: string,
  contractId: string,
  spender: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "approve", [
    nativeToScVal(source),
    nativeToScVal(spender),
    i128ToScVal(amount),
  ]);
}

export async function freeze(
  source: string,
  contractId: string,
  target: string
): Promise<string> {
  return submitTx(source, contractId, "freeze", [
    nativeToScVal(source),
    nativeToScVal(target),
  ]);
}

export async function unfreeze(
  source: string,
  contractId: string,
  target: string
): Promise<string> {
  return submitTx(source, contractId, "unfreeze", [
    nativeToScVal(source),
    nativeToScVal(target),
  ]);
}

export async function claimDividend(
  source: string,
  contractId: string
): Promise<string> {
  return submitTx(source, contractId, "claim_dividend", [
    nativeToScVal(source),
  ]);
}

export async function depositDividend(
  source: string,
  contractId: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "deposit_dividend", [
    nativeToScVal(source),
    i128ToScVal(amount),
  ]);
}

export async function pause(
  source: string,
  contractId: string
): Promise<string> {
  return submitTx(source, contractId, "pause", [
    nativeToScVal(source),
  ]);
}

export async function unpause(
  source: string,
  contractId: string
): Promise<string> {
  return submitTx(source, contractId, "unpause", [
    nativeToScVal(source),
  ]);
}

export async function setMetadata(
  source: string,
  contractId: string,
  name: string,
  symbol: string,
  description: string,
  assetType: string,
  location: string,
  valuation: bigint,
  totalShares: bigint,
  documents: string[]
): Promise<string> {
  return submitTx(source, contractId, "set_metadata", [
    nativeToScVal(source),
    nativeToScVal(name),
    nativeToScVal(symbol),
    nativeToScVal(description),
    nativeToScVal(assetType),
    nativeToScVal(location),
    i128ToScVal(valuation),
    i128ToScVal(totalShares),
    nativeToScVal(documents),
  ]);
}

export async function transferFrom(
  source: string,
  contractId: string,
  from: string,
  to: string,
  amount: bigint
): Promise<string> {
  return submitTx(source, contractId, "transfer_from", [
    nativeToScVal(source),
    nativeToScVal(from),
    nativeToScVal(to),
    i128ToScVal(amount),
  ]);
}

export async function getUnclaimedDividends(
  contractId: string,
  holder: string
): Promise<bigint> {
  return simulateCall(contractId, "unclaimed_dividends", [nativeToScVal(holder)], (scv) =>
    scvToI128(scv)
  );
}
