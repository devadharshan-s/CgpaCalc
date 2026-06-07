import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import CgpaCard from "../components/CgpaCard";
import SemesterTable from "../components/SemesterTable";
import TargetCgpaCard from "../components/TargetCgpaCard";
import ProgressChart from "../components/ProgressChart";
import { saveSemester, updateSemester } from "../services/api";

const emptySemester = { semester: "", sgpa: "", credits: "" };

export default function ProfilePage({ profile, userId, onBack, onRefresh, loading }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [draft, setDraft] = useState(emptySemester);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.semesters?.length) return;
    setEditingSemester(null);
    setDraft(emptySemester);
  }, [profile]);

  const currentProfile = useMemo(() => profile || { semesters: [] }, [profile]);

  function openAddModal() {
    setEditingSemester(null);
    setDraft(emptySemester);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(semester) {
    setEditingSemester(semester.semester);
    setDraft({
      semester: String(semester.semester),
      sgpa: String(semester.sgpa),
      credits: String(semester.credits),
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      semester: Number(draft.semester),
      sgpa: Number(draft.sgpa),
      credits: Number(draft.credits),
    };
    try {
      if (editingSemester) {
        await updateSemester(userId, payload);
      } else {
        await saveSemester(userId, payload);
      }
      setModalOpen(false);
      setDraft(emptySemester);
      await onRefresh?.();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to save semester");
    } finally {
      setBusy(false);
    }
  }

  const semCount = currentProfile.semesters?.length ?? 0;
  const cgpa = typeof currentProfile.cgpa === "number" ? currentProfile.cgpa : null;

  return (
    <div className="app-shell">
      <Navbar
        label="Dashboard"
        activeUserId={userId}
        onHomeClick={onBack}
      />

      <main className="space-y-6 animate-in">
        {/* Profile hero */}
        <section className="hero-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <span className="section-kicker">Student Profile</span>
              <h1 className="headline mt-4">
                {currentProfile.name || "Student"}
              </h1>
              <p className="mt-2 text-sm text-slate-400">{currentProfile.email || "--"}</p>
              {loading && (
                <p className="mt-2 text-xs text-amber-400 animate-pulse">Syncing with backend...</p>
              )}
            </div>

            {/* Quick stats */}
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
                  {semCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="button-primary"
              onClick={openAddModal}
              disabled={!userId || loading}
            >
              + Add Semester
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={onRefresh}
              disabled={!userId || loading}
            >
              ↻ Refresh
            </button>
          </div>
        </section>

        {/* CGPA card */}
        <CgpaCard profile={currentProfile} />

        {/* Table + Target */}
        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <SemesterTable
            semesters={currentProfile.semesters || []}
            onAdd={openAddModal}
            onEdit={openEditModal}
          />
          <TargetCgpaCard userId={userId} />
        </section>

        {/* Chart */}
        <ProgressChart semesters={currentProfile.semesters || []} />

        {error && (
          <div className="rounded-xl p-3 text-sm text-rose-300"
            style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
            {error}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-md animate-in"
            style={{
              background: "linear-gradient(135deg, rgba(13,22,40,0.98), rgba(8,15,30,0.98))",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="card-title">{editingSemester ? "Edit Semester" : "Add Semester"}</h2>
                <p className="card-subtitle">SGPA, semester number, and credits</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="button-ghost h-8 w-8 rounded-full p-0 text-slate-400"
                style={{ fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Semester Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={draft.semester}
                  onChange={(e) => setDraft((c) => ({ ...c, semester: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 3"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  SGPA (0 – 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={draft.sgpa}
                  onChange={(e) => setDraft((c) => ({ ...c, sgpa: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 8.75"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Credits
                </label>
                <input
                  type="number"
                  min="1"
                  value={draft.credits}
                  onChange={(e) => setDraft((c) => ({ ...c, credits: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 24"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm text-rose-300"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="button-primary flex-1" disabled={busy}>
                  {busy ? "Saving..." : "Save Semester"}
                </button>
                <button type="button" className="button-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
