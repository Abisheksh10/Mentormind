import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RadarSkillsChart({ data = [] }) {
  // data format:
  // [{ skill: "Python", my: 65, target: 80 }, ...]

  if (!data.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm mm-muted">
        No skill data yet.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          {/* Grid */}
          <PolarGrid stroke="rgba(255,255,255,0.08)" />

          {/* Axis labels */}
          <PolarAngleAxis
            dataKey="skill"
            tick={{
              fill: "rgba(234,240,255,0.7)",
              fontSize: 12,
              fontWeight: 600,
            }}
          />

          {/* Scale */}
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          {/* Target polygon */}
          <Radar
            name="Target"
            dataKey="target"
            stroke="rgba(234,240,255,0.55)"
            fill="rgba(234,240,255,0.10)"
            strokeDasharray="6 4"
            strokeWidth={2}
          />

          {/* My Skills polygon */}
          <Radar
            name="My Skills"
            dataKey="my"
            stroke="rgba(47,107,255,0.95)"
            fill="rgba(47,107,255,0.20)"
            strokeWidth={2.5}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "white",
              fontSize: "12px",
            }}
            labelStyle={{
              color: "rgba(234,240,255,0.85)",
              fontWeight: 600,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
