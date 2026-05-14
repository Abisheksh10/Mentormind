import { apiFetch } from "./apiClient";

export async function getMyProfile() {
  return apiFetch("/api/profile/me");
}

export async function saveMyProfile(profile) {
  return apiFetch("/api/profile/save", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

