import axios from "axios";

// Fallback to Railway URL directly if env var is missing
const API_URL = import.meta.env.VITE_API_URL || "https://cgpacalc-production.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export function getMe() {
  return api.get("/me").then((r) => r.data);
}

export function createUser(payload) {
  return api.post("/createUser", payload).then((r) => r.data);
}

export function getProfile(userId) {
  return api.get(`/users/${userId}/cgpa`).then((r) => r.data);
}

export function saveSemester(userId, payload) {
  return api.post(`/users/${userId}/semester`, payload).then((r) => r.data);
}

export function updateSemester(userId, payload) {
  return api.patch(`/users/${userId}/updateSemester`, payload).then((r) => r.data);
}

export function deleteSemester(userId, semesterId) {
  return api
    .delete(`/users/${userId}/deleteSemester`, { data: semesterId })
    .then((r) => r.data);
}

export function calculateTargetCgpa(userId, payload) {
  const params = new URLSearchParams({
    targetCgpa: String(payload.targetCgpa),
    remainingCredits: String(payload.remainingCredits),
  });
  return api.get(`/users/${userId}/targetCgpa?${params}`).then((r) => r.data);
}

export default api;
