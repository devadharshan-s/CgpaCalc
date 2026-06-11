import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-fc9e.onrender.com";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

// ── Profile ───────────────────────────────────────────────
export const getProfile = (userId) =>
  api.get(`/users/${userId}/cgpa`).then((r) => r.data);

export const calculateTargetCgpa = (userId, payload) =>
  api.get(`/users/${userId}/targetCgpa?${new URLSearchParams({
    targetCgpa: String(payload.targetCgpa),
    remainingCredits: String(payload.remainingCredits),
  })}`).then((r) => r.data);

// ── Semesters ─────────────────────────────────────────────
export const saveSemester = (userId, payload) =>
  api.post(`/users/${userId}/semester`, payload).then((r) => r.data);

// Fixed: DELETE /users/{userId}/semesters/{semesterNumber} — path variable, no body
export const deleteSemester = (userId, semesterNumber) =>
  api.delete(`/users/${userId}/semesters/${semesterNumber}`).then((r) => r.data);

// ── Subjects master list ──────────────────────────────────
export const listSubjects = () =>
  api.get("/subjects").then((r) => r.data);

export const createSubject = (payload) =>
  api.post("/subjects", payload).then((r) => r.data);

// ── Student subjects (per semester) ──────────────────────
export const getSemesterSummary = (userId, semNum) =>
  api.get(`/users/${userId}/semesters/${semNum}/subjects/summary`).then((r) => r.data);

export const addSubjectToSemester = (userId, semNum, payload) =>
  api.post(`/users/${userId}/semesters/${semNum}/subjects`, payload).then((r) => r.data);

export const updateSubjectInSemester = (userId, semNum, studentSubjectId, payload) =>
  api.put(`/users/${userId}/semesters/${semNum}/subjects/${studentSubjectId}`, payload).then((r) => r.data);

export const deleteSubjectFromSemester = (userId, semNum, studentSubjectId) =>
  api.delete(`/users/${userId}/semesters/${semNum}/subjects/${studentSubjectId}`).then((r) => r.data);

export default api;
