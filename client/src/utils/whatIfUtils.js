function norm(x) {
  return String(x || "").trim().toLowerCase();
}

function clamp100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Apply extracted skills as TEMP boosts (no save).
 * - mode="boost": temporary increase
 * - mode="max": keep higher of existing/incoming
 */
export function applyWhatIfSkills(existingSkills = [], extractedSkills = [], opts = {}) {
  const mode = opts?.mode || "boost";
  const newSkillBaseline = Number(opts?.newSkillBaseline ?? 50);

  const map = new Map();

  for (const s of existingSkills || []) {
    map.set(norm(s.name), { ...s, proficiency: clamp100(s.proficiency) });
  }

  for (const s of extractedSkills || []) {
    const key = norm(s.name);
    if (!key) continue;

    const incoming = clamp100(s.proficiency);
    const signals = s.signals || {};

    if (!map.has(key)) {
      const delta = estimateDelta(signals, s);

      const boosted =
        mode === "boost"
          ? clamp100(Math.max(incoming, newSkillBaseline + delta))
          : incoming;

      map.set(key, {
        name: s.name,
        proficiency: boosted,
        category: s.category || "technical",
      });
      continue;
    }

    const old = map.get(key);

    if (mode === "max") {
      map.set(key, {
        ...old,
        proficiency: Math.max(clamp100(old.proficiency), incoming),
      });
    } else {
      const delta = estimateDelta(signals, s);
      const boosted = clamp100(Math.max(
        clamp100(old.proficiency),
        incoming,
        clamp100((old.proficiency || 0) + delta)
      ));

      map.set(key, {
        ...old,
        proficiency: boosted,
      });
    }
  }

  return Array.from(map.values());
}

function estimateDelta(signals = {}, rawSkill = {}) {
  const mentions = Number(signals.mentions || 0);
  const projects = Number(signals.projects || 0);
  const certs = Number(signals.certs || 0);
  const internships = Number(signals.internships || 0);
  const years = Number(signals.years || 0);

  let delta =
    Math.min(10, mentions) * 0.8 +
    projects * 6 +
    certs * 4 +
    internships * 7 +
    years * 5;

  // extra signal for scenario concept mapping
  if (rawSkill?.source === "scenario_concept") delta += 6;
  if (rawSkill?.kind === "learning_plan") delta += 4;

  // fallback if Gemini found it but no structured evidence
  if (delta <= 0) {
    const conf = Number(rawSkill?.confidence ?? 0.7);
    delta = 8 * Math.max(0.5, Math.min(1.0, conf));
  }

  delta = Math.round(Math.max(4, Math.min(25, delta)));
  return delta;
}