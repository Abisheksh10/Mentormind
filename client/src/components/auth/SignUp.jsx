import React, { useState } from "react";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../context/AuthContext";

export default function SignUp({ onSwitchToSignIn }) {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await register({ name, email, password });
    } catch (e2) {
      setErr(e2.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking skills, scoring careers, and building your path."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs mm-muted">Full name</label>
          <input
            className="mm-input mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            type="text"
            required
          />
        </div>

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
            placeholder="Create a secure password"
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="mm-btn w-full justify-center"
        >
          Back to Sign In
        </button>
      </form>
    </AuthLayout>
  );
}
