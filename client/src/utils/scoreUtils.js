// client/src/utils/scoreUtils.js

const SKILL_ALIASES = {
  "mongo": "mongodb",
  "mongo db": "mongodb",
  "mongodb database": "mongodb",

  "my sql": "mysql",
  "mysql database": "mysql",

  "postgre": "postgresql",
  "postgres": "postgresql",
  "postgre sql": "postgresql",
  "postgresql database": "postgresql",

  "js": "javascript",
  "java script": "javascript",

  "ts": "typescript",
  "type script": "typescript",
};

function norm(name = "") {
  const key = String(name || "").trim().toLowerCase();
  return SKILL_ALIASES[key] || key;
}

function getReqName(r) {
  return r?.name ?? r?.skill ?? "";
}

function getReqNeed(r) {
  const a = Number(r?.proficiency);
  if (!Number.isNaN(a) && a > 0) return a;

  const b = Number(r?.requiredProficiency);
  if (!Number.isNaN(b) && b > 0) return b;

  return 0;
}

function getReqOptions(r) {
  return Array.isArray(r?.options) ? r.options : Array.isArray(r?.opts) ? r.opts : null;
}

export function computeMissingSkills(studentSkills = [], requiredSkills = []) {
  const map = new Map();

  for (const s of studentSkills) {
    map.set(norm(s.name), Number(s.proficiency || 0));
  }

  const getCurrent = (nm) => map.get(norm(nm)) || 0;

  const missing = [];

  for (const r of requiredSkills) {
    const opts = getReqOptions(r);

    // ✅ anyOf group
    if (r?.type === "anyOf" && Array.isArray(opts)) {
      const need = getReqNeed(r);

      let bestOpt = null;
      let bestCur = 0;

      for (const opt of opts) {
        const cur = getCurrent(opt);
        if (cur > bestCur) {
          bestCur = cur;
          bestOpt = opt;
        }
      }

      const gap = Math.max(0, need - bestCur);

      if (gap > 0) {
        missing.push({
          name: r.label || "One of",
          required: need,
          current: bestCur,
          gap,
          category: r.category || "technical",
          groupType: "anyOf",
          options: opts,
          chosenOption: bestOpt,
        });
      }

      continue;
    }

    // ✅ normal skill
    const reqName = getReqName(r);
    const need = getReqNeed(r);
    const current = getCurrent(reqName);

    const gap = Math.max(0, need - current);

    if (gap > 0) {
      missing.push({
        name: reqName,
        required: need,
        current,
        gap,
        category: r.category || "technical",
      });
    }
  }

  missing.sort((a, b) => b.gap - a.gap);
  return missing;
}