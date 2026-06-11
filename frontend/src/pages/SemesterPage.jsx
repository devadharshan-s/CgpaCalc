import { useEffect, useReducer, useCallback } from "react";
import {
  getSemesterSummary,
  addSubjectToSemester,
  updateSubjectInSemester,
  deleteSubjectFromSemester,
  listSubjects,
  createSubject,
} from "../services/api";

// ── Grade config ───────────────────────────────────────────
const GRADES = [
  { value: "O",      label: "O",  desc: "Outstanding",  points: 10, color: "#fbbf24" },
  { value: "A_PLUS", label: "A+", desc: "Excellent",    points: 9,  color: "#34d399" },
  { value: "A",      label: "A",  desc: "Very Good",    points: 8,  color: "#60a5fa" },
  { value: "B_PLUS", label: "B+", desc: "Good",         points: 7,  color: "#a78bfa" },
  { value: "B",      label: "B",  desc: "Average",      points: 6,  color: "#f97316" },
  { value: "C",      label: "C",  desc: "Satisfactory", points: 5,  color: "#94a3b8" },
  { value: "U",      label: "U",  desc: "Failed",       points: 0,  color: "#fb7185" },
];

// ── Local state machine ────────────────────────────────────
const LOCAL_INIT = {
  summary: null,
  allSubjects: [],
  loading: true,
  error: "",
  modal: null,          // null | { mode: "add"|"edit", entry?: StudentSubjectResponseDTO }
  subjectId: "",
  grade: "O",
  busy: false,
  modalError: "",
  newSubject: { open: false, name: "", credits: "", busy: false },
  deleteTarget: null,
  deleteBusy: false,
};

function localReducer(s, a) {
  switch (a.type) {
    case "LOAD_START":  return { ...s, loading: true, error: "" };
    case "LOAD_DONE":   return { ...s, loading: false, summary: a.summary, allSubjects: a.subjects, error: "" };
    case "LOAD_ERROR":  return { ...s, loading: false, error: a.error };
    case "SUBJECTS_UPDATED": return { ...s, allSubjects: a.subjects };

    case "OPEN_ADD":
      return { ...s, modal: { mode: "add" }, subjectId: a.firstAvailable ?? "", grade: "O", modalError: "", newSubject: LOCAL_INIT.newSubject };
    case "OPEN_EDIT":
      return { ...s, modal: { mode: "edit", entry: a.entry }, subjectId: String(a.entry.subject.subjectId), grade: a.entry.grade, modalError: "", newSubject: LOCAL_INIT.newSubject };
    case "CLOSE_MODAL": return { ...s, modal: null, modalError: "", newSubject: LOCAL_INIT.newSubject };

    case "SET_SUBJECT":  return { ...s, subjectId: a.value };
    case "SET_GRADE":    return { ...s, grade: a.value };
    case "SET_MODAL_ERROR": return { ...s, modalError: a.error };

    case "BUSY_START":  return { ...s, busy: true, modalError: "" };
    case "BUSY_END":    return { ...s, busy: false };

    // Summary updated (after add/edit/delete subject)
    case "SUMMARY_UPDATED": return { ...s, summary: a.summary, modal: null, busy: false, modalError: "" };

    // Optimistic subject delete from table
    case "SUBJECT_DELETED_OPTIMISTIC": {
      if (!s.summary) return s;
      const subjects = s.summary.subjects.filter((e) => e.id !== a.id);
      return { ...s, summary: { ...s.summary, subjects }, deleteTarget: null };
    }
    case "SET_DELETE_TARGET": return { ...s, deleteTarget: a.entry };
    case "DELETE_BUSY_START": return { ...s, deleteBusy: true };
    case "DELETE_BUSY_END":   return { ...s, deleteBusy: false };

    case "NEW_SUBJECT_TOGGLE": return { ...s, newSubject: { ...LOCAL_INIT.newSubject, open: !s.newSubject.open } };
    case "NEW_SUBJECT_SET":    return { ...s, newSubject: { ...s.newSubject, ...a.patch } };

    default: return s;
  }
}

// ── Sub-components ─────────────────────────────────────────
function GradePill({ value, selected, onClick }) {
  const g = GRADES.find((g) => g.value === value) || GRADES[0];
  return (
    <button type="button" onClick={onClick}
      className="flex flex-col items-center rounded-xl px-3 py-2 text-xs font-bold transition-all"
      style={{
        background: selected ? `${g.color}22` : "rgba(255,255,255,0.04)",
        border: selected ? `2px solid ${g.color}` : "2px solid rgba(255,255,255,0.07)",
        color: selected ? g.color : "#64748b",
        minWidth: 44,
      }}>
      <span className="text-sm">{g.label}</span>
      <span className="text-[10px] mt-0.5 font-normal opacity-75">{g.points}pts</span>
    </button>
  );
}

function SgpaRing({ sgpa }) {
  const v = Number(sgpa) || 0;
  const pct = Math.min(100, (v / 10) * 100);
  const r = 36, circ = 2 * Math.PI * r;
  const color = v >= 9 ? "#fbbf24" : v >= 8 ? "#34d399" : v >= 7 ? "#60a5fa" : v >= 6 ? "#a78bfa" : v > 0 ? "#fb7185" : "#1e293b";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
          {v > 0 ? v.toFixed(2) : "--"}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">SGPA</span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function SemesterPage({
  userId, semesterNumber, cachedSummary,
  onBack, onSummaryUpdated, cacheSemesterSummary,
}) {
  const [s, dispatch] = useReducer(localReducer, {
    ...LOCAL_INIT,
    summary: cachedSummary ?? null,
    loading: !cachedSummary,
  });

  const addedIds = new Set(s.summary?.subjects?.map((e) => e.subject.subjectId) ?? []);
  const available = s.allSubjects.filter((sub) => !addedIds.has(sub.subjectId));

  // ── Fetch ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const [summary, subjects] = await Promise.all([
        getSemesterSummary(userId, semesterNumber).catch(() => ({
          userId, semester: semesterNumber, sgpa: 0, credits: 0, subjects: [],
        })),
        listSubjects(),
      ]);
      dispatch({ type: "LOAD_DONE", summary, subjects });
      cacheSemesterSummary(semesterNumber, summary);
    } catch (e) {
      dispatch({ type: "LOAD_ERROR", error: e?.response?.data?.message || e.message });
    }
  }, [userId, semesterNumber]);

  useEffect(() => {
    if (!cachedSummary) {
      fetchAll();
    } else {
      // Still fetch subject master list even if summary is cached
      listSubjects().then((subjects) => {
        dispatch({ type: "SUBJECTS_UPDATED", subjects });
        dispatch({ type: "LOAD_DONE", summary: cachedSummary, subjects });
      });
    }
  }, [userId, semesterNumber]);

  // ── Subject CRUD ──────────────────────────────────────
  async function handleSave() {
    if (!s.subjectId) { dispatch({ type: "SET_MODAL_ERROR", error: "Pick a subject" }); return; }
    dispatch({ type: "BUSY_START" });
    try {
      const payload = { subjectId: Number(s.subjectId), grade: s.grade };
      let updatedSummary;
      if (s.modal?.mode === "edit") {
        updatedSummary = await updateSubjectInSemester(userId, semesterNumber, s.modal.entry.id, payload);
      } else {
        updatedSummary = await addSubjectToSemester(userId, semesterNumber, payload);
      }
      dispatch({ type: "SUMMARY_UPDATED", summary: updatedSummary });
      onSummaryUpdated(semesterNumber, updatedSummary);
    } catch (e) {
      dispatch({ type: "BUSY_END" });
      dispatch({ type: "SET_MODAL_ERROR", error: e?.response?.data?.message || e.message || "Could not save" });
    }
  }

  async function handleDeleteSubject() {
    if (!s.deleteTarget) return;
    dispatch({ type: "DELETE_BUSY_START" });
    // Optimistic removal from table
    dispatch({ type: "SUBJECT_DELETED_OPTIMISTIC", id: s.deleteTarget.id });
    try {
      const updatedSummary = await deleteSubjectFromSemester(userId, semesterNumber, s.deleteTarget.id);
      dispatch({ type: "SUMMARY_UPDATED", summary: updatedSummary });
      onSummaryUpdated(semesterNumber, updatedSummary);
    } catch (e) {
      // Rollback: refetch
      await fetchAll();
      dispatch({ type: "LOAD_ERROR", error: e?.response?.data?.message || e.message || "Delete failed" });
    } finally {
      dispatch({ type: "DELETE_BUSY_END" });
    }
  }

  async function handleCreateSubject() {
    const { name, credits } = s.newSubject;
    if (!name.trim() || !credits) return;
    dispatch({ type: "NEW_SUBJECT_SET", patch: { busy: true } });
    try {
      const created = await createSubject({ name: name.trim(), credits: Number(credits) });
      const newList = [...s.allSubjects, created].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SUBJECTS_UPDATED", subjects: newList });
      dispatch({ type: "SET_SUBJECT", value: String(created.subjectId) });
      dispatch({ type: "NEW_SUBJECT_SET", patch: { open: false, name: "", credits: "", busy: false } });
    } catch (e) {
      dispatch({ type: "SET_MODAL_ERROR", error: e?.response?.data?.message || e.message });
      dispatch({ type: "NEW_SUBJECT_SET", patch: { busy: false } });
    }
  }

  const sgpa = s.summary?.sgpa ?? 0;
  const credits = s.summary?.credits ?? 0;
  const subjects = s.summary?.subjects ?? [];
  const isEditMode = s.modal?.mode === "edit";

  return (
    <div className="app-shell">
      <header className="mb-6 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm">Dashboard</span>
        </button>
        <span className="section-kicker">Semester {semesterNumber}</span>
      </header>

      <main className="space-y-6 animate-in">
        {/* SGPA hero */}
        <section className="hero-card">
          <div className="flex flex-wrap items-center gap-6">
            <SgpaRing sgpa={sgpa} />
            <div className="flex-1">
              <h1 className="headline" style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>
                Semester {semesterNumber}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="stat-chip">
                  <p className="metric-label">Credits</p>
                  <p className="mt-0.5 text-lg font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                    {credits > 0 ? credits : "--"}
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
            <button type="button" className="button-primary" disabled={s.loading}
              onClick={() => dispatch({ type: "OPEN_ADD", firstAvailable: available[0]?.subjectId ?? "" })}>
              + Add Subject
            </button>
          </div>
        </section>

        {/* Subjects table */}
        <section className="glass-card">
          <h2 className="card-title mb-4">Subjects & Grades</h2>
          {s.loading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="text-4xl">📖</span>
              <p className="text-sm text-slate-400">No subjects yet</p>
              <button type="button" className="button-primary mt-1"
                onClick={() => dispatch({ type: "OPEN_ADD", firstAvailable: available[0]?.subjectId ?? "" })}>
                + Add your first subject
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Subject", "Credits", "Grade", "Points", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
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
                            <button type="button" className="button-ghost py-1.5 text-xs"
                              onClick={() => dispatch({ type: "OPEN_EDIT", entry })}>Edit</button>
                            <button type="button"
                              className="button-ghost py-1.5 text-xs text-rose-400 hover:text-rose-300"
                              onClick={() => dispatch({ type: "SET_DELETE_TARGET", entry })}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-400" colSpan={1}>Total / SGPA</td>
                    <td className="px-4 py-3 text-xs font-semibold text-white">{credits} cr</td>
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
          {s.error && (
            <div className="mt-4 rounded-xl p-3 text-sm text-rose-300"
              style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
              {s.error}
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Modal */}
      {s.modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !s.busy) dispatch({ type: "CLOSE_MODAL" }); }}>
          <div className="w-full max-w-md animate-in"
            style={{
              background: "linear-gradient(135deg,rgba(13,22,40,0.98),rgba(8,15,30,0.98))",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px",
              padding: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="card-title">{isEditMode ? "Edit Subject" : "Add Subject"}</h2>
                <p className="card-subtitle">Semester {semesterNumber}</p>
              </div>
              <button type="button" onClick={() => dispatch({ type: "CLOSE_MODAL" })} disabled={s.busy}
                className="button-ghost h-8 w-8 rounded-full text-slate-400" style={{ fontSize: 18 }}>✕</button>
            </div>

            <div className="space-y-5">
              {/* Subject selector */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Subject
                </label>
                <select
                  value={s.subjectId}
                  onChange={(e) => dispatch({ type: "SET_SUBJECT", value: e.target.value })}
                  className="input-field"
                  disabled={isEditMode}
                  style={{ cursor: isEditMode ? "not-allowed" : "pointer" }}>
                  <option value="" disabled>Select a subject…</option>
                  {(isEditMode
                    ? s.allSubjects.filter(sub => sub.subjectId === Number(s.subjectId) || !addedIds.has(sub.subjectId))
                    : available
                  ).map((sub) => (
                    <option key={sub.subjectId} value={sub.subjectId}>
                      {sub.name} ({sub.credits} cr)
                    </option>
                  ))}
                </select>

                {!isEditMode && (
                  <button type="button"
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    onClick={() => dispatch({ type: "NEW_SUBJECT_TOGGLE" })}>
                    {s.newSubject.open ? "− Cancel" : "+ Not in list? Add it"}
                  </button>
                )}

                {s.newSubject.open && (
                  <div className="mt-3 space-y-2 rounded-xl p-3"
                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <p className="text-xs font-semibold text-amber-400 mb-2">New subject</p>
                    <input
                      value={s.newSubject.name}
                      onChange={(e) => dispatch({ type: "NEW_SUBJECT_SET", patch: { name: e.target.value } })}
                      className="input-field text-sm" placeholder="Subject name e.g. Data Structures" />
                    <div className="flex gap-2">
                      <input type="number" min="1" max="10"
                        value={s.newSubject.credits}
                        onChange={(e) => dispatch({ type: "NEW_SUBJECT_SET", patch: { credits: e.target.value } })}
                        className="input-field text-sm flex-1" placeholder="Credits" />
                      <button type="button" onClick={handleCreateSubject}
                        disabled={s.newSubject.busy || !s.newSubject.name.trim() || !s.newSubject.credits}
                        className="button-primary px-4 text-xs">
                        {s.newSubject.busy ? "…" : "Add"}
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
                    <GradePill key={g.value} value={g.value} selected={s.grade === g.value}
                      onClick={() => dispatch({ type: "SET_GRADE", value: g.value })} />
                  ))}
                </div>
                {s.grade && (
                  <p className="mt-2 text-xs text-slate-500">
                    {GRADES.find(g => g.value === s.grade)?.desc} · {GRADES.find(g => g.value === s.grade)?.points} grade points
                  </p>
                )}
              </div>

              {s.modalError && (
                <div className="rounded-xl p-3 text-sm text-rose-300"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
                  {s.modalError}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={handleSave}
                  disabled={s.busy || !s.subjectId || !s.grade}
                  className="button-primary flex-1">
                  {s.busy ? "Saving…" : isEditMode ? "Update" : "Add Subject"}
                </button>
                <button type="button" onClick={() => dispatch({ type: "CLOSE_MODAL" })}
                  disabled={s.busy} className="button-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete subject confirm */}
      {s.deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !s.deleteBusy) dispatch({ type: "SET_DELETE_TARGET", entry: null }); }}>
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
            <h2 className="card-title">Remove {s.deleteTarget.subject.name}?</h2>
            <p className="card-subtitle mt-1 mb-5">
              Grade {GRADES.find(g => g.value === s.deleteTarget.grade)?.label} · {s.deleteTarget.subject.credits} cr.
              SGPA recalculates immediately.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteSubject} disabled={s.deleteBusy}
                className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#f43f5e,#fb7185)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                {s.deleteBusy ? "Removing…" : "Yes, remove"}
              </button>
              <button type="button" className="button-secondary"
                disabled={s.deleteBusy}
                onClick={() => dispatch({ type: "SET_DELETE_TARGET", entry: null })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
