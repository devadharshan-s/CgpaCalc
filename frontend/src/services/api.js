import axios from "axios";

const api = axios.create({
  baseURL: "",
  withCredentials: true, // send session cookie on every request
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
  // Backend expects the DB row id as body — semesterId here is the semester number
  // We pass it as a number in the request body
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
