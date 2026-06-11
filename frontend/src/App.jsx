import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import SemesterPage from "./pages/SemesterPage";
import { reducer, initialState } from "./store/profileStore";
import { getProfile, deleteSemester } from "./services/api";

const PROFILE_KEY = "cgpa-tracker-profile";
const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-fc9e.onrender.com";

function readStored() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); }
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

function recalcCgpa(semesters) {
  const valid = (semesters || []).filter((s) => s.credits > 0 && s.sgpa > 0);
  if (!valid.length) return null;
  const totalCredits = valid.reduce((sum, s) => sum + s.credits, 0);
  const weighted     = valid.reduce((sum, s) => sum + s.sgpa * s.credits, 0);
  return totalCredits > 0 ? weighted / totalCredits : null;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    profile: readStored(),
    loadingAuth: true,
  });
  // "landing" | "profile" | { semester: number }
  const [route, setRoute] = useState("landing");

  const { profile, authUser, semesterSummaries, loadingAuth, loadingProfile } = state;

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_KEY);
  }, [profile]);

  useEffect(() => {
    const params = readOAuthParams();
    if (params) {
      window.history.replaceState({}, "", "/");
      dispatch({ type: "SET_AUTH_USER", payload: params });
      fetchProfile(params.profileId, params)
        .then(() => { setRoute("profile"); window.location.hash = "profile"; })
        .catch(() => {})
        .finally(() => dispatch({ type: "AUTH_RESOLVED" }));
    } else {
      dispatch({ type: "AUTH_RESOLVED" });
    }
  }, []);

  useEffect(() => {
    function onHash() {
      const h = window.location.hash;
      if (h === "#profile") setRoute("profile");
      else if (!h || h === "#landing") setRoute("landing");
    }
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const fetchProfile = useCallback(async (userId, meData) => {
    if (!userId) return;
    dispatch({ type: "PROFILE_LOADING" });
    try {
      const data = await getProfile(userId);
      dispatch({ type: "PROFILE_LOADED", payload: data });
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || "Could not load profile";
      if (status === 404 || msg.toLowerCase().includes("not found")) {
        const resolved = meData || authUser;
        const fallback = {
          id: Number(userId),
          name:  resolved?.name  || `User ${userId}`,
          email: resolved?.email || "",
          cgpa:  null,
          semesters: [],
        };
        dispatch({ type: "PROFILE_LOADED", payload: fallback });
        return fallback;
      }
      dispatch({ type: "PROFILE_ERROR", payload: msg });
      throw err;
    }
  }, [authUser]);

  const actions = useMemo(() => ({

    googleLogin: () => {
      window.location.href = `${API_URL}/oauth2/authorization/google`;
    },

    logout: () => {
      dispatch({ type: "PROFILE_CLEAR" });
      window.location.href = `${API_URL}/logout`;
    },

    openSemester: (semNum) => setRoute({ semester: semNum }),

    backFromSemester: () => {
      setRoute("profile");
      window.location.hash = "profile";
    },

    refreshProfile: async () => {
      if (profile?.id) await fetchProfile(profile.id);
    },

    // Optimistic delete: update UI instantly, confirm with server, rollback on error
    deleteSemester: async (semesterNumber) => {
      dispatch({ type: "SEMESTER_DELETED", payload: semesterNumber });
      const remaining = (profile?.semesters ?? []).filter(
        (s) => s.semester !== semesterNumber
      );
      dispatch({ type: "CGPA_PATCHED", payload: recalcCgpa(remaining) });

      try {
        await deleteSemester(profile.id, semesterNumber);
        // Server confirmed — re-fetch to get authoritative cgpa
        await fetchProfile(profile.id);
      } catch (err) {
        // Rollback
        await fetchProfile(profile.id);
        throw err;
      }
    },

    // Called by SemesterPage after any subject mutation
    onSummaryUpdated: (semesterNumber, summary) => {
      dispatch({
        type: "SEMESTER_SUMMARY_UPDATED",
        payload: { semesterNumber, summary },
      });
      // Recalc cgpa optimistically
      const updated = (profile?.semesters ?? []).map((s) =>
        s.semester === semesterNumber
          ? { ...s, sgpa: summary.sgpa, credits: summary.credits }
          : s
      );
      // If new semester not in list yet
      if (!updated.some((s) => s.semester === semesterNumber)) {
        updated.push({ semester: semesterNumber, sgpa: summary.sgpa, credits: summary.credits });
      }
      dispatch({ type: "CGPA_PATCHED", payload: recalcCgpa(updated) });
    },

    cacheSemesterSummary: (semesterNumber, summary) => {
      dispatch({
        type: "SEMESTER_SUMMARY_LOADED",
        payload: { semesterNumber, summary },
      });
    },

  }), [profile, fetchProfile]);

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Signing you in…</p>
        </div>
      </div>
    );
  }

  if (route?.semester) {
    return (
      <SemesterPage
        userId={profile?.id}
        semesterNumber={route.semester}
        cachedSummary={semesterSummaries[route.semester] ?? null}
        onBack={actions.backFromSemester}
        onSummaryUpdated={actions.onSummaryUpdated}
        cacheSemesterSummary={actions.cacheSemesterSummary}
      />
    );
  }

  if (route === "profile") {
    return (
      <ProfilePage
        profile={profile}
        authUser={authUser}
        loading={loadingProfile}
        actions={actions}
      />
    );
  }

  return (
    <LandingPage
      authUser={authUser}
      profile={profile}
      hasProfile={Boolean(profile?.name)}
      onGoogleLogin={actions.googleLogin}
      onLogout={actions.logout}
    />
  );
}
