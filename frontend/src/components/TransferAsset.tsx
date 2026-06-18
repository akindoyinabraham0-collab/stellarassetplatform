import React, { useState } from "react";
import { transfer, transferFrom } from "../utils/contract";

interface Props {
  contractId: string;
  pubKey: string;
  onSuccess: () => void;
}

type Mode = "direct" | "allowance";

export default function TransferAsset({ contractId, pubKey, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("direct");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!to || !amount) return;
    setLoading(true);
    setStatus(null);
    try {
      const amt = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
      let hash: string;
      if (mode === "direct") {
        hash = await transfer(pubKey, contractId, pubKey, to, amt);
      } else {
        if (!from) return;
        hash = await transferFrom(pubKey, contractId, from, to, amt);
      }
      setStatus(`Transferred ${amount} tokens. Hash: ${hash.slice(0, 16)}...`);
      onSuccess();
    } catch (e: any) {
      setStatus(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-panel">
      <h2>Transfer Tokens</h2>

      <div className="mode-toggle">
        <button
          className={mode === "direct" ? "active" : ""}
          onClick={() => setMode("direct")}
        >
          Direct Transfer
        </button>
        <button
          className={mode === "allowance" ? "active" : ""}
          onClick={() => setMode("allowance")}
        >
          Allowance Transfer
        </button>
      </div>

      {mode === "direct" && (
        <p className="note">Send tokens directly from your wallet</p>
      )}
      {mode === "allowance" && (
        <p className="note">Transfer tokens on behalf of an account that approved you</p>
      )}

      {mode === "allowance" && (
        <>
          <label>From (owner) address</label>
          <input
            type="text"
            placeholder="G..."
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </>
      )}

      <label>Recipient address</label>
      <input
        type="text"
        placeholder="G..."
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <label>Amount (in tokens)</label>
      <input
        type="number"
        placeholder="10"
        step="0.0000001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleTransfer}
        disabled={loading || !to || !amount || (mode === "allowance" && !from)}
      >
        {loading ? "Signing & Sending..." : mode === "direct" ? "Transfer" : "Transfer From"}
      </button>

      {status && <p className={status.startsWith("Error") ? "status error" : "status"}>{status}</p>}
    </div>
  );
}
