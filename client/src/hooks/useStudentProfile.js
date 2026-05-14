import React from "react";
import { getMyProfile, saveMyProfile } from "../services/profileService";
import { useAuth } from "../context/AuthContext";

export function useStudentProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        setProfile(data.profile);
      } catch (e) {
        console.error("Profile load failed:", e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const saveProfile = async (patch) => {
    if (!user) return;
    try {
      setSaving(true);
      const merged = { ...(profile || {}), ...(patch || {}) };
      setProfile(merged);
      await saveMyProfile(merged);
    } catch (e) {
      console.error("Profile save failed:", e.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: mark course/project completed and auto-boost skills
  const completeItem = async (type, item) => {
    if (!user) return;
    try {
      setSaving(true);
      const resp = await completeOpportunity(type, item);
      if (resp?.profile) setProfile(resp.profile);
      return resp;
    } catch (e) {
      console.error("Complete item failed:", e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  return { profile, setProfile, saveProfile, completeItem, loading, saving };
}
