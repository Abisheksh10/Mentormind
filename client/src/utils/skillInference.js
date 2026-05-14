function norm(s) {
  return String(s || "").trim().toLowerCase();
}

/**
 * ✅ Skill inference rules:
 * If trigger skill exists → ensure implied skills exist with baseline proficiency
 */
const INFER_RULES = [
  { trigger: "react", implies: ["html", "javascript"], base: 60 },
  { trigger: "tailwind", implies: ["css"], base: 65 },
  { trigger: "node.js", implies: ["javascript"], base: 65 },
  { trigger: "express", implies: ["node.js", "javascript"], base: 60 },
  { trigger: "django", implies: ["python"], base: 65 },
  { trigger: "fastapi", implies: ["python"], base: 65 },
  { trigger: "docker", implies: ["linux"], base: 55 },
  { trigger: "aws", implies: ["cloud computing"], base: 55 },
  { trigger: "machine learning", implies: ["python", "statistics"], base: 55 },
  { trigger: "deep learning", implies: ["python", "machine learning"], base: 55 },
];

/**
 * ✅ Adds or boosts foundational skills automatically.
 * - adds missing implied skills
 * - boosts implied skills if they are too low
 */
export function applySkillInference(skills = []) {
  const map = new Map();

  // load existing skills
  for (const s of skills) {
    map.set(norm(s.name), { ...s, inferred: s.inferred || false });
  }

  // apply inference rules
  for (const rule of INFER_RULES) {
    if (!map.has(norm(rule.trigger))) continue;

    for (const implied of rule.implies) {
      const key = norm(implied);

      if (!map.has(key)) {
        map.set(key, {
          name: implied,
          category: "technical",
          proficiency: rule.base,
          inferred: true,
        });
      } else {
        const cur = map.get(key);
        const curProf = cur.proficiency || 0;

        if (curProf < rule.base) {
          map.set(key, {
            ...cur,
            proficiency: rule.base,
            inferred: true,
          });
        }
      }
    }
  }

  return Array.from(map.values());
}
