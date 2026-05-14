import React, { useMemo } from "react";
import PageHeader from "../layout/PageHeader";
import { Award, Brain, Target, TrendingUp } from "lucide-react";
import { CAREER_PATHS } from "../../data/constants";
import { useStudentProfile } from "../../hooks/useStudentProfile";
import RadarSkillsChart from "../common/RadarSkillsChart";


export default function DigitalTwin() {
  const { profile, loading } = useStudentProfile();

  const gpa = profile?.gpa ?? 0;
  const credits = profile?.creditsEarned ?? 0;
  const certifications = (profile?.certifications || []).length;
  const skills = profile?.skills || [];
  const semesters = profile?.semesterStats || [];

  const degreeProgress = Math.min(100, Math.round((credits / 160) * 100));
  const avgProficiency = skills.length
    ? Math.round(skills.reduce((a, s) => a + (s.proficiency || 0), 0) / skills.length)
    : 0;

  const targetCareer = useMemo(() => {
    return CAREER_PATHS.find((c) => c.id === profile?.targetCareerId) || CAREER_PATHS[0];
  }, [profile?.targetCareerId]);

  // ✅ Dynamic axes for Radar (Top 4 skills of target career)
  const radarAxes = useMemo(() => {
    const req = targetCareer?.requiredSkills || [];

    const normalized = req
      .map((r) => ({
        name: r.skill || r.name || "",
        required: Number(r.requiredProficiency || r.proficiency || 0),
        importance: Number(r.importance || r.weight || 1),
      }))
      .filter((x) => x.name);

    // Sort by importance + required
    normalized.sort((a, b) => b.importance * b.required - a.importance * a.required);

    // Top 4 axes
    const top4 = normalized.slice(0, 4);

    // fallback if career has no requiredSkills
    if (!top4.length) {
      const userTop = [...skills]
        .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
        .slice(0, 4)
        .map((s) => ({
          name: s.name,
          required: 70,
          importance: 1,
        }));

      return userTop.length ? userTop : [
        { name: "Skill-1", required: 70, importance: 1 },
        { name: "Skill-2", required: 70, importance: 1 },
        { name: "Skill-3", required: 70, importance: 1 },
        { name: "Skill-4", required: 70, importance: 1 },
      ];
    }

    return top4;
  }, [targetCareer, skills]);

  const radarValues = useMemo(() => {
    const map = new Map((skills || []).map((s) => [String(s.name).toLowerCase(), Number(s.proficiency || 0)]));

    const myVals = radarAxes.map((a) => {
      const cur = map.get(String(a.name).toLowerCase()) || 0;
      return clamp(cur, 0, 100);
    });

    const targetVals = radarAxes.map((a) => clamp(a.required, 0, 100));

    return { myVals, targetVals };
  }, [radarAxes, skills]);

  // ✅ GPA progression chart from semesters
  const gpaTrend = useMemo(() => {
    const list = (semesters || []).map((s) => ({
      term: s.term || "",
      gpa: Number(s.gpa || 0),
    }));

    // sort by term created order if needed (already pushed in order)
    return list.slice(0, 8);
  }, [semesters]);

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading Digital Twin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Twin"
        subtitle="AI-powered visualization of your academic journey and career trajectory"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="GPA Score"
          value={Number(gpa).toFixed(2)}
          subtitle=""
          icon={<TrendingUp size={18} className="text-[rgba(234,240,255,0.7)]" />}
        />

        <StatCard
          title="Degree Progress"
          value={`${degreeProgress}%`}
          subtitle=""
          icon={<Brain size={18} className="text-[rgba(234,240,255,0.7)]" />}
        />

        <StatCard
          title="Skills Mastered"
          value={skills.length}
          subtitle={`Avg: ${avgProficiency}% proficiency`}
          icon={<Target size={18} className="text-[rgba(234,240,255,0.7)]" />}
        />

        <StatCard
          title="Certifications"
          value={certifications}
          subtitle="Active credentials"
          icon={<Award size={18} className="text-[rgba(234,240,255,0.7)]" />}
        />
      </div>

      {/* Bottom 2 Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* GPA Progression */}
        <div className="mm-card px-6 py-6">
          <p className="text-lg font-semibold">GPA Progression</p>

          <div className="mt-5 mm-card-deep px-5 py-5">
            <GpaChart data={gpaTrend} />
          </div>
        </div>

        {/* Skills Profile Radar */}
        <div className="mm-card px-6 py-6">
          <p className="text-lg font-semibold">Skills Profile</p>
          <p className="mt-3 text-xl font-semibold">
            Digital Twin vs. {targetCareer?.title || "Target Career"}
          </p>

          <div className="mt-5 mm-card-deep px-5 py-5">
            <div className="h-[300px] w-full rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)]">
  <RadarSkillsChart
    data={radarAxes.map((a, idx) => ({
      skill: a.name,
      my: radarValues.myVals[idx],
      target: radarValues.targetVals[idx],
    }))}
  />
</div>


            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[var(--mm-blue)] rounded-sm" />
                <span className="mm-muted">My Skills</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[rgba(234,240,255,0.35)] rounded-sm" />
                <span className="mm-muted">Target</span>
              </div>
            </div>

            <p className="mt-4 text-xs mm-muted text-center">
              Radar axes are based on your selected career’s top required skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="mm-card px-6 py-5 relative overflow-hidden">
      <div className="absolute right-4 top-4 opacity-[0.08]">
        <div className="w-12 h-12">{icon}</div>
      </div>

      <p className="text-sm mm-muted">{title}</p>
      <p className="text-[34px] font-bold mt-2">{value}</p>
      {subtitle ? <p className="text-sm mm-muted mt-2">{subtitle}</p> : null}
    </div>
  );
}

/* -----------------------
    GPA CHART
------------------------ */
function GpaChart({ data = [] }) {
  return (
    <div className="h-[300px] w-full rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] relative overflow-hidden">
      {/* grid lines */}
      <div className="absolute inset-0">
        <div className="h-full w-full grid grid-rows-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-b border-dashed border-[rgba(255,255,255,0.06)]"
            />
          ))}
        </div>
        <div className="absolute inset-0 grid grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-r border-dashed border-[rgba(255,255,255,0.06)]"
            />
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className="absolute left-4 top-4 text-xs mm-muted">10</div>
      <div className="absolute left-4 top-[42%] text-xs mm-muted">6</div>
      <div className="absolute left-4 bottom-10 text-xs mm-muted">0</div>

      {/* Line chart */}
      {data.length < 2 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm mm-muted">
          Add semesters in Academic Progress to see GPA trend.
        </div>
      ) : (
        <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Line */}
          <polyline
            fill="none"
            stroke="rgba(47,107,255,0.95)"
            strokeWidth="2"
            points={buildLinePoints(data)}
          />
          {/* Dots */}
          {data.map((p, idx) => {
            const { x, y } = pointXY(idx, data.length, p.gpa);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="1.8"
                fill="rgba(47,107,255,0.95)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

function buildLinePoints(data) {
  return data
    .map((p, idx) => {
      const { x, y } = pointXY(idx, data.length, p.gpa);
      return `${x},${y}`;
    })
    .join(" ");
}

function pointXY(i, n, gpa) {
  const paddingX = 10;
  const paddingY = 12;

  const x = paddingX + (i * (100 - paddingX * 2)) / (n - 1);

  // map 0..10 to y 88..12 (invert)
  const g = clamp(gpa, 0, 10);
  const y = 100 - paddingY - (g * (100 - paddingY * 2)) / 10;

  return { x, y };
}

/* -----------------------
    RADAR CHART (4 axes)
------------------------ */
function RadarChart({ labels = [], myVals = [], targetVals = [] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 90;

  const axes = 4;
  const safeLabels = (labels || []).slice(0, 4);
  while (safeLabels.length < 4) safeLabels.push(`Skill-${safeLabels.length + 1}`);

  const my = normalize4(myVals);
  const target = normalize4(targetVals);

  const myPts = radarPoints(my, cx, cy, maxR);
  const tarPts = radarPoints(target, cx, cy, maxR);

  return (
    <div className="relative w-[260px] h-[260px]">
      {/* grid diamonds */}
      <div className="absolute inset-0 rotate-45 border border-[rgba(255,255,255,0.18)]" />
      <div className="absolute inset-[20px] rotate-45 border border-[rgba(255,255,255,0.14)]" />
      <div className="absolute inset-[40px] rotate-45 border border-[rgba(255,255,255,0.10)]" />
      <div className="absolute inset-[60px] rotate-45 border border-[rgba(255,255,255,0.08)]" />

      {/* axis lines */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[rgba(255,255,255,0.10)] -translate-x-1/2" />
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[rgba(255,255,255,0.10)] -translate-y-1/2" />

      {/* labels dynamic */}
      <p className="absolute top-0 left-1/2 -translate-x-1/2 text-xs mm-muted text-center w-[140px]">
        {safeLabels[0]}
      </p>
      <p className="absolute right-0 top-1/2 -translate-y-1/2 text-xs mm-muted text-right w-[120px]">
        {safeLabels[1]}
      </p>
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs mm-muted text-center w-[140px]">
        {safeLabels[2]}
      </p>
      <p className="absolute left-0 top-1/2 -translate-y-1/2 text-xs mm-muted text-left w-[120px]">
        {safeLabels[3]}
      </p>

      <svg className="absolute inset-0" viewBox={`0 0 ${size} ${size}`} fill="none">
        {/* Target polygon */}
        <polygon
          points={tarPts}
          stroke="rgba(234,240,255,0.35)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* My polygon */}
        <polygon
          points={myPts}
          stroke="rgba(47,107,255,0.9)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function radarPoints(vals, cx, cy, R) {
  // vals: [top,right,bottom,left] 0..100
  const t = (R * (vals[0] / 100));
  const r = (R * (vals[1] / 100));
  const b = (R * (vals[2] / 100));
  const l = (R * (vals[3] / 100));

  const pts = [
    `${cx},${cy - t}`,     // top
    `${cx + r},${cy}`,     // right
    `${cx},${cy + b}`,     // bottom
    `${cx - l},${cy}`,     // left
  ];
  return pts.join(" ");
}

function normalize4(arr) {
  const x = (arr || []).slice(0, 4).map((v) => clamp(Number(v || 0), 0, 100));
  while (x.length < 4) x.push(0);
  return x;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
