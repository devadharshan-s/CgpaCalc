import { useMemo, useState } from "react";
import CgpaCard from "../components/CgpaCard";
import SemesterTable from "../components/SemesterTable";
import TargetCgpaCard from "../components/TargetCgpaCard";
import ProgressChart from "../components/ProgressChart";
import { deleteSemester, saveSemester } from "../services/api";

const MAX_SEMS = 8;

export default function ProfilePage({ profile, userId, authUser, onBack, onRefresh, onLogout, loading, onOpenSemester }) {
  const [error, setError]               = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);

  const currentProfile = useMemo(() => profile || { semesters: [] }, [profile]);
  const semCount = currentProfile.semesters?.length ?? 0;
  const cgpa = typeof currentProfile.cgpa === "number" && currentProfile.cgpa > 0 ? currentProfile.cgpa : null;

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteSemester(userId, deleteTarget.semester);
      setDeleteTarget(null);
      await onRefresh?.();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to delete");
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleNewSemester(semNumber) {
    // SemesterPage auto-creates the semester row when first subject is added.
    // Just navigate there.
    onOpenSemester(semNumber);
  }

  return (
    <div className="app-shell">
      {/* Navbar */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>G</div>
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>Dashboard</p>
            <p className="text-xs text-slate-500">Grade Compass</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {authUser?.name && (
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {authUser.name.split(" ")[0]}
            </span>
          )}
          <button type="button" onClick={onLogout}
            className="button-ghost text-xs text-slate-500 hover:text-rose-400">Sign out</button>
        </div>
      </header>

      <main className="space-y-6 animate-in">
        {/* Hero */}
        <section className="hero-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <span className="section-kicker">Student Profile</span>
              <h1 className="headline mt-4">{currentProfile.name || "Student"}</h1>
              <p className="mt-2 text-sm text-slate-400">{currentProfile.email || "--"}</p>
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
                  {semCount > 0 ? semCount : "--"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="button-secondary" onClick={onRefresh} disabled={loading}>↻ Refresh</button>
          </div>
        </section>

        <CgpaCard profile={currentProfile} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <SemesterTable
            semesters={currentProfile.semesters || []}
            onDelete={setDeleteTarget}
            onOpenSemester={handleNewSemester}
          />
          <TargetCgpaCard userId={userId} currentCgpa={cgpa} />
        </div>

        <ProgressChart semesters={currentProfile.semesters || []} />

        {error && (
          <div className="rounded-xl p-3 text-sm text-rose-300"
            style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
            {error}
          </div>
        )}
      </main>

      {/* Delete semester confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
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
              This removes the semester and all its subjects. CGPA will be recalculated. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteConfirm} disabled={deleteBusy}
                className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#f43f5e,#fb7185)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                {deleteBusy ? "Deleting…" : "Yes, delete"}
              </button>
              <button type="button" className="button-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
