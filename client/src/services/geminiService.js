import { GoogleGenAI } from "@google/genai";

/**
 * ✅ IMPORTANT:
 * Make sure you have this in your .env file:
 *
 * VITE_GEMINI_API_KEY=YOUR_KEY_HERE
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ VITE_GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

/* ---------------------------------------
   Helpers
---------------------------------------- */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function levelToScore(level) {
  const lv = String(level || "").toLowerCase();

  if (lv.includes("expert")) return 95;
  if (lv.includes("advanced")) return 80;
  if (lv.includes("intermediate")) return 60;
  if (lv.includes("beginner")) return 35;

  // If Gemini returns unknown → default
  return 60;
}

function normalizeSkill(skill) {
  const name = (skill?.name || "").trim();
  if (!name) return null;

  let proficiency = 60;

  // If Gemini returns numeric, use it safely
  if (typeof skill.proficiency === "number") {
    proficiency = clamp(skill.proficiency, 0, 100);
  } else if (skill?.level) {
    proficiency = levelToScore(skill.level);
  }

  const category = (skill?.category || "technical").toLowerCase();

  return {
    name,
    proficiency,
    category,
  };
}

async function fileToBase64(file) {
  const arrBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrBuffer);

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Convert to base64
  return btoa(binary);
}

/**
 * Extract JSON safely from Gemini response
 */
function extractJSON(text) {
  if (!text) return null;

  // Try to find JSON block inside response
  const firstBrace = text.indexOf("[");
  const lastBrace = text.lastIndexOf("]");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("JSON parse error:", err);
    }
  }

  return null;
}

/* ---------------------------------------
   ✅ Skill Extraction (Text OR File)
---------------------------------------- */
export async function analyzeSkillsFromInput(input) {
  try {
    // ✅ TEXT
    if (typeof input === "string") {
      const r = await fetch("http://localhost:5000/api/skills/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await r.json();
      return data.skills || [];
    }

    // ✅ FILE
    if (input instanceof File) {
      const fd = new FormData();
      fd.append("file", input);

      const r = await fetch("http://localhost:5000/api/skills/extract-file", {
        method: "POST",
        body: fd,
      });

      const data = await r.json();
      return data.skills || [];
    }

    return [];
  } catch (err) {
    console.error("❌ Local skill extraction failed, fallback could be Gemini:", err);
    return [];
  }
}


/* ---------------------------------------
   ✅ Course Recommendations
---------------------------------------- */

export async function getCourseRecommendationsForCareer({ careerTitle, missingSkills }) {
  if (!missingSkills || missingSkills.length === 0) return [];

  const prompt = `
You are an expert career mentor.

Target Career: ${careerTitle}

Missing Skills (with gaps):
${missingSkills
  .slice(0, 8)
  .map((s) => `- ${s.name} (Gap: ${s.gap}%, Required: ${s.required}%, Current: ${s.current}%)`)
  .join("\n")}

TASK:
Return ONLY valid JSON array of course recommendations.

JSON format must be:
[
  {
    "skill": "TypeScript",
    "priority": "High",
    "why": "Needed for scalable frontend systems",
    "courses": [
      {
        "title": "TypeScript for Beginners",
        "platform": "Udemy",
        "level": "Beginner",
        "duration": "6 hours",
        "link": "https://..."
      }
    ]
  }
]

Rules:
- 1 entry per missing skill.
- Each skill must have 2–3 course suggestions.
- Use popular trusted platforms: Coursera, Udemy, freeCodeCamp, YouTube, Google, AWS, Microsoft Learn.
- Provide REALISTIC course titles.
- Keep response compact.
`;

  // ✅ Use your existing Gemini call logic below
  // Example: if you already use model.generateContent, reuse it here.
  const data = await safeGeminiJson(prompt);
  return Array.isArray(data) ? data : [];
}

/* ------------------------------
   Helper: Force JSON Response
-------------------------------- */
async function safeGeminiJson(prompt) {
  // ⚠️ Replace this with YOUR existing Gemini call logic
  // you already use analyzeSkillsFromInput() so follow same style

  const res = await generateGeminiText(prompt);

  // ✅ Extract JSON safely
  const jsonText = res
    .trim()
    .replace(/```json/g, "")
    .replace(/```/g, "");

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("❌ Gemini returned invalid JSON:", res);
    return [];
  }
}

/* ------------------------------
   Example: Gemini text generator
   (LINK THIS TO YOUR OWN)
-------------------------------- */
async function generateGeminiText(prompt) {
  throw new Error("generateGeminiText() not connected. Link to your Gemini model call.");
}




/* ---------------------------------------
   ✅ Career Simulation (What-if)
---------------------------------------- */

export async function runCareerSimulation({ careerTitle, profile, whatIfText }) {
  const model = "gemini-2.5-flash";

  const prompt = `
You are a career simulation assistant.

Target career: ${careerTitle}

Student profile (summary):
- Name: ${profile?.studentName || "N/A"}
- Major: ${profile?.major || "N/A"}
- Academic year: ${profile?.academicYear || "N/A"}
- GPA: ${profile?.gpa || 0}
- Skills: ${(profile?.skills || []).map(s => `${s.name}(${s.proficiency}%)`).join(", ")}

Scenario (What-if):
${whatIfText || "No scenario provided"}

Return ONLY valid JSON in this format:
{
  "matchScore": 0-100,
  "analysis": "short paragraph",
  "actionPlan": ["step1","step2","step3","step4"]
}
No markdown. No extra text.
`;

  try {
    const res = await genAI.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = res?.response?.text?.() || "";
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonText = rawText.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonText);
    }

    return {
      matchScore: 0,
      analysis: "Could not generate simulation output.",
      actionPlan: [],
    };
  } catch (err) {
    console.error("❌ runCareerSimulation error:", err);
    return {
      matchScore: 0,
      analysis: "Simulation failed. Try again.",
      actionPlan: [],
    };
  }
}

/* ---------------------------------------
   ✅ Find Relevant Jobs (AI Based)
---------------------------------------- */
export async function findRelevantJobs({ careerTitle, skills = [] }) {
  const model = "gemini-2.5-flash";

  const prompt = `
You are a job recommendation assistant.

Generate job listings for:
Career Role: ${careerTitle}
Location Focus: India
Candidate Skills: ${skills.map((s) => s.name).join(", ")}

✅ Return ONLY valid JSON object in this format:

{
  "summaryText": "One short paragraph summary",
  "jobs": [
    {
      "company": "Company Name",
      "role": "Role Name",
      "keyRequirement": "One key requirement"
    }
  ],
  "directLinks": [
    {
      "domain": "indeed.com",
      "url": "https://vertexaisearch.cloud.google.com/...",
      "label": "View Posting"
    }
  ]
}

Rules:
- jobs must have 5 items.
- directLinks must have 3 items.
- No markdown. No extra explanation.
`;

  try {
    const res = await genAI.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = res?.response?.text?.() || "";

    // Try JSON object parse
    const first = rawText.indexOf("{");
    const last = rawText.lastIndexOf("}");

    if (first !== -1 && last !== -1 && last > first) {
      const jsonText = rawText.slice(first, last + 1);
      const parsed = JSON.parse(jsonText);

      return {
        summaryText: parsed.summaryText || "",
        jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
        directLinks: Array.isArray(parsed.directLinks) ? parsed.directLinks : [],
        rawText,
      };
    }

    // ✅ fallback: return raw text if JSON not found
    return {
      summaryText: rawText || "No jobs found.",
      jobs: [],
      directLinks: [],
      rawText,
    };
  } catch (err) {
    console.error("❌ findRelevantJobs error:", err);
    return {
      summaryText: "Job fetch failed. Please try again.",
      jobs: [],
      directLinks: [],
      rawText: "",
    };
  }
}
