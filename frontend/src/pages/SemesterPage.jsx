import { useEffect, useState } from "react";
import {
  getSemesterSummary,
  addSubjectToSemester,
  updateSubjectInSemester,
  deleteSubjectFromSemester,
  listSubjects,
  createSubject,
} from "../services/api";

// Enum grades exactly matching backend Grade enum
const GRADES = [
  { value: "O",      label: "O",  desc: "Outstanding", points: 10, color: "#fbbf24" },
  { value: "A_PLUS", label: "A+", desc: "Excellent",   points: 9,  color: "#34d399" },
  { value: "A",      label: "A",  desc: "Very Good",   points: 8,  color: "#60a5fa" },
  { value: "B_PLUS", label: "B+", desc: "Good",        points: 7,  color: "#a78bfa" },
  { value: "B",      label: "B",  desc: "Average",     points: 6,  color: "#f97316" },
  { value: "C",      label: "C",  desc: "Satisfactory",points: 5,  color: "#94a3b8" },
  { value: "U",      label: "U",  desc: "Failed",      points: 0,  color: "#fb7185" },
];

function GradePill({ value, selected, onClick }) {
  const g = GRADES.find((g) => g.value === value) || GRADES[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center rounded-xl px-3 py-2 text-xs font-bold transition-all"
      style={{
        background: selected ? `${g.color}22` : "rgba(255,255,255,0.04)",
        border: selected ? `2px solid ${g.color}` : "2px solid rgba(255,255,255,0.07)",
        color: selected ? g.color : "#64748b",
        minWidth: 44,
      }}
    >
      <span className="text-sm">{g.label}</span>
      <span className="text-[10px] mt-0.5 font-normal opacity-75">{g.points} pts</span>
    </button>
  );
}

function SgpaRing({ sgpa }) {
  const pct = Math.min(100, (sgpa / 10) * 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color =
    sgpa >= 9 ? "#fbbf24" : sgpa >= 8 ? "#34d399" : sgpa >= 7 ? "#60a5fa" : sgpa >= 6 ? "#a78bfa" : "#fb7185";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
          {sgpa > 0 ? sgpa.toFixed(2) : "--"}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">SGPA</span>
      </div>
    </div>
  );
}

export default function SemesterPage({ userId, semesterNumber, onBack, onRefresh }) {
  const [summary, setSummary] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // studentSubjectId
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("O");
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  // New custom subject inline form
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCredits, setNewSubjectCredits] = useState("");
  const [newSubjectBusy, setNewSubjectBusy] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [userId, semesterNumber]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sum, subs] = await Promise.all([
        getSemesterSummary(userId, semesterNumber).catch(() => null),
        listSubjects(),
      ]);
      setSummary(sum);
      setAllSubjects(subs);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // Subjects not yet added this semester
  const addedSubjectIds = new Set(summary?.subjects?.map((s) => s.subject.subjectId) ?? []);
  const availableSubjects = allSubjects.filter((s) => !addedSubjectIds.has(s.subjectId));

  function openAdd() {
    setEditingId(null);
    setSelectedSubjectId(availableSubjects[0]?.subjectId ?? "");
    setSelectedGrade("O");
    setModalError("");
    setShowNewSubject(false);
    setModalOpen(true);
  }

  function openEdit(entry) {
    setEditingId(entry.id);
    setSelectedSubjectId(entry.subject.subjectId);
    setSelectedGrade(entry.grade);
    setModalError("");
    setShowNewSubject(false);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!selectedSubjectId) { setModalError("Pick a subject"); return; }
    if (!selectedGrade)    { setModalError("Pick a grade");   return; }
    setBusy(true);
    setModalError("");
    try {
      const payload = { subjectId: Number(selectedSubjectId), grade: selectedGrade };
      if (editingId) {
        await updateSubjectInSemester(userId, semesterNumber, editingId, payload);
      } else {
        await addSubjectToSemester(userId, semesterNumber, payload);
      }
      setModalOpen(false);
      await fetchAll();
      onRefresh?.();
    } catch (e) {
      setModalError(e?.response?.data?.message || e.message || "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSubject() {
    if (!newSubjectName.trim() || !newSubjectCredits) return;
    setNewSubjectBusy(true);
    try {
      const created = await createSubject({ name: newSubjectName.trim(), credits: Number(newSubjectCredits) });
      setAllSubjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedSubjectId(created.subjectId);
      setShowNewSubject(false);
      setNewSubjectName("");
      setNewSubjectCredits("");
    } catch (e) {
      setModalError(e?.response?.data?.message || e.message || "Could not create subject");
    } finally {
      setNewSubjectBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteSubjectFromSemester(userId, semesterNumber, deleteTarget.id);
      setDeleteTarget(null);
      await fetchAll();
      onRefresh?.();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Could not delete");
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  const sgpa = summary?.sgpa ?? 0;
  const totalCredits = summary?.credits ?? 0;
  const subjects = summary?.subjects ?? [];

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm">Back to Dashboard</span>
        </button>
        <span className="section-kicker">Semester {semesterNumber}</span>
      </header>

      <main className="space-y-6 animate-in">
        {/* SGPA hero card */}
        <section className="hero-card">
          <div className="flex flex-wrap items-center gap-6">
            <SgpaRing sgpa={sgpa} />
            <div className="flex-1">
              <h1 className="headline" style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>
                Semester {semesterNumber}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="stat-chip">
                  <p className="metric-label">Total Credits</p>
                  <p className="mt-0.5 text-lg font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                    {totalCredits > 0 ? totalCredits : "--"}
                  </p>
                </div>
                <div className="stat-chip">
                  <p className="metric-label">Subjects</p>
                  <p className="mt-0.5 text-lg font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                    {subjects.length > 0 ? subjects.length : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <button type="button" onClick={openAdd} className="button-primary" disabled={loading}>
              + Add Subject
            </button>
          </div>
        </section>

        {/* Subjects table */}
        <section className="glass-card">
          <h2 className="card-title mb-4">Subjects & Grades</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">📖</span>
              </div>
              <p className="text-sm text-slate-400">No subjects yet for this semester</p>
              <button type="button" onClick={openAdd} className="button-primary mt-1">+ Add your first subject</button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Credits</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Grade</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Points</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((entry) => {
                    const g = GRADES.find((g) => g.value === entry.grade);
                    return (
                      <tr key={entry.id}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="px-4 py-3 font-medium text-white">{entry.subject.name}</td>
                        <td className="px-4 py-3 text-slate-400">{entry.subject.credits} cr</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
                            style={{ background: `${g?.color ?? "#fff"}18`, color: g?.color ?? "#fff" }}>
                            {g?.label ?? entry.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{entry.gradePoints}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEdit(entry)}
                              className="button-ghost py-1.5 text-xs">Edit</button>
                            <button type="button" onClick={() => setDeleteTarget(entry)}
                              className="button-ghost py-1.5 text-xs text-rose-400 hover:text-rose-300">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-400">Total / SGPA</td>
                    <td className="px-4 py-3 text-xs font-semibold text-white">{totalCredits} cr</td>
                    <td className="px-4 py-3" colSpan={2}>
                      <span className="text-sm font-bold" style={{ color: "#fbbf24", fontFamily: "Syne,sans-serif" }}>
                        {sgpa > 0 ? sgpa.toFixed(2) : "--"}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl p-3 text-sm text-rose-300"
              style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
              {error}
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md animate-in"
            style={{
              background: "linear-gradient(135deg, rgba(13,22,40,0.98), rgba(8,15,30,0.98))",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px", padding: "24px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="card-title">{editingId ? "Edit Subject" : "Add Subject"}</h2>
                <p className="card-subtitle">Semester {semesterNumber}</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}
                className="button-ghost h-8 w-8 rounded-full p-0 text-slate-400" style={{ fontSize: 18 }}>✕</button>
            </div>

            <div className="space-y-5">
              {/* Subject picker */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-field"
                  style={{ cursor: "pointer" }}
                  disabled={!!editingId}
                >
                  <option value="" disabled>Select a subject…</option>
                  {(editingId
                    ? allSubjects.filter(s => s.subjectId === selectedSubjectId || !addedSubjectIds.has(s.subjectId))
                    : availableSubjects
                  ).map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.name} ({s.credits} cr)
                    </option>
                  ))}
                </select>

                {/* Add new subject inline */}
                {!editingId && (
                  <button type="button"
                    onClick={() => setShowNewSubject((v) => !v)}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    {showNewSubject ? "− Cancel new subject" : "+ Subject not in list? Add it"}
                  </button>
                )}

                {showNewSubject && (
                  <div className="mt-3 space-y-2 rounded-xl p-3"
                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <p className="text-xs font-semibold text-amber-400 mb-2">New subject</p>
                    <input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Subject name e.g. Data Structures"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number" min="1" max="10"
                        value={newSubjectCredits}
                        onChange={(e) => setNewSubjectCredits(e.target.value)}
                        className="input-field text-sm flex-1"
                        placeholder="Credits"
                      />
                      <button type="button" onClick={handleCreateSubject} disabled={newSubjectBusy || !newSubjectName.trim() || !newSubjectCredits}
                        className="button-primary px-4 text-xs">
                        {newSubjectBusy ? "…" : "Add"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grade picker */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Grade
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map((g) => (
                    <GradePill
                      key={g.value}
                      value={g.value}
                      selected={selectedGrade === g.value}
                      onClick={() => setSelectedGrade(g.value)}
                    />
                  ))}
                </div>
                {selectedGrade && (
                  <p className="mt-2 text-xs text-slate-500">
                    {GRADES.find(g => g.value === selectedGrade)?.desc} · {GRADES.find(g => g.value === selectedGrade)?.points} grade points
                  </p>
                )}
              </div>

              {modalError && (
                <div className="rounded-xl p-3 text-sm text-rose-300"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
                  {modalError}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={handleSave} disabled={busy || !selectedSubjectId || !selectedGrade}
                  className="button-primary flex-1">
                  {busy ? "Saving…" : editingId ? "Update" : "Add Subject"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="button-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
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
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <span style={{ fontSize: 20 }}>🗑️</span>
            </div>
            <h2 className="card-title">Remove {deleteTarget.subject.name}?</h2>
            <p className="card-subtitle mt-1 mb-5">
              Grade {GRADES.find(g => g.value === deleteTarget.grade)?.label} · {deleteTarget.subject.credits} credits.
              SGPA will be recalculated automatically.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteConfirm} disabled={deleteBusy}
                className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#f43f5e,#fb7185)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                {deleteBusy ? "Removing…" : "Yes, remove"}
              </button>
              <button type="button" className="button-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
