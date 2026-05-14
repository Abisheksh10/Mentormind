const KEY = "mentormind_profile_v1";

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load profile:", e);
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error("Failed to clear profile:", e);
  }
}
