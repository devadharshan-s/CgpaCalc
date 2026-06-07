import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card py-2 px-4 text-sm" style={{ minWidth: 120 }}>
      <p className="text-slate-400 text-xs">Semester {label}</p>
      <p className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: "Syne,sans-serif" }}>
        {Number(payload[0].value).toFixed(2)}
      </p>
      <p className="text-xs text-amber-400">SGPA</p>
    </div>
  );
}

export default function ProgressChart({ semesters }) {
  const data = (semesters || []).map((s) => ({
    semester: `S${s.semester}`,
    sgpa: s.sgpa,
  }));

  const avg = data.length
    ? (data.reduce((sum, d) => sum + d.sgpa, 0) / data.length).toFixed(2)
    : null;

  return (
    <section className="glass-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title">SGPA Trend</h2>
          <p className="card-subtitle">Your performance across semesters</p>
        </div>
        {avg && (
          <div className="stat-chip text-right">
            <p className="metric-label">Avg SGPA</p>
            <p className="mt-0.5 text-base font-bold text-amber-400" style={{ fontFamily: "Syne,sans-serif" }}>{avg}</p>
          </div>
        )}
      </div>

      {data.length ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="sgpaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="semester"
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(251,191,36,0.2)", strokeWidth: 1 }} />
              {avg && (
                <ReferenceLine
                  y={parseFloat(avg)}
                  stroke="rgba(251,191,36,0.3)"
                  strokeDasharray="6 3"
                  label={false}
                />
              )}
              <Area
                type="monotone"
                dataKey="sgpa"
                stroke="#fbbf24"
                strokeWidth={2.5}
                fill="url(#sgpaGrad)"
                dot={{ r: 4, fill: "#fbbf24", strokeWidth: 2, stroke: "#080f1e" }}
                activeDot={{ r: 6, fill: "#fbbf24", stroke: "#080f1e", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M3 17l5-5 4 4 9-9" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">No data yet — add your first semester to see the trend.</p>
        </div>
      )}
    </section>
  );
}
