import React from "react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[460px]">
        <div className="mm-card p-8">
          <div className="mb-6">
            <p className="mm-pill inline-flex mb-3">MentorMind</p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm mm-muted">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 mm-divider" />

          <div className="mt-5 text-xs mm-muted leading-relaxed">
            <p>
              Your profile, skills, and simulations are stored securely in MongoDB.
              Core recommendations are powered by your own ML models (FastAPI service).
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs mm-muted">
          © {new Date().getFullYear()} MentorMind
        </div>
      </div>
    </div>
  );
}
