import React, { createContext, useContext, useMemo, useState } from "react";
import { loginUser, registerUser, logoutUser } from "../services/authService";
import { getToken, clearToken, apiFetch } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootChecked, setBootChecked] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  React.useEffect(() => {
    const boot = async () => {
      try {
        const token = getToken();
        if (!token) {
          setUser(null);
          return;
        }

        // ✅ Verify token by calling a protected API
        await apiFetch("/api/profile/me"); // if token invalid => throws
        setUser({ isLoggedIn: true });
      } catch (e) {
        // ✅ Token invalid => clear it and show login page
        clearToken();
        setUser(null);
      } finally {
        setBootLoading(false);
        setBootChecked(true);
      }
    };

    boot();
  }, []);

  const value = useMemo(
    () => ({
      user,
      bootChecked,
      bootLoading,

      async login(payload) {
        const u = await loginUser(payload);
        setUser(u);
        return u;
      },

      async register(payload) {
        const u = await registerUser(payload);
        setUser(u);
        return u;
      },

      logout() {
        logoutUser();
        setUser(null);
      }
    }),
    [user, bootChecked, bootLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
