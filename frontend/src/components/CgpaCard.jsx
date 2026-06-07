export default function CgpaCard({ profile }) {
  const cgpa = typeof profile?.cgpa === "number" ? profile.cgpa : null;
  const cgpaStr = cgpa !== null ? cgpa.toFixed(2) : "--";
  const semCount = profile?.semesters?.length ?? 0;

  const grade =
    cgpa === null ? null
    : cgpa >= 9 ? { label: "Outstanding", color: "#fbbf24" }
    : cgpa >= 8 ? { label: "Excellent", color: "#34d399" }
    : cgpa >= 7 ? { label: "Good", color: "#60a5fa" }
    : cgpa >= 6 ? { label: "Average", color: "#a78bfa" }
    : { label: "Needs Work", color: "#fb7185" };

  const pct = cgpa !== null ? Math.min(100, (cgpa / 10) * 100) : 0;

  return (
    <section className="glass-card-rich flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">Current CGPA</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="metric-value">{cgpaStr}</span>
            <span className="text-lg text-slate-500 font-light">/&nbsp;10</span>
          </div>
        </div>
        {grade && (
          <span
            className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ background: `${grade.color}18`, border: `1px solid ${grade.color}30`, color: grade.color }}
          >
            {grade.label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: grade ? `linear-gradient(90deg, ${grade.color}88, ${grade.color})` : "rgba(255,255,255,0.2)",
          }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-chip">
          <p className="metric-label">Semesters</p>
          <p className="mt-1 text-lg font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>{semCount}</p>
        </div>
        <div className="stat-chip">
          <p className="metric-label">Name</p>
          <p className="mt-1 text-sm font-semibold text-white truncate">{profile?.name || "--"}</p>
        </div>
        <div className="stat-chip">
          <p className="metric-label">Email</p>
          <p className="mt-1 text-xs text-slate-300 truncate">{profile?.email || "--"}</p>
        </div>
      </div>
    </section>
  );
}
