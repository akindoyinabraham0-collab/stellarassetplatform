import React, { useState } from "react";
import { mint } from "../utils/contract";

interface Props {
  contractId: string;
  pubKey: string;
  onSuccess: () => void;
}

export default function MintAsset({ contractId, pubKey, onSuccess }: Props) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!to || !amount) return;
    setLoading(true);
    setStatus(null);
    try {
      const amt = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
      const hash = await mint(pubKey, contractId, to, amt);
      setStatus(`Minted ${amount} tokens. Hash: ${hash.slice(0, 16)}...`);
      onSuccess();
    } catch (e: any) {
      setStatus(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mint-panel">
      <h2>Mint Tokens</h2>
      <p className="note">Admin only: issue new tokens representing asset shares</p>

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
        placeholder="100"
        step="0.0000001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleMint} disabled={loading || !to || !amount}>
        {loading ? "Signing & Sending..." : "Mint"}
      </button>

      {status && <p className={status.startsWith("Error") ? "status error" : "status"}>{status}</p>}
    </div>
  );
}
