const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("mm_token");
}

export function setToken(token) {
  localStorage.setItem("mm_token", token);
}

export function clearToken() {
  localStorage.removeItem("mm_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || "API request failed");
  }

  return data;
}
