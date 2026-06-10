import { useEffect, useMemo, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import SemesterPage from "./pages/SemesterPage";
import { getProfile } from "./services/api";

const PROFILE_KEY = "cgpa-tracker-profile";
const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-fc9e.onrender.com";

function readStoredProfile() {
  try { return JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null"); }
  catch { return null; }
}

function readOAuthParams() {
  const p = new URLSearchParams(window.location.search);
  const profileId = p.get("profileId");
  if (!profileId) return null;
  return {
    profileId: Number(profileId),
    name:  decodeURIComponent(p.get("name")  || ""),
    email: decodeURIComponent(p.get("email") || ""),
  };
}

export default function App() {
  // route: "landing" | "profile" | { semester: number }
  const [route, setRoute]           = useState("landing");
  const [profile, setProfile]       = useState(readStoredProfile);
  const [authUser, setAuthUser]     = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    const params = readOAuthParams();
    if (params) {
      setLoadingMessage("Signing you in…");
      window.history.replaceState({}, "", "/");
      handleOAuthCallback(params);
    } else {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash;
      if (h === "#profile") setRoute("profile");
      else if (h === "#landing" || h === "") setRoute("landing");
      // semester routes use state directly
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(PROFILE_KEY);
  }, [profile]);

  async function handleOAuthCallback({ profileId, name, email }) {
    setLoadingAuth(true);
    const me = { name, email, profileId };
    setAuthUser(me);
    try {
      await loadProfile(profileId, me);
      window.location.hash = "profile";
    } catch { /* loadProfile handles fallback */ }
    finally { setLoadingAuth(false); }
  }

  async function loadProfile(userId, meData) {
    if (!userId) return;
    setLoadingProfile(true);
    setLoadingMessage("");
    try {
      const data = await getProfile(userId);
      setProfile(data);
      return data;
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error.message || "Could not load profile";
      if (status === 404 || msg.toLowerCase().includes("not found")) {
        const resolved = meData || authUser;
        const fallback = { id: Number(userId), name: resolved?.name || `User ${userId}`, email: resolved?.email || "", cgpa: null, semesters: [] };
        setProfile(fallback);
        setLoadingMessage("");
        return fallback;
      }
      setLoadingMessage(msg);
      throw error;
    } finally {
      setLoadingProfile(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  }

  function handleLogout() {
    setProfile(null);
    setAuthUser(null);
    window.localStorage.removeItem(PROFILE_KEY);
    window.location.href = `${API_URL}/logout`;
  }

  function handleOpenSemester(semNumber) {
    setRoute({ semester: semNumber });
  }

  function handleBackFromSemester() {
    window.location.hash = "profile";
    setRoute("profile");
  }

  const hasProfile = useMemo(() => Boolean(profile?.name), [profile]);

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm text-slate-400">{loadingMessage || "Loading…"}</p>
        </div>
      </div>
    );
  }

  // Semester detail route
  if (route?.semester) {
    return (
      <SemesterPage
        userId={profile?.id}
        semesterNumber={route.semester}
        onBack={handleBackFromSemester}
        onRefresh={() => loadProfile(profile?.id)}
      />
    );
  }

  if (route === "profile") {
    return (
      <ProfilePage
        profile={profile}
        userId={profile?.id}
        authUser={authUser}
        onBack={() => { window.location.hash = "landing"; }}
        onRefresh={() => loadProfile(profile?.id)}
        onLogout={handleLogout}
        loading={loadingProfile}
        onOpenSemester={handleOpenSemester}
      />
    );
  }

  return (
    <LandingPage
      authUser={authUser}
      profile={profile}
      hasProfile={hasProfile}
      onGoogleLogin={handleGoogleLogin}
      onLogout={handleLogout}
    />
  );
}
