import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  GraduationCap,
  Brain,
  Target,
  Route,
  User,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const menu = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "academic", label: "Academic Progress", icon: GraduationCap },
  { key: "digitalTwin", label: "Digital Twin", icon: Brain },
  { key: "skills", label: "Skills Analysis", icon: Target },
  { key: "careers", label: "Career Paths", icon: Route },
  { key: "profile", label: "Profile", icon: User },
];

function applyTheme(isLight) {
  const root = document.documentElement;
  if (isLight) root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem("mm_theme", isLight ? "light" : "dark");
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [isLight, setIsLight] = useState(false);

  // ✅ Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mm_theme");
    const light = saved === "light";
    setIsLight(light);
    applyTheme(light);
  }, []);

  return (
    <div className="flex flex-col h-screen px-5 py-6">
      {/* Brand */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(47,107,255,0.18)] border border-[rgba(47,107,255,0.35)] flex items-center justify-center">
            <span className="text-[18px] font-bold text-[var(--mm-blue)]">⟠</span>
          </div>
          <div>
            <p className="text-lg font-semibold leading-none">Mentor Mind</p>
            <p className="text-xs mm-muted mt-1">AI-Powered Progress</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="space-y-2">
        {menu.map((m) => {
          const Icon = m.icon;
          const active = activeTab === m.key;

          return (
            <button
              key={m.key}
              onClick={() => setActiveTab(m.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left
                ${
                  active
                    ? "bg-[rgba(47,107,255,0.18)] border border-[rgba(47,107,255,0.35)]"
                    : "hover:bg-[rgba(255,255,255,0.04)] border border-transparent"
                }
              `}
            >
              <Icon
                size={18}
                className={
                  active ? "text-[var(--mm-blue)]" : "text-[rgba(234,240,255,0.65)]"
                }
              />
              <span
                className={
                  active ? "text-white font-semibold" : "text-[rgba(234,240,255,0.75)]"
                }
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="mt-auto pt-6 border-t border-[var(--mm-border)]">
        {/* ✅ Light/Dark toggle WORKING */}
        <button
          onClick={() => {
            const next = !isLight;
            setIsLight(next);
            applyTheme(next);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition"
        >
          {isLight ? (
            <Moon size={18} className="text-[rgba(234,240,255,0.65)]" />
          ) : (
            <Sun size={18} className="text-[rgba(234,240,255,0.65)]" />
          )}
          <span className="text-[rgba(234,240,255,0.75)]">
            {isLight ? "Dark Mode" : "Light Mode"}
          </span>
        </button>

        {/* ✅ Sign out WORKING */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition"
        >
          <LogOut size={18} className="text-[rgba(234,240,255,0.65)]" />
          <span className="text-[rgba(234,240,255,0.75)]">Sign Out</span>
        </button>

        <div className="mt-4 mm-card-deep px-4 py-3 flex items-center gap-3">
          <ShieldCheck size={18} className="text-[#22C55E]" />
          <div>
            <p className="text-sm font-semibold">Secure & Encrypted</p>
            <p className="text-xs mm-muted">Your data is protected</p>
          </div>
        </div>
      </div>
    </div>
  );
}