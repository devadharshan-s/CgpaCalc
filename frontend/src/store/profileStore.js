/**
 * Central state store for the app using useReducer.
 * Single source of truth — no prop-drilling refresh callbacks.
 */

export const initialState = {
  profile: null,
  authUser: null,
  semesterSummaries: {},   // { [semesterNumber]: SemesterSubjectSummaryDTO }
  loadingAuth: true,
  loadingProfile: false,
  error: "",
};

export function reducer(state, action) {
  switch (action.type) {

    case "AUTH_RESOLVED":
      return { ...state, loadingAuth: false };

    case "SET_AUTH_USER":
      return { ...state, authUser: action.payload };

    case "PROFILE_LOADING":
      return { ...state, loadingProfile: true, error: "" };

    case "PROFILE_LOADED":
      return { ...state, loadingProfile: false, profile: action.payload, error: "" };

    case "PROFILE_ERROR":
      return { ...state, loadingProfile: false, error: action.payload };

    case "PROFILE_CLEAR":
      return { ...initialState, loadingAuth: false };

    // Optimistic: remove semester from list immediately, don't wait for re-fetch
    case "SEMESTER_DELETED": {
      if (!state.profile) return state;
      const semesters = state.profile.semesters.filter(
        (s) => s.semester !== action.payload
      );
      const summaries = { ...state.semesterSummaries };
      delete summaries[action.payload];
      return {
        ...state,
        profile: { ...state.profile, semesters },
        semesterSummaries: summaries,
      };
    }

    // Patch cgpa on profile after recalculation
    case "CGPA_PATCHED":
      return {
        ...state,
        profile: state.profile ? { ...state.profile, cgpa: action.payload } : state.profile,
      };

    // Cache a full semester summary (subjects + sgpa + credits)
    case "SEMESTER_SUMMARY_LOADED":
      return {
        ...state,
        semesterSummaries: {
          ...state.semesterSummaries,
          [action.payload.semesterNumber]: action.payload.summary,
        },
      };

    // After any subject CRUD — update cached summary AND patch semester row in list
    case "SEMESTER_SUMMARY_UPDATED": {
      const { semesterNumber, summary } = action.payload;
      const semesters = (state.profile?.semesters ?? []).map((s) =>
        s.semester === semesterNumber
          ? { ...s, sgpa: summary.sgpa, credits: summary.credits }
          : s
      );
      // If semester not in list yet (first subject added), add it
      const exists = semesters.some((s) => s.semester === semesterNumber);
      const finalSemesters = exists
        ? semesters
        : [...semesters, { semester: semesterNumber, sgpa: summary.sgpa, credits: summary.credits }]
            .sort((a, b) => a.semester - b.semester);

      return {
        ...state,
        semesterSummaries: { ...state.semesterSummaries, [semesterNumber]: summary },
        profile: state.profile ? { ...state.profile, semesters: finalSemesters } : state.profile,
      };
    }

    default:
      return state;
  }
}
