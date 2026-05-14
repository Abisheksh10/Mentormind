import React, { useMemo } from "react";
import PageHeader from "../layout/PageHeader";
import {
  BookOpen,
  Target,
  TrendingUp,
  Brain,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useStudentProfile } from "../../hooks/useStudentProfile";

export default function DashboardOverview({ setActiveTab }) {
  const { profile, loading } = useStudentProfile();

  // ✅ Robust studentId check (supports different DB keys)
  const studentId =
    profile?.studentId || profile?.studentID || profile?.rollNo || "";

  // ✅ show banner ONLY if important fields are missing
  const needsCompletion = useMemo(() => {
    const hasStudentId = String(studentId).trim().length > 0;
    const hasName = String(profile?.studentName || "").trim().length > 0;
    const hasSkills = (profile?.skills || []).length > 0;
    const hasGpa = Number(profile?.gpa) > 0;

    // show warning only when multiple key things missing
    return !(hasStudentId && hasName && hasSkills && hasGpa);
  }, [studentId, profile]);

  const stats = useMemo(() => {
    const gpaNum = Number(profile?.gpa);
    const gpa = Number.isFinite(gpaNum) ? gpaNum : 0;

    const skillsCount = (profile?.skills || []).length;

    const creditsNum = Number(profile?.creditsEarned);
    const creditsEarned = Number.isFinite(creditsNum) ? creditsNum : 0;

    const degreeProgress = Math.min(100, Math.round((creditsEarned / 160) * 100));

    const twinStatus = skillsCount > 0 ? "Active" : "Building";

    return { gpa, skillsCount, degreeProgress, twinStatus, creditsEarned };
  }, [profile]);

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WARNING BANNER */}
      {needsCompletion && (
        <div className="mm-card-deep px-6 py-4 border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.06)]">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <AlertTriangle className="text-[#FBBF24]" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#FDE68A]">Your Profile is Incomplete</p>
              <p className="text-sm mm-muted mt-1">
                To get accurate career simulations and recommendations, please complete your
                profile details.
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="mm-pill text-[#FDE68A] border-[rgba(251,191,36,0.25)]">
                  Profile Completion Needed
                </span>

                <button
                  onClick={() => setActiveTab("profile")}
                  className="text-sm text-[#FDE68A] underline underline-offset-4 hover:opacity-90"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO HEADER */}
      <div className="mm-card px-8 py-7 bg-[linear-gradient(90deg,rgba(47,107,255,0.55),rgba(109,75,255,0.55))] border border-[rgba(255,255,255,0.08)]">
        <h2 className="text-[34px] font-bold tracking-tight">
          Welcome back, {profile?.studentName || "student"}!
        </h2>
        <p className="mt-2 text-[15px] text-[rgba(234,240,255,0.85)]">
          Here's your personalized academic and career insights
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="GPA"
          value={stats.gpa ? stats.gpa.toFixed(2) : "—"}
          subtitle="Out of 10.0"
          icon={<BookOpen size={18} className="text-[rgba(234,240,255,0.7)]" />}
        />

        <StatCard
          title="Skills Tracked"
          value={stats.skillsCount || "—"}
          subtitle={stats.skillsCount === 0 ? "Start adding skills" : "Skills in your inventory"}
          icon={<Target size={18} className="text-[rgba(47,107,255,0.9)]" />}
        />

        <StatCard
          title="Degree Progress"
          value={`${stats.degreeProgress}%`}
          subtitle={`${Math.max(0, 160 - stats.creditsEarned)} credits remaining`}
          icon={<TrendingUp size={18} className="text-[rgba(34,197,94,0.9)]" />}
        />

        <StatCard
          title="Digital Twin Status"
          value={stats.twinStatus}
          subtitle={stats.skillsCount === 0 ? "Add data to activate" : "Simulation ready"}
          icon={<Brain size={18} className="text-[rgba(167,139,250,0.95)]" />}
        />
      </div>

      {/* GET STARTED */}
      <div className="mm-card px-6 py-6">
        <h3 className="text-lg font-semibold">Get Started</h3>

        <div className="mt-5 space-y-4">
          <GetStartedItem
            step={1}
            title="Complete Your Profile"
            subtitle="Add your student information, major, and year to get started"
            onClick={() => setActiveTab("profile")}
          />

          <GetStartedItem
            step={2}
            title="Add Academic Records"
            subtitle="Upload your courses and grades to track your progress"
            onClick={() => setActiveTab("academic")}
          />

          <GetStartedItem
            step={3}
            title="Explore Career Paths"
            subtitle="Discover recommended career paths based on your skills"
            onClick={() => setActiveTab("careers")}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="mm-card px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mm-muted">{title}</p>
          <p className="text-[34px] font-bold mt-2">{value}</p>
          <p className="text-sm mm-muted mt-2">{subtitle}</p>
        </div>

        <div className="w-9 h-9 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function GetStartedItem({ step, title, subtitle, onClick }) {
  return (
    <div className="mm-card-deep px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-[rgba(47,107,255,0.18)] border border-[rgba(47,107,255,0.35)] flex items-center justify-center">
          <span className="font-bold text-[var(--mm-blue)]">{step}</span>
        </div>

        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm mm-muted mt-1">{subtitle}</p>
        </div>
      </div>

      <button onClick={onClick} className="mm-btn">
        <span className="text-sm">Open</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
