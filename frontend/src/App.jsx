import { useEffect, useMemo, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import { getProfile } from "./services/api";

const PROFILE_KEY = "cgpa-tracker-profile";
const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-production.up.railway.app";

function readStoredProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Reads ?profileId=&name=&email= from the URL after OAuth redirect.
 * Returns the parsed params or null if not a callback.
 */
function readOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("profileId");
  if (!profileId) return null;
  return {
    profileId: Number(profileId),
    name:  decodeURIComponent(params.get("name")  || ""),
    email: decodeURIComponent(params.get("email") || ""),
  };
}

function App() {
  const [route, setRoute]               = useState("landing");
  const [profile, setProfile]           = useState(readStoredProfile);
  const [authUser, setAuthUser]         = useState(null);
  const [loadingAuth, setLoadingAuth]   = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    const oauthParams = readOAuthParams();

    if (oauthParams) {
      // Coming back from Google OAuth — data is in the URL, no cookie needed
      setLoadingMessage("Signing you in...");
      // Clean the URL immediately so params don't persist on refresh
      window.history.replaceState({}, "", "/");
      handleOAuthCallback(oauthParams);
    } else {
      // Normal load — just finish auth check immediately
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash === "#profile" ? "profile" : "landing");
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (profile) {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(PROFILE_KEY);
    }
  }, [profile]);

  async function handleOAuthCallback({ profileId, name, email }) {
    setLoadingAuth(true);
    const me = { name, email, profileId };
    setAuthUser(me);
    try {
      await loadProfile(profileId, me);
      window.location.hash = "profile";
    } catch {
      // loadProfile handles its own fallback for new users
    } finally {
      setLoadingAuth(false);
    }
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

      // New user — graceful empty profile
      if (status === 404 || msg.toLowerCase().includes("not found")) {
        const resolvedAuth = meData || authUser;
        const fallback = {
          id: Number(userId),
          name:  resolvedAuth?.name  || `User ${userId}`,
          email: resolvedAuth?.email || "",
          cgpa: null,
          semesters: [],
        };
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

  async function handleCreateUser(payload) {
    const { createUser } = await import("./services/api");
    const created = await createUser(payload);
    if (created?.id) {
      setProfile({
        id: created.id,
        name: payload.userName,
        email: payload.email,
        cgpa: null,
        semesters: [],
      });
      window.location.hash = "profile";
    }
    return created;
  }

  async function handleOpenProfile(userId) {
    const data = await loadProfile(userId);
    if (data) window.location.hash = "profile";
  }

  async function handleRefreshProfile() {
    const id = profile?.id;
    if (id) await loadProfile(id);
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

  const hasProfile = useMemo(() => Boolean(profile?.name), [profile]);

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm text-slate-400">
            {loadingMessage || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (route === "profile") {
    return (
      <ProfilePage
        profile={profile}
        userId={profile?.id}
        authUser={authUser}
        onBack={() => { window.location.hash = "landing"; }}
        onRefresh={handleRefreshProfile}
        onLogout={handleLogout}
        loading={loadingProfile}
      />
    );
  }

  return (
    <LandingPage
      profile={profile}
      userId={profile?.id}
      authUser={authUser}
      loading={loadingProfile}
      loadingMessage={loadingMessage}
      hasProfile={hasProfile}
      onCreateUser={handleCreateUser}
      onOpenProfile={handleOpenProfile}
      onGoogleLogin={handleGoogleLogin}
      onLogout={handleLogout}
    />
  );
}

export default App;
