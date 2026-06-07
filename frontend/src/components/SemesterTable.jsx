function SgpaBadge({ sgpa }) {
  const v = Number(sgpa);
  const color =
    v >= 9 ? "#fbbf24"
    : v >= 8 ? "#34d399"
    : v >= 7 ? "#60a5fa"
    : v >= 6 ? "#a78bfa"
    : "#fb7185";

  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
      style={{ background: `${color}18`, color }}
    >
      {v.toFixed(2)}
    </span>
  );
}

export default function SemesterTable({ semesters, onAdd, onEdit }) {
  return (
    <section className="glass-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="card-title">Semester Records</h2>
          <p className="card-subtitle">{semesters?.length || 0} semester{semesters?.length !== 1 ? "s" : ""} logged</p>
        </div>
        <button type="button" onClick={onAdd} className="button-primary py-2 px-4 text-xs">
          + Add Semester
        </button>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Semester</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SGPA</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Credits</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {semesters?.length ? (
              semesters.map((s, i) => (
                <tr
                  key={s.semester}
                  className="transition-colors"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-slate-950"
                        style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                      >
                        {s.semester}
                      </div>
                      <span className="text-xs text-slate-400">Sem {s.semester}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SgpaBadge sgpa={s.sgpa} />
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{s.credits} cr</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="button-ghost py-1.5"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500">
                  No semesters yet. Hit "Add Semester" to begin tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
