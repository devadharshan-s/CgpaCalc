const MAX_SEMS = 8;

function SgpaBadge({ sgpa }) {
  const v = Number(sgpa);
  if (!v) return <span className="text-xs text-slate-500">—</span>;
  const color =
    v >= 9 ? "#fbbf24" : v >= 8 ? "#34d399" : v >= 7 ? "#60a5fa" : v >= 6 ? "#a78bfa" : "#fb7185";
  return (
    <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
      style={{ background: `${color}18`, color }}>
      {v.toFixed(2)}
    </span>
  );
}

export default function SemesterTable({ semesters, onDelete, onOpenSemester }) {
  const count = semesters?.length || 0;
  const atMax = count >= MAX_SEMS;

  return (
    <section className="glass-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="card-title">Semester Records</h2>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="card-subtitle">{count} / {MAX_SEMS} semesters</p>
            {atMax && <span className="badge-warn text-xs">Max reached</span>}
          </div>
        </div>
        {/* "Add Semester" is now implicit — clicking into any semester auto-creates it */}
        <button type="button"
          onClick={() => onOpenSemester(count + 1)}
          disabled={atMax}
          className="button-primary py-2 px-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
          + New Semester
        </button>
      </div>

      <div className="mb-4 relative h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${(count / MAX_SEMS) * 100}%`,
            background: atMax ? "linear-gradient(90deg,#fb7185,#f43f5e)" : "linear-gradient(90deg,#fbbf2488,#fbbf24)",
          }} />
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Semester</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SGPA</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Credits</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {count ? (
              semesters.map((s) => (
                <tr key={s.semester}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                  onClick={() => onOpenSemester(s.semester)}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-slate-950"
                        style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                        {s.semester}
                      </div>
                      <span className="text-xs text-slate-400">Sem {s.semester}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <SgpaBadge sgpa={s.sgpa} />
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium" onClick={e => e.stopPropagation()}>
                    {s.credits > 0 ? `${s.credits} cr` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onOpenSemester(s.semester)}
                        className="button-ghost py-1.5 text-xs">Open</button>
                      <button type="button" onClick={() => onDelete(s)}
                        className="button-ghost py-1.5 text-xs text-rose-400 hover:text-rose-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span className="text-2xl">📚</span>
                    </div>
                    <p className="text-sm text-slate-400">No semesters yet</p>
                    <p className="text-xs text-slate-600">Click "+ New Semester" to start tracking</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
