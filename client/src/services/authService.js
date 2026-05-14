import { apiFetch, setToken, clearToken } from "./apiClient";

export async function registerUser(payload) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

export async function loginUser(payload) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

export function logoutUser() {
  clearToken();
}
