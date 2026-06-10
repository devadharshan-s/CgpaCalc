import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-fc9e.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ── Auth ──────────────────────────────────────────────────
export function createUser(payload) {
  return api.post("/createUser", payload).then((r) => r.data);
}

export function getProfile(userId) {
  return api.get(`/users/${userId}/cgpa`).then((r) => r.data);
}

export function calculateTargetCgpa(userId, payload) {
  const params = new URLSearchParams({
    targetCgpa: String(payload.targetCgpa),
    remainingCredits: String(payload.remainingCredits),
  });
  return api.get(`/users/${userId}/targetCgpa?${params}`).then((r) => r.data);
}

// ── Semesters ─────────────────────────────────────────────
export function saveSemester(userId, payload) {
  // payload: { semester: int, credits: int }  — no sgpa, backend computes it
  return api.post(`/users/${userId}/semester`, payload).then((r) => r.data);
}

export function deleteSemester(userId, semesterId) {
  return api.delete(`/users/${userId}/deleteSemester`, { data: semesterId }).then((r) => r.data);
}

// ── Subjects (master list) ────────────────────────────────
export function listSubjects() {
  return api.get("/subjects").then((r) => r.data);
}

export function createSubject(payload) {
  // payload: { name: string, credits: int }
  return api.post("/subjects", payload).then((r) => r.data);
}

// ── Student subjects per semester ─────────────────────────
export function getSemesterSummary(userId, semesterNumber) {
  return api.get(`/users/${userId}/semesters/${semesterNumber}/subjects/summary`).then((r) => r.data);
}

export function addSubjectToSemester(userId, semesterNumber, payload) {
  // payload: { subjectId: int, grade: "O"|"A_PLUS"|"A"|"B_PLUS"|"B"|"C"|"U" }
  return api.post(`/users/${userId}/semesters/${semesterNumber}/subjects`, payload).then((r) => r.data);
}

export function updateSubjectInSemester(userId, semesterNumber, studentSubjectId, payload) {
  return api.put(`/users/${userId}/semesters/${semesterNumber}/subjects/${studentSubjectId}`, payload).then((r) => r.data);
}

export function deleteSubjectFromSemester(userId, semesterNumber, studentSubjectId) {
  return api.delete(`/users/${userId}/semesters/${semesterNumber}/subjects/${studentSubjectId}`).then((r) => r.data);
}

export default api;
