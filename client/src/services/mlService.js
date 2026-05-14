import { apiFetch } from "./apiClient";

function normalizeCareerPaths(careerPaths = []) {
  // Convert existing CAREER_PATHS requiredSkills into ML-friendly objects.
  // ✅ Now supports:
  //  - {name, proficiency, weight}
  //  - {type:"anyOf", label, options, proficiency, weight}
  return careerPaths.map((c) => ({
    ...c,
    requiredSkills: (c.requiredSkills || []).map((r) => {
      // anyOf group
      if (r && r.type === "anyOf" && Array.isArray(r.options)) {
        return {
          type: "anyOf",
          label: r.label,
          options: r.options,
          requiredProficiency: r.proficiency,
          importance: r.weight || 1.0,
        };
      }

      // normal skill
      return {
        skill: r.name,
        requiredProficiency: r.proficiency,
        importance: r.weight || 1.0,
      };
    }),
  }));
}

export async function careerRank(skills, careerPaths) {
  const career_paths = normalizeCareerPaths(careerPaths);
  return apiFetch("/api/ml/career-rank", {
    method: "POST",
    body: JSON.stringify({ skills, career_paths }),
  });
}

export async function gapPriority(careerId, gaps) {
  return apiFetch("/api/ml/skill-gaps", {
    method: "POST",
    body: JSON.stringify({ careerId, gaps }),
  });
}

// ✅ Added optional gapDetails (4th param) – does not break existing calls
export async function recommendations(careerId, missingSkills, topK = 5, gapDetails = null) {
  const payload = { careerId, missingSkills, topK };
  if (Array.isArray(gapDetails) && gapDetails.length) payload.gapDetails = gapDetails;

  const resp = await apiFetch("/api/ml/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // ✅ normalize any backend response shape into courses/projects
  const courses =
    resp?.courses ||
    resp?.data?.courses ||
    resp?.recommendations?.courses ||
    resp?.recommended_courses ||
    resp?.courseRecommendations ||
    [];

  const projects =
    resp?.projects ||
    resp?.data?.projects ||
    resp?.recommendations?.projects ||
    resp?.recommended_projects ||
    resp?.projectRecommendations ||
    [];

  return { courses, projects, raw: resp };
}

export async function jobs(role, location = "India", skills = []) {
  const skillsParam = Array.isArray(skills)
    ? skills.map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean).join(",")
    : "";

  const qs = new URLSearchParams({
    role: role || "Software Engineer",
    location: location || "India",
  });

  if (skillsParam) qs.set("skills", skillsParam);

  return apiFetch(`/api/jobs?${qs.toString()}`);
}

export async function simulationExplain(payload) {
  return apiFetch("/api/ai/simulation-explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * ✅ Gemini Skill Extraction (Allowlist-based)
 * Uses backend: POST /api/ai/extract-skills
 *
 * @param {string} text
 * @param {string[]} allowedSkills - pass your vocabulary/canonical skills list
 * @param {number} topK
 * @returns {Promise<{skills: Array<{name:string, proficiency:number, confidence:number, evidence:string}>, warnings: string[]}>}
 */
export async function extractSkills(text, allowedSkills = [], topK = 20) {
  return apiFetch("/api/ai/extract-skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text || "",
      allowedSkills: Array.isArray(allowedSkills) ? allowedSkills : [],
      topK: Number(topK || 20),
    }),
  });
}

// export async function extractSkillsAI(text, allowedSkills = [], topK = 25) {
//   const payload = {
//     text,
//     allowedSkills,
//     topK,
//   };

//   return apiFetch("/api/ai/extract-skills", {
//     method: "POST",
//     body: JSON.stringify(payload),
//   });
// }

export async function extractSkillsAI(text, allowedSkills, topK = 25) {
  return apiFetch("/api/ai/extract-skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, allowedSkills, topK }),
  });
}

export async function logCareerFeedback(payload) {
  return apiFetch("/api/ml/career-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


