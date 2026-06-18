import React, { useState, useCallback } from "react";
import WalletConnect from "./components/WalletConnect";
import AssetDashboard from "./components/AssetDashboard";
import MintAsset from "./components/MintAsset";
import TransferAsset from "./components/TransferAsset";
import BurnAsset from "./components/BurnAsset";
import AdminPanel from "./components/AdminPanel";
import {
  AssetMetadata,
  getMetadata,
  getBalance,
  getTotalSupply,
  isPaused,
} from "./utils/contract";
import "./App.css";

export default function App() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [contractId, setContractId] = useState("");
  const [metadata, setMetadata] = useState<AssetMetadata | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "mint" | "transfer" | "burn" | "admin"
  >("dashboard");

  const refreshDashboard = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const [meta, supply, p] = await Promise.all([
        getMetadata(contractId),
        getTotalSupply(contractId),
        isPaused(contractId),
      ]);
      setMetadata(meta);
      setTotalSupply(supply);
      setPaused(p);

      if (pubKey) {
        const bal = await getBalance(contractId, pubKey);
        setBalance(bal);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load asset data");
    } finally {
      setLoading(false);
    }
  }, [contractId, pubKey]);

  const handleConnect = (key: string) => {
    setPubKey(key);
  };

  const handleRefresh = async () => {
    await refreshDashboard();
    if (contractId && pubKey) {
      try {
        const bal = await getBalance(contractId, pubKey);
        setBalance(bal);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Stellar Asset Platform</h1>
        <p className="subtitle">Tokenize real-world assets on Stellar Soroban</p>
        <WalletConnect pubKey={pubKey} onConnect={handleConnect} />
      </header>

      <nav className="tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "mint" ? "active" : ""}
          onClick={() => setActiveTab("mint")}
        >
          Mint
        </button>
        <button
          className={activeTab === "transfer" ? "active" : ""}
          onClick={() => setActiveTab("transfer")}
        >
          Transfer
        </button>
        <button
          className={activeTab === "burn" ? "active" : ""}
          onClick={() => setActiveTab("burn")}
        >
          Burn
        </button>
        <button
          className={activeTab === "admin" ? "active" : ""}
          onClick={() => setActiveTab("admin")}
        >
          Admin
        </button>
      </nav>

      <main>
        {error && <div className="error-banner">{error}</div>}

        {activeTab === "dashboard" && (
          <AssetDashboard
            metadata={metadata}
            balance={balance}
            totalSupply={totalSupply}
            paused={paused}
            contractId={contractId}
            onContractIdChange={setContractId}
            onLoad={refreshDashboard}
            loading={loading}
          />
        )}

        {activeTab === "mint" && pubKey && contractId && (
          <MintAsset
            contractId={contractId}
            pubKey={pubKey}
            onSuccess={handleRefresh}
          />
        )}

        {activeTab === "transfer" && pubKey && contractId && (
          <TransferAsset
            contractId={contractId}
            pubKey={pubKey}
            onSuccess={handleRefresh}
          />
        )}

        {activeTab === "burn" && pubKey && contractId && (
          <BurnAsset
            contractId={contractId}
            pubKey={pubKey}
            onSuccess={handleRefresh}
          />
        )}

        {activeTab === "admin" && pubKey && contractId && (
          <AdminPanel
            contractId={contractId}
            pubKey={pubKey}
            onSuccess={handleRefresh}
          />
        )}
      </main>

      {!pubKey && (
        <div className="welcome">
          <p>Connect your Freighter wallet to interact with tokenized assets.</p>
          <p className="small">
            Don't have Freighter?{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noreferrer"
            >
              Install it here
            </a>
          </p>
        </div>
      )}

      <footer>
        <p>Built on Stellar Soroban &bull; Testnet</p>
      </footer>
    </div>
  );
}
