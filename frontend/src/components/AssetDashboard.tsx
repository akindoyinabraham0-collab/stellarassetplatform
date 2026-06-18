import React from "react";
import { AssetMetadata } from "../utils/contract";

interface Props {
  metadata: AssetMetadata | null;
  balance: bigint | null;
  totalSupply: bigint | null;
  paused: boolean;
  contractId: string;
  onContractIdChange: (id: string) => void;
  onLoad: () => void;
  loading: boolean;
}

function fmt(val: bigint | null, decimals: number = 7): string {
  if (val === null) return "—";
  const s = val.toString().padStart(decimals + 1, "0");
  const int = s.slice(0, s.length - decimals) || "0";
  const frac = s.slice(s.length - decimals).replace(/0+$/, "") || "0";
  return `${int}.${frac}`;
}

export default function AssetDashboard({
  metadata,
  balance,
  totalSupply,
  paused,
  contractId,
  onContractIdChange,
  onLoad,
  loading,
}: Props) {
  return (
    <div className="dashboard">
      <div className="contract-input">
        <input
          type="text"
          placeholder="Enter Soroban contract ID"
          value={contractId}
          onChange={(e) => onContractIdChange(e.target.value)}
        />
        <button onClick={onLoad} disabled={loading || !contractId}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {metadata && (
        <div className="asset-card">
          <div className="asset-header">
            <h3>{metadata.name}</h3>
            <span className="symbol">{metadata.symbol}</span>
          </div>
          <p>{metadata.description}</p>

          <div className="details">
            <div>
              <strong>Type</strong>
              <span>{metadata.asset_type}</span>
            </div>
            <div>
              <strong>Location</strong>
              <span>{metadata.location}</span>
            </div>
            <div>
              <strong>Valuation</strong>
              <span>{fmt(BigInt(metadata.valuation))} XLM</span>
            </div>
            <div>
              <strong>Total Shares</strong>
              <span>{metadata.total_shares.toLocaleString()}</span>
            </div>
          </div>

          <div className="supply-row">
            <div>
              <strong>Total Supply</strong>
              <span>{fmt(totalSupply)}</span>
            </div>
            <div>
              <strong>Your Balance</strong>
              <span className={balance === null || balance === 0n ? "zero" : ""}>
                {fmt(balance)}
              </span>
            </div>
            <div>
              <strong>Contract</strong>
              <span className={paused ? "paused" : "active"}>
                {paused ? "Paused" : "Active"}
              </span>
            </div>
          </div>

          {metadata.documents.length > 0 && (
            <div className="documents">
              <strong>Documents</strong>
              <ul>
                {metadata.documents.map((doc, i) => (
                  <li key={i}>
                    <a href={doc} target="_blank" rel="noreferrer">
                      {doc}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {contractId && !metadata && !loading && (
        <p className="hint">
          Enter a valid Soroban contract ID and click Load
        </p>
      )}
    </div>
  );
}
