import { SKILL_GRAPH, SKILL_ALIASES } from "./skillGraph";

// normalize skill name
function norm(name = "") {
  const key = name.trim().toLowerCase();
  return SKILL_ALIASES[key] || key;
}

function getDirectSkillProficiency(skills, name) {
  const key = norm(name);
  const found = skills.find((s) => norm(s.name) === key);
  return found?.proficiency ?? 0;
}

// compute effective proficiency using inference (React -> HTML/CSS/JS baseline)
function getEffectiveProficiency(skills, name) {
  const target = norm(name);

  // direct score
  let best = getDirectSkillProficiency(skills, target);

  // implied score from other skills
  for (const s of skills) {
    const sKey = norm(s.name);
    const graph = SKILL_GRAPH[sKey];

    if (!graph?.implies?.length) continue;

    for (const implied of graph.implies) {
      if (norm(implied.name) === target) {
        const parentProf = s.proficiency ?? 0;
        const impliedProf = Math.min(parentProf, implied.min);
        best = Math.max(best, impliedProf);
      }
    }
  }

  return best;
}

/**
 * ✅ Career match score
 * - Weighted by required proficiency
 * - Supports "anyOf" groups: one among options is enough
 */
export function computeCareerMatchScore(skills = [], requiredSkills = []) {
  if (!requiredSkills?.length) return 0;

  let total = 0;
  let gained = 0;

  for (const req of requiredSkills) {
    // ✅ anyOf group
    if (req && req.type === "anyOf" && Array.isArray(req.options)) {
      const need = req.proficiency ?? 60;

      // best proficiency among options
      let best = 0;
      for (const opt of req.options) {
        best = Math.max(best, getEffectiveProficiency(skills, opt));
      }

      total += need;
      gained += Math.min(best, need);
      continue;
    }

    // ✅ normal skill
    const need = req.proficiency ?? 60;
    const cur = getEffectiveProficiency(skills, req.name);

    total += need;
    gained += Math.min(cur, need);
  }

  const score = Math.round((gained / total) * 100);
  return Math.max(0, Math.min(100, score));
}