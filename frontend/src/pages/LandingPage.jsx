import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import CgpaCard from "../components/CgpaCard";

const emptyUser = { userName: "", email: "" };

export default function LandingPage({
  profile,
  userId,
  loading,
  loadingMessage,
  hasProfile,
  onCreateUser,
  onOpenProfile,
  onRefresh,
}) {
  const [userForm, setUserForm] = useState(emptyUser);
  const [profileId, setProfileId] = useState(userId || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("create"); // "create" | "open"

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
        onProfileClick={() => { window.location.hash = "profile"; }}
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

          {/* Quick stats strip */}
          {hasProfile && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="stat-chip">
                <p className="metric-label">Current CGPA</p>
                <p className="mt-0.5 text-xl font-bold text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                  {typeof profile?.cgpa === "number" ? profile.cgpa.toFixed(2) : "--"}
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

        {/* Form + card grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Auth panel */}
          <div className="glass-card-rich">
            {/* Tab switcher */}
            <div className="mb-5 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              {["create", "open"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
                  style={
                    tab === t
                      ? { background: "rgba(255,255,255,0.1)", color: "white" }
                      : { color: "#64748b" }
                  }
                >
                  {t === "create" ? "New Profile" : "Existing Profile"}
                </button>
              ))}
            </div>

            {tab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h2 className="card-title">Create your profile</h2>
                  <p className="card-subtitle mb-4">Start fresh with a name and email</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Full Name</label>
                  <input
                    value={userForm.userName}
                    onChange={(e) => setUserForm((c) => ({ ...c, userName: e.target.value }))}
                    className="input-field"
                    placeholder="Priya Sharma"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))}
                    className="input-field"
                    placeholder="priya@college.edu"
                    required
                  />
                </div>
                <button type="submit" className="button-primary w-full" disabled={busy}>
                  {busy ? "Creating..." : "Create Profile →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOpen} className="space-y-4">
                <div>
                  <h2 className="card-title">Open your profile</h2>
                  <p className="card-subtitle mb-4">Enter your user ID to continue</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">User ID</label>
                  <input
                    type="number"
                    min="1"
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="input-field"
                    placeholder="1"
                    required
                  />
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

          {/* CGPA snapshot */}
          <CgpaCard profile={profile} />
        </div>

        {/* How it works */}
        <section className="glass-card">
          <h2 className="card-title mb-4">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Create profile", desc: "Set up your student account in seconds" },
              { step: "02", title: "Log semesters", desc: "Add your SGPA and credits each term" },
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
