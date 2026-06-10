export default function LandingPage({ authUser, onGoogleLogin, onLogout, profile, hasProfile }) {
  const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-fc9e.onrender.com";

  return (
    <div className="app-shell">
      {/* Navbar */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>G</div>
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>Grade Compass</p>
            <p className="text-xs text-slate-500">CGPA Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {authUser && (
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {authUser.name?.split(" ")[0]}
            </span>
          )}
          {hasProfile && (
            <button type="button" onClick={() => { window.location.hash = "profile"; }}
              className="button-secondary text-xs px-4 py-2">Dashboard →</button>
          )}
          {authUser && (
            <button type="button" onClick={onLogout}
              className="button-ghost text-xs text-slate-500 hover:text-rose-400">Sign out</button>
          )}
        </div>
      </header>

      <main className="space-y-6 animate-in">
        {/* Hero */}
        <section className="hero-card">
          <span className="section-kicker">Grade Compass</span>
          <h1 className="headline mt-5">
            Your grades,<br />
            <span style={{ color: "#fbbf24" }}>crystal clear.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Enter your subjects and grades each semester. We compute your SGPA, track your CGPA,
            and tell you exactly what you need to hit your target. Built for students who actually care.
          </p>
          {hasProfile && (
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <div className="stat-chip">
                <p className="metric-label">CGPA</p>
                <p className="mt-0.5 text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "#fbbf24" }}>
                  {typeof profile?.cgpa === "number" && profile.cgpa > 0 ? profile.cgpa.toFixed(2) : "--"}
                </p>
              </div>
              <div className="stat-chip">
                <p className="metric-label">Semesters</p>
                <p className="mt-0.5 text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                  {profile?.semesters?.length ?? "--"}
                </p>
              </div>
              <button type="button" onClick={() => { window.location.hash = "profile"; }}
                className="button-primary self-end">Open Dashboard →</button>
            </div>
          )}
        </section>

        {/* Sign in card */}
        <div className="mx-auto max-w-sm">
          <div className="glass-card-rich flex flex-col items-center gap-6 py-8 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <svg viewBox="0 0 24 24" width="34" height="34">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>

            {authUser ? (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-emerald-400 mb-1"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Signed in
                  </div>
                  <p className="text-base font-bold text-white mt-2">{authUser.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{authUser.email}</p>
                </div>
                <button type="button" onClick={() => { window.location.hash = "profile"; }}
                  className="button-primary w-full">Go to Dashboard →</button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="card-title">Sign in to get started</h2>
                  <p className="card-subtitle mt-1">Your profile loads automatically after sign-in</p>
                </div>
                <button type="button" onClick={onGoogleLogin}
                  className="button-primary w-full gap-3">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </div>
        </div>

        {/* How it works */}
        <section className="glass-card">
          <h2 className="card-title mb-4">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Sign in with Google", desc: "One click and your profile is ready" },
              { step: "02", title: "Add subjects & grades", desc: "Pick subject, credits, and your grade (O/A+/A…) for each semester" },
              { step: "03", title: "Track & target", desc: "See live SGPA, CGPA, and what you need to hit your goal" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="stat-chip">
                <span className="text-xs font-bold text-amber-400" style={{ fontFamily: "Syne,sans-serif" }}>{step}</span>
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
