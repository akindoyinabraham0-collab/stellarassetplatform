import React, { useState } from "react";
import { burn } from "../utils/contract";

interface Props {
  contractId: string;
  pubKey: string;
  onSuccess: () => void;
}

export default function BurnAsset({ contractId, pubKey, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBurn = async () => {
    if (!amount) return;
    setLoading(true);
    setStatus(null);
    try {
      const amt = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
      const hash = await burn(pubKey, contractId, amt);
      setStatus(`Burned ${amount} tokens. Hash: ${hash.slice(0, 16)}...`);
      onSuccess();
    } catch (e: any) {
      setStatus(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mint-panel">
      <h2>Burn Tokens</h2>
      <p className="note">Destroy tokens from your own balance</p>

      <label>Amount (in tokens)</label>
      <input
        type="number"
        placeholder="10"
        step="0.0000001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleBurn} disabled={loading || !amount}>
        {loading ? "Signing & Sending..." : "Burn"}
      </button>

      {status && <p className={status.startsWith("Error") ? "status error" : "status"}>{status}</p>}
    </div>
  );
}