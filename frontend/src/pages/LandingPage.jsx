import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import CgpaCard from "../components/CgpaCard";

const emptyUser = { userName: "", email: "" };

export default function LandingPage({
  profile, userId, authUser, loading, loadingMessage,
  hasProfile, onCreateUser, onOpenProfile, onGoogleLogin, onLogout,
}) {
  const [userForm, setUserForm] = useState(emptyUser);
  const [profileId, setProfileId] = useState(userId || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("google"); // "google" | "create" | "open"

  useEffect(() => setProfileId(userId || ""), [userId]);

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onCreateUser(userForm);
      setUserForm(emptyUser);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to create user");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onOpenProfile(profileId);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        onHomeClick={() => { window.location.hash = "landing"; }}
        activeUserId={userId}
        showProfile={hasProfile}
        authUser={authUser}
        onProfileClick={() => { window.location.hash = "profile"; }}
        onLogout={onLogout}
      />

      <main className="space-y-6 animate-in">
        {/* Hero */}
        <section className="hero-card">
          <span className="section-kicker">Grade Compass</span>
          <h1 className="headline mt-5">
            Your grades,<br />
            <span style={{ color: "#fbbf24" }}>crystal clear.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Track SGPA across semesters, calculate your live CGPA, and find out exactly
            what you need to hit your target. Built for students who actually care.
          </p>

          {hasProfile && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="stat-chip">
                <p className="metric-label">Current CGPA</p>
                <p className="mt-0.5 text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                  {typeof profile?.cgpa === "number" && profile.cgpa > 0 ? profile.cgpa.toFixed(2) : "--"}
                </p>
              </div>
              <div className="stat-chip">
                <p className="metric-label">Semesters</p>
                <p className="mt-0.5 text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                  {profile?.semesters?.length ?? 0}
                </p>
              </div>
              <div className="stat-chip">
                <p className="metric-label">Student</p>
                <p className="mt-0.5 text-sm font-semibold text-amber-300">{profile?.name || "--"}</p>
              </div>
              <button
                type="button"
                onClick={() => { window.location.hash = "profile"; }}
                className="button-primary self-end"
              >
                Open Dashboard →
              </button>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Auth panel */}
          <div className="glass-card-rich">
            {/* Tab switcher */}
            <div className="mb-5 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                { key: "google", label: "Sign in with Google" },
                { key: "create", label: "New Profile" },
                { key: "open",   label: "Existing Profile" },
              ].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                  style={tab === key
                    ? { background: "rgba(255,255,255,0.1)", color: "white" }
                    : { color: "#64748b" }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "google" && (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="card-title">Sign in with Google</h2>
                  <p className="card-subtitle mt-1">One click — your profile loads automatically</p>
                </div>
                {authUser ? (
                  <div className="w-full rounded-xl p-4 text-center"
                    style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)" }}>
                    <p className="text-sm text-emerald-400 font-semibold">✓ Signed in as {authUser.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{authUser.email}</p>
                  </div>
                ) : (
                  <button type="button" onClick={onGoogleLogin} className="button-primary w-full gap-3">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
                <p className="text-xs text-slate-500 text-center">
                  Or use the other tabs to create/open a profile manually
                </p>
              </div>
            )}

            {tab === "create" && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h2 className="card-title">Create your profile</h2>
                  <p className="card-subtitle mb-4">Start fresh with a name and email</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Full Name</label>
                  <input value={userForm.userName}
                    onChange={(e) => setUserForm((c) => ({ ...c, userName: e.target.value }))}
                    className="input-field" placeholder="Priya Sharma" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email</label>
                  <input type="email" value={userForm.email}
                    onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))}
                    className="input-field" placeholder="priya@college.edu" required />
                </div>
                <button type="submit" className="button-primary w-full" disabled={busy}>
                  {busy ? "Creating..." : "Create Profile →"}
                </button>
              </form>
            )}

            {tab === "open" && (
              <form onSubmit={handleOpen} className="space-y-4">
                <div>
                  <h2 className="card-title">Open your profile</h2>
                  <p className="card-subtitle mb-4">Enter your user ID to continue</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">User ID</label>
                  <input type="number" min="1" value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="input-field" placeholder="1" required />
                </div>
                {userId && (
                  <div className="rounded-xl p-3 text-xs text-amber-300"
                    style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    Last session: User ID #{userId}
                  </div>
                )}
                <button type="submit" className="button-primary w-full" disabled={busy || !profileId}>
                  {busy ? "Loading..." : "Open Profile →"}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-4 rounded-xl p-3 text-sm text-rose-300"
                style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}>
                {error}
              </div>
            )}
            {loadingMessage && (
              <div className="mt-4 rounded-xl p-3 text-sm text-amber-300"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                {loadingMessage}
              </div>
            )}
          </div>

          <CgpaCard profile={profile} />
        </div>

        {/* How it works */}
        <section className="glass-card">
          <h2 className="card-title mb-4">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Sign in", desc: "Log in with Google or create a manual profile" },
              { step: "02", title: "Log semesters", desc: "Add your SGPA and credits each term (up to 8 sems)" },
              { step: "03", title: "Hit your target", desc: "Calculate required SGPA for your dream CGPA" },
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
