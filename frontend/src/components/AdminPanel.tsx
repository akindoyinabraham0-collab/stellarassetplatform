import React, { useState } from "react";
import {
  freeze,
  unfreeze,
  approve,
  claimDividend,
  depositDividend,
  pause,
  unpause,
  setMetadata,
} from "../utils/contract";

interface Props {
  contractId: string;
  pubKey: string;
  onSuccess: () => void;
}

export default function AdminPanel({ contractId, pubKey, onSuccess }: Props) {
  const [target, setTarget] = useState("");
  const [spender, setSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [divAmount, setDivAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [metaName, setMetaName] = useState("");
  const [metaSymbol, setMetaSymbol] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaType, setMetaType] = useState("");
  const [metaLocation, setMetaLocation] = useState("");
  const [metaValuation, setMetaValuation] = useState("");
  const [metaShares, setMetaShares] = useState("");
  const [metaDocs, setMetaDocs] = useState("");

  const doAction = async (
    label: string,
    fn: () => Promise<string>
  ) => {
    setLoading(true);
    setStatus(null);
    try {
      const hash = await fn();
      setStatus(`${label} done. Hash: ${hash.slice(0, 16)}...`);
      onSuccess();
    } catch (e: any) {
      setStatus(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Controls</h2>

      <div className="admin-section">
        <h3>Freeze / Unfreeze</h3>
        <input
          type="text"
          placeholder="Target address (G...)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <div className="btn-row">
          <button
            onClick={() =>
              doAction("Freeze", () =>
                freeze(pubKey, contractId, target)
              )
            }
            disabled={loading || !target}
          >
            Freeze
          </button>
          <button
            onClick={() =>
              doAction("Unfreeze", () =>
                unfreeze(pubKey, contractId, target)
              )
            }
            disabled={loading || !target}
          >
            Unfreeze
          </button>
        </div>
      </div>

      <div className="admin-section">
        <h3>Pause / Unpause</h3>
        <div className="btn-row">
          <button
            onClick={() =>
              doAction("Pause", () => pause(pubKey, contractId))
            }
            disabled={loading}
          >
            Pause
          </button>
          <button
            onClick={() =>
              doAction("Unpause", () => unpause(pubKey, contractId))
            }
            disabled={loading}
          >
            Unpause
          </button>
        </div>
      </div>

      <div className="admin-section">
        <h3>Approve Spender</h3>
        <input
          type="text"
          placeholder="Spender address (G...)"
          value={spender}
          onChange={(e) => setSpender(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          step="0.0000001"
          value={approveAmount}
          onChange={(e) => setApproveAmount(e.target.value)}
        />
        <button
          onClick={() =>
            doAction("Approve", async () => {
              const amt = BigInt(
                Math.floor(parseFloat(approveAmount) * 10_000_000)
              );
              return approve(pubKey, contractId, spender, amt);
            })
          }
          disabled={loading || !spender || !approveAmount}
        >
          Approve
        </button>
      </div>

      <div className="admin-section">
        <h3>Dividends</h3>
        <input
          type="number"
          placeholder="Amount to deposit"
          step="0.0000001"
          value={divAmount}
          onChange={(e) => setDivAmount(e.target.value)}
        />
        <button
          onClick={() =>
            doAction("Deposit dividend", async () => {
              const amt = BigInt(
                Math.floor(parseFloat(divAmount) * 10_000_000)
              );
              return depositDividend(pubKey, contractId, amt);
            })
          }
          disabled={loading || !divAmount}
        >
          Deposit Dividends
        </button>
        <button
          style={{ marginTop: "0.5rem" }}
          onClick={() =>
            doAction("Claim dividends", () =>
              claimDividend(pubKey, contractId)
            )
          }
          disabled={loading}
        >
          Claim My Dividends
        </button>
      </div>

      <div className="admin-section">
        <h3>Update Metadata</h3>
        <input
          type="text"
          placeholder="Name"
          value={metaName}
          onChange={(e) => setMetaName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Symbol"
          value={metaSymbol}
          onChange={(e) => setMetaSymbol(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={metaDesc}
          onChange={(e) => setMetaDesc(e.target.value)}
        />
        <input
          type="text"
          placeholder="Asset type (e.g. RealEstate)"
          value={metaType}
          onChange={(e) => setMetaType(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={metaLocation}
          onChange={(e) => setMetaLocation(e.target.value)}
        />
        <input
          type="number"
          placeholder="Valuation (in stroops)"
          value={metaValuation}
          onChange={(e) => setMetaValuation(e.target.value)}
        />
        <input
          type="number"
          placeholder="Total shares"
          value={metaShares}
          onChange={(e) => setMetaShares(e.target.value)}
        />
        <input
          type="text"
          placeholder="Documents (comma-separated URIs)"
          value={metaDocs}
          onChange={(e) => setMetaDocs(e.target.value)}
        />
        <button
          onClick={() =>
            doAction("Update metadata", async () => {
              const docs = metaDocs
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
              return setMetadata(
                pubKey,
                contractId,
                metaName,
                metaSymbol,
                metaDesc,
                metaType,
                metaLocation,
                BigInt(metaValuation || "0"),
                BigInt(metaShares || "0"),
                docs,
              );
            })
          }
          disabled={
            loading || !metaName || !metaSymbol || !metaDesc || !metaType || !metaLocation
          }
        >
          Update Metadata
        </button>
      </div>

      {status && (
        <p className={status.startsWith("Error") ? "status error" : "status"}>
          {status}
        </p>
      )}
    </div>
  );
}
