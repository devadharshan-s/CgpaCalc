import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import CgpaCard from "../components/CgpaCard";
import SemesterTable from "../components/SemesterTable";
import TargetCgpaCard from "../components/TargetCgpaCard";
import ProgressChart from "../components/ProgressChart";
import { saveSemester, updateSemester, deleteSemester } from "../services/api";

const MAX_SEMS = 8;
const emptySemester = { semester: "", sgpa: "", credits: "" };

export default function ProfilePage({ profile, userId, authUser, onBack, onRefresh, onLogout, loading }) {
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [draft, setDraft]                 = useState(emptySemester);
  const [busy, setBusy]                   = useState(false);
  const [error, setError]                 = useState("");
  // Delete confirmation
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteBusy, setDeleteBusy]       = useState(false);

  const currentProfile = useMemo(() => profile || { semesters: [] }, [profile]);
  const semCount = currentProfile.semesters?.length ?? 0;
  const cgpa = typeof currentProfile.cgpa === "number" && currentProfile.cgpa > 0
    ? currentProfile.cgpa : null;

  function openAddModal() {
    if (semCount >= MAX_SEMS) return;
    setEditingSemester(null);
    setDraft(emptySemester);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(semester) {
    setEditingSemester(semester.semester);
    setDraft({ semester: String(semester.semester), sgpa: String(semester.sgpa), credits: String(semester.credits) });
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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      // Backend deleteSemester takes the DB row id — but our DTO only has semester number.
      // We pass semester number as the id (matches repo findById usage on semesterId).
      // NOTE: if your backend uses DB row id, you'll need to expose it in SemesterDTO.
      await deleteSemester(userId, deleteTarget.semester);
      setDeleteTarget(null);
      await onRefresh?.();
    } catch (err) {
      setDeleteTarget(null);
      setError(err?.response?.data?.message || err.message || "Unable to delete semester");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        label="Dashboard"
        activeUserId={userId}
        authUser={authUser}
        onHomeClick={onBack}
        onLogout={onLogout}
      />

      <main className="space-y-6 animate-in">
        {/* Profile hero */}
        <section className="hero-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <span className="section-kicker">Student Profile</span>
              <h1 className="headline mt-4">{currentProfile.name || "Student"}</h1>
              <p className="mt-2 text-sm text-slate-400">{currentProfile.email || "--"}</p>
              {loading && <p className="mt-2 text-xs text-amber-400 animate-pulse">Syncing...</p>}
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
            <button type="button" className="button-primary" onClick={openAddModal}
              disabled={!userId || loading || semCount >= MAX_SEMS}>
              + Add Semester
            </button>
            <button type="button" className="button-secondary" onClick={onRefresh}
              disabled={!userId || loading}>
              ↻ Refresh
            </button>
          </div>
        </section>

        <CgpaCard profile={currentProfile} />

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <SemesterTable
            semesters={currentProfile.semesters || []}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
          />
          <TargetCgpaCard userId={userId} currentCgpa={cgpa} />
        </section>

        <ProgressChart semesters={currentProfile.semesters || []} />

        {error && (
          <div className="rounded-xl p-3 text-sm text-rose-300"
            style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
            {error}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md animate-in"
            style={{
              background: "linear-gradient(135deg, rgba(13,22,40,0.98), rgba(8,15,30,0.98))",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px", padding: "28px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="card-title">{editingSemester ? "Edit Semester" : "Add Semester"}</h2>
                <p className="card-subtitle">
                  {editingSemester ? `Editing Semester ${editingSemester}` : `${semCount} / ${MAX_SEMS} semesters used`}
                </p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}
                className="button-ghost h-8 w-8 rounded-full p-0 text-slate-400" style={{ fontSize: 18 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Semester Number (1–8)
                </label>
                <input type="number" min="1" max="8"
                  value={draft.semester}
                  onChange={(e) => setDraft((c) => ({ ...c, semester: e.target.value }))}
                  className="input-field" placeholder="e.g. 3" required
                  disabled={!!editingSemester} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  SGPA (0 – 10)
                </label>
                <input type="number" min="0" max="10" step="0.01"
                  value={draft.sgpa}
                  onChange={(e) => setDraft((c) => ({ ...c, sgpa: e.target.value }))}
                  className="input-field" placeholder="e.g. 8.75" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Credits
                </label>
                <input type="number" min="1"
                  value={draft.credits}
                  onChange={(e) => setDraft((c) => ({ ...c, credits: e.target.value }))}
                  className="input-field" placeholder="e.g. 24" required />
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm animate-in"
            style={{
              background: "linear-gradient(135deg, rgba(13,22,40,0.98), rgba(8,15,30,0.98))",
              border: "1px solid rgba(251,113,133,0.2)",
              borderRadius: "20px", padding: "28px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <span style={{ fontSize: 22 }}>🗑️</span>
            </div>
            <h2 className="card-title">Delete Semester {deleteTarget.semester}?</h2>
            <p className="card-subtitle mt-1 mb-5">
              SGPA {Number(deleteTarget.sgpa).toFixed(2)} · {deleteTarget.credits} credits.
              This will recalculate your CGPA. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteConfirm} disabled={deleteBusy}
                className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#f43f5e,#fb7185)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                {deleteBusy ? "Deleting..." : "Yes, delete"}
              </button>
              <button type="button" className="button-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
