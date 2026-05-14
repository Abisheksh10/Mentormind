import React, { useState } from "react";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../context/AuthContext";

export default function SignIn({ onSwitchToSignUp }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Continue building your career roadmap."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs mm-muted">Email</label>
          <input
            className="mm-input mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-xs mm-muted">Password</label>
          <input
            className="mm-input mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            required
          />
        </div>

        {err ? (
          <div className="text-sm px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,0,0,0.08)]">
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mm-btn-primary w-full justify-center"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="mm-btn w-full justify-center"
        >
          Create new account
        </button>
      </form>
    </AuthLayout>
  );
}
