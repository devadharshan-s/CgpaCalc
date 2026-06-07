import { useState } from "react";
import { calculateTargetCgpa as calculateTargetCgpaRequest } from "../services/api";

export default function TargetCgpaCard({ userId }) {
  const [targetCgpa, setTargetCgpa] = useState("9.0");
  const [remainingCredits, setRemainingCredits] = useState("30");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await calculateTargetCgpaRequest(userId, {
        targetCgpa: Number(targetCgpa),
        remainingCredits: Number(remainingCredits),
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Calculation failed");
    } finally {
      setLoading(false);
    }
  }

  const possible = result?.possible;
  const reqSgpa = result ? Number(result.requiredSgpa).toFixed(2) : null;

  return (
    <section className="glass-card flex flex-col gap-5">
      <div>
        <h2 className="card-title">Target Calculator</h2>
        <p className="card-subtitle">Can you hit your dream CGPA?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Desired CGPA
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="10"
            value={targetCgpa}
            onChange={(e) => setTargetCgpa(e.target.value)}
            className="input-field"
            placeholder="9.0"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Remaining Credits
          </label>
          <input
            type="number"
            min="1"
            value={remainingCredits}
            onChange={(e) => setRemainingCredits(e.target.value)}
            className="input-field"
            placeholder="30"
          />
        </div>

        <button
          type="submit"
          disabled={!userId || loading}
          className="button-primary w-full"
        >
          {loading ? "Calculating..." : "Check Feasibility →"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl p-3 text-sm text-rose-300"
          style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
          {error}
        </div>
      )}

      {/* Result */}
      <div className="rounded-xl p-4 transition-all"
        style={{
          background: result
            ? possible
              ? "rgba(52,211,153,0.06)"
              : "rgba(251,113,133,0.06)"
            : "rgba(255,255,255,0.03)",
          border: result
            ? possible
              ? "1px solid rgba(52,211,153,0.18)"
              : "1px solid rgba(251,113,133,0.18)"
            : "1px solid rgba(255,255,255,0.07)",
        }}>
        <p className="metric-label">Required SGPA per semester</p>
        <div className="mt-1 flex items-end gap-2">
          <span
            className="text-3xl font-bold"
            style={{
              fontFamily: "Syne,sans-serif",
              color: result
                ? possible ? "#34d399" : "#fb7185"
                : "white",
            }}
          >
            {reqSgpa ?? "--"}
          </span>
          {reqSgpa && <span className="mb-1 text-sm text-slate-500">/ 10</span>}
        </div>

        {result && (
          <div className="mt-3 flex items-center gap-2">
            {possible ? (
              <span className="badge-success">✓ Achievable</span>
            ) : (
              <span className="badge-error">✗ Not possible</span>
            )}
            <span className="text-xs text-slate-500">
              {possible
                ? "Keep up the hustle!"
                : "Required SGPA exceeds 10.0"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
