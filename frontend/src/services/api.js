import axios from "axios";

// Empty baseURL so all requests go through Vite's proxy (same origin = no CORS)
const api = axios.create({
  baseURL: "",
});

export function createUser(payload) {
  return api.post("/createUser", payload).then((response) => response.data);
}

export function getProfile(userId) {
  return api.get(`/users/${userId}/cgpa`).then((response) => response.data);
}

export function saveSemester(userId, payload) {
  return api.post(`/users/${userId}/semester`, payload).then((response) => response.data);
}

export function updateSemester(userId, payload) {
  return api.patch(`/users/${userId}/updateSemester`, payload).then((response) => response.data);
}

export function deleteSemester(userId, semesterId) {
  return api
    .delete(`/users/${userId}/deleteSemester`, { data: semesterId })
    .then((response) => response.data);
}

export function calculateTargetCgpa(userId, payload) {
  const params = new URLSearchParams({
    targetCgpa: String(payload.targetCgpa),
    remainingCredits: String(payload.remainingCredits),
  });

  return api
    .get(`/users/${userId}/targetCgpa?${params.toString()}`)
    .then((response) => response.data);
}

export default api;
