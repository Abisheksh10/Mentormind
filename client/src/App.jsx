import React, { useEffect, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";

import Dashboard from "./components/dashboard/DashboardOverview";
import AcademicProgress from "./components/academic/AcademicProgress";
import DigitalTwin from "./components/digitalTwin/DigitalTwin";
import SkillAnalysis from "./components/skills/SkillAnalysis";
import CareerPaths from "./components/careers/CareerPaths";
import Profile from "./components/profile/Profile";

import { AuthProvider, useAuth } from "./context/AuthContext";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";

function getInitialTab() {
  // 1) hash (preferred): #skills
  const hash = String(window.location.hash || "").replace("#", "").trim();
  if (hash) return hash;

  // 2) localStorage
  const saved = localStorage.getItem("mm_activeTab");
  if (saved) return saved;

  // 3) default
  return "dashboard";
}

function MentorMindInner() {
  const { user, bootChecked, bootLoading, logout } = useAuth();

  const [authMode, setAuthMode] = useState("signin");
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // ✅ Persist active tab + restore on refresh
  useEffect(() => {
    if (!activeTab) return;
    localStorage.setItem("mm_activeTab", activeTab);
    window.location.hash = activeTab;
  }, [activeTab]);

  // ✅ Boot loader
  if (!bootChecked || bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mm-card px-6 py-5">Loading...</div>
      </div>
    );
  }

  // ✅ NOT logged in => show sign-in/sign-up ONLY
  if (!user) {
    return authMode === "signin" ? (
      <SignIn onSwitchToSignUp={() => setAuthMode("signup")} />
    ) : (
      <SignUp onSwitchToSignIn={() => setAuthMode("signin")} />
    );
  }

  // ✅ Logged in => show full MentorMind app
  const renderPage = () => {
    switch (activeTab) {
      case "academic":
        return <AcademicProgress />;
      case "digitalTwin":
        return <DigitalTwin />;
      case "skills":
        return <SkillAnalysis />;
      case "careers":
        return <CareerPaths />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={() => {
            logout();
            setAuthMode("signin");
            setActiveTab("dashboard");
            localStorage.removeItem("mm_activeTab");
            window.location.hash = "";
          }}
        />
      }
    >
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MentorMindInner />
    </AuthProvider>
  );
}