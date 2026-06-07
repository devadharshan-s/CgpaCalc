import { useEffect, useMemo, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import { createUser, getProfile } from "./services/api";

const ACTIVE_USER_KEY = "cgpa-tracker-active-user";
const PROFILE_KEY = "cgpa-tracker-profile";

function readStoredUserId() {
  return window.localStorage.getItem(ACTIVE_USER_KEY) || "";
}

function readStoredProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [route, setRoute] = useState("landing");
  const [activeUserId, setActiveUserId] = useState(readStoredUserId);
  const [profile, setProfile] = useState(readStoredProfile);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_USER_KEY, activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (profile) {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(PROFILE_KEY);
    }
  }, [profile]);

  useEffect(() => {
    const initialUserId = readStoredUserId();
    if (initialUserId) {
      loadProfile(initialUserId).catch(() => {
        // The landing page surfaces the error state; ignore here.
      });
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

  const hasProfile = useMemo(() => Boolean(profile?.name), [profile]);

  async function loadProfile(userId) {
    if (!userId) {
      return;
    }

    setLoadingProfile(true);
    setLoadingMessage("");

    try {
      const data = await getProfile(userId);
      setProfile(data);
      setActiveUserId(String(userId));
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Could not load profile";
      setLoadingMessage(message);

      if (message.toLowerCase().includes("no semesters found")) {
        const fallbackProfile = profile?.id === Number(userId) || profile?.id === String(userId)
          ? profile
          : {
              id: Number(userId),
              name: `User ${userId}`,
              email: "",
              cgpa: 0,
              semesters: [],
            };

        setProfile(fallbackProfile);
        setActiveUserId(String(userId));
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(fallbackProfile));
        setLoadingMessage("");
        return fallbackProfile;
      }

      throw error;
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleCreateUser(payload) {
    const created = await createUser(payload);
    if (created?.id) {
      const localProfile = {
        id: created.id,
        name: payload.userName,
        email: payload.email,
        cgpa: 0,
        semesters: [],
      };

      setProfile(localProfile);
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(localProfile));
      setActiveUserId(String(created.id));
      window.location.hash = "profile";
    }
    return created;
  }

  async function handleOpenProfile(userId) {
    const data = await loadProfile(userId);
    if (data) {
      window.location.hash = "profile";
    }
  }

  async function handleRefreshProfile() {
    if (activeUserId) {
      await loadProfile(activeUserId);
    }
  }

  async function handleProfileMutated() {
    if (activeUserId) {
      await loadProfile(activeUserId);
    }
  }

  if (route === "profile") {
    return (
      <ProfilePage
        profile={profile}
        userId={activeUserId}
        onBack={() => {
          window.location.hash = "landing";
        }}
        onRefresh={handleProfileMutated}
        loading={loadingProfile}
      />
    );
  }

  return (
    <LandingPage
      profile={profile}
      userId={activeUserId}
      loading={loadingProfile}
      loadingMessage={loadingMessage}
      hasProfile={hasProfile}
      onCreateUser={handleCreateUser}
      onOpenProfile={handleOpenProfile}
      onRefresh={handleRefreshProfile}
    />
  );
}

export default App;
