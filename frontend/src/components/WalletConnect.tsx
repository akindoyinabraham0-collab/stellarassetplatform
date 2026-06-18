import React, { useState } from "react";
import { connectWallet } from "../utils/contract";

interface Props {
  onConnect: (pubKey: string) => void;
  pubKey: string | null;
}

export default function WalletConnect({ onConnect, pubKey }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const key = await connectWallet();
      onConnect(key);
    } catch (e: any) {
      setError(e.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  if (pubKey) {
    return (
      <div className="wallet-connected">
        <span className="badge">Connected</span>
        <code>{pubKey.slice(0, 6)}...{pubKey.slice(-4)}</code>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button onClick={handleConnect} disabled={connecting}>
        {connecting ? "Connecting..." : "Connect Freighter"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
