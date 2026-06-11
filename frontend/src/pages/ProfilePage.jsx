import { useState } from "react";
import CgpaCard from "../components/CgpaCard";
import SemesterTable from "../components/SemesterTable";
import TargetCgpaCard from "../components/TargetCgpaCard";
import ProgressChart from "../components/ProgressChart";

export default function ProfilePage({ profile, authUser, loading, actions }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  const semesters = profile?.semesters ?? [];
  const cgpa = typeof profile?.cgpa === "number" && profile.cgpa > 0 ? profile.cgpa : null;

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await actions.deleteSemester(deleteTarget.semester);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="app-shell">
      {/* Navbar */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>G</div>
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>Dashboard</p>
            <p className="text-xs text-slate-500">Grade Compass</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {authUser?.name && (
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {authUser.name.split(" ")[0]}
            </span>
          )}
          <button type="button" onClick={actions.logout}
            className="button-ghost text-xs text-slate-500 hover:text-rose-400">Sign out</button>
        </div>
      </header>

      <main className="space-y-6 animate-in">
        {/* Hero */}
        <section className="hero-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <span className="section-kicker">Student Profile</span>
              <h1 className="headline mt-4">{profile?.name || "Student"}</h1>
              <p className="mt-2 text-sm text-slate-400">{profile?.email || "--"}</p>
              {loading && <p className="mt-2 text-xs text-amber-400 animate-pulse">Syncing…</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="stat-chip text-center">
                <p className="metric-label">CGPA</p>
                <p className="mt-0.5 text-2xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "#fbbf24" }}>
                  {cgpa !== null ? cgpa.toFixed(2) : "--"}
                </p>
              </div>
              <div className="stat-chip text-center">
                <p className="metric-label">Semesters</p>
                <p className="mt-0.5 text-2xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                  {semesters.length > 0 ? semesters.length : "--"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button type="button" className="button-secondary" onClick={actions.refreshProfile} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        </section>

        <CgpaCard profile={profile} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <SemesterTable
            semesters={semesters}
            onDelete={setDeleteTarget}
            onOpenSemester={actions.openSemester}
          />
          <TargetCgpaCard userId={profile?.id} currentCgpa={cgpa} />
        </div>

        <ProgressChart semesters={semesters} />
      </main>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleteBusy) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm animate-in"
            style={{
              background: "linear-gradient(135deg,rgba(13,22,40,0.98),rgba(8,15,30,0.98))",
              border: "1px solid rgba(251,113,133,0.2)", borderRadius: "20px",
              padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <span style={{ fontSize: 20 }}>🗑️</span>
            </div>
            <h2 className="card-title">Delete Semester {deleteTarget.semester}?</h2>
            <p className="card-subtitle mt-1 mb-5">
              All subjects in this semester will be removed and CGPA will be recalculated.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-xl p-3 text-sm text-rose-300"
                style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={confirmDelete} disabled={deleteBusy}
                className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#f43f5e,#fb7185)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                {deleteBusy ? "Deleting…" : "Yes, delete"}
              </button>
              <button type="button" className="button-secondary" disabled={deleteBusy}
                onClick={() => { setDeleteTarget(null); setDeleteError(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
