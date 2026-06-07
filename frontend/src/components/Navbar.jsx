export default function Navbar({ label = "CGPA Tracker", onHomeClick, activeUserId, showProfile, authUser, onProfileClick, onLogout }) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <button type="button" onClick={onHomeClick} className="flex items-center gap-3 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 text-sm font-bold shadow-glow transition-transform group-hover:scale-105"
          style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
          G
        </div>
        <div className="flex flex-col items-start">
          <span className="font-display text-sm font-bold text-white leading-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
            {label}
          </span>
          <span className="text-xs text-slate-500 leading-tight">Grade Compass</span>
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
        {activeUserId && !authUser && (
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-amber-300"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.15)" }}>
            #{activeUserId}
          </span>
        )}
        {showProfile && (
          <button type="button" onClick={onProfileClick} className="button-secondary text-xs px-4 py-2">
            Dashboard →
          </button>
        )}
        {(authUser || activeUserId) && onLogout && (
          <button type="button" onClick={onLogout}
            className="button-ghost text-xs text-slate-500 hover:text-rose-400">
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
