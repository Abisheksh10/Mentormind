import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../layout/PageHeader";
import Modal from "../common/Modal";

import { CAREER_PATHS, PRIMARY_SKILLS } from "../../data/constants";
import { computeMissingSkills } from "../../utils/scoreUtils";
import { mergeSkills } from "../../utils/skillUtils";
import { applySkillInference } from "../../utils/skillInference";
import {
  recommendations,
  gapPriority,
  extractSkillsAI,
  careerRank,
} from "../../services/mlService";
import { useStudentProfile } from "../../hooks/useStudentProfile";
import { computeCareerMatchScore } from "../../utils/careerUtils";

import {
  Plus,
  Target,
  Activity,
  AlertCircle,
  Sparkles,
  Upload,
  MonitorPlay,
} from "lucide-react";

import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import mammoth from "mammoth";

const allowedSkills = buildAllowedSkillsFromCareers(CAREER_PATHS);

// ✅ PDF + DOCX + TXT parsing helpers
async function readFileAsArrayBuffer(file) {
  return await file.arrayBuffer();
}

async function readFileAsText(file) {
  return await file.text();
}

async function extractTextFromPDF(file) {
  const data = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

async function extractTextFromDOCX(file) {
  const data = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  return result.value || "";
}

async function extractResumeText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) return await extractTextFromPDF(file);
  if (name.endsWith(".docx")) return await extractTextFromDOCX(file);
  if (name.endsWith(".txt")) return await readFileAsText(file);

  throw new Error("Unsupported file type. Upload PDF / DOCX / TXT.");
}

function buildAllowedSkillsFromCareers(careers = []) {
  const out = new Set();

  for (const c of careers) {
    for (const r of c.requiredSkills || []) {
      if (r?.type === "anyOf" && Array.isArray(r.options)) {
        for (const opt of r.options) out.add(opt);
      } else {
        if (r?.name) out.add(r.name);
        if (r?.skill) out.add(r.skill);
      }
    }
  }

  return Array.from(out).filter(Boolean);
}

function gapLevel(current, required) {
  const cur = Number(current || 0);
  const req = Math.max(1, Number(required || 0));
  const ratio = cur / req;

  if (ratio < 0.45) return "Beginner";
  if (ratio < 0.85) return "Moderate";
  return "Advanced";
}

function formatGapSkillName(m) {
  if (m?.groupType === "anyOf" && Array.isArray(m.options)) {
    const chosen = m.chosenOption ? String(m.chosenOption) : null;
    if (chosen) return `${chosen} (${m.name})`;
    return `${m.name} (${m.options.join(" / ")})`;
  }
  return m?.name || "";
}

function extractCareerScoreFromResponse(resp, careerId, fallback = 0) {
  const list = resp?.rankedCareers || resp?.careers || resp?.ranked || resp;
  if (!Array.isArray(list)) return fallback;

  const found = list.find((x) => x?.careerId === careerId || x?.id === careerId);
  if (!found) return fallback;

  return Number(found?.score || fallback);
}

export default function SkillAnalysis() {
  const { profile, saveProfile, loading, saving } = useStudentProfile();

  const [activeTab, setActiveTab] = useState("mySkills");

  // Add Skill Modal
  const [openAddSkill, setOpenAddSkill] = useState(false);
  const [addTab, setAddTab] = useState("text");

  const [aiText, setAiText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [extractMsg, setExtractMsg] = useState("");

  // Recommendations
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [courseRecs, setCourseRecs] = useState([]);
  const [gapPriorityData, setGapPriorityData] = useState(null);
  const [projectRecs, setProjectRecs] = useState([]);
  const [resumeText, setResumeText] = useState("");

  // ✅ Same backend ranking data as CareerPaths
  const [rankedML, setRankedML] = useState(null);

  const skills = profile?.skills || [];

  const targetCareer = useMemo(() => {
    return CAREER_PATHS.find((c) => c.id === profile?.targetCareerId) || CAREER_PATHS[0];
  }, [profile?.targetCareerId]);

  const missingSkills = useMemo(() => {
    return computeMissingSkills(skills, targetCareer?.requiredSkills || []);
  }, [skills, targetCareer]);

  // ✅ Fetch backend career ranking so readiness matches CareerPaths
  useEffect(() => {
    if (!profile) return;

    (async () => {
      try {
        const resp = await careerRank(skills, CAREER_PATHS);
        const list = resp?.rankedCareers || resp?.careers || resp;
        if (Array.isArray(list)) setRankedML(list);
        else setRankedML(null);
      } catch (e) {
        console.error("SkillAnalysis careerRank failed:", e);
        setRankedML(null);
      }
    })();
  }, [profile?.id, JSON.stringify(skills)]);

  // ---- Stats ----
  const totalSkills = skills.length;

  const categoryCount = useMemo(() => {
    const set = new Set((skills || []).map((s) => (s.category || "technical").toLowerCase()));
    return Math.max(1, set.size);
  }, [skills]);

  // ✅ Use same score source as CareerPaths
  const careerReadiness = useMemo(() => {
    const fallback = computeCareerMatchScore(skills, targetCareer?.requiredSkills || []);

    if (!rankedML || !Array.isArray(rankedML)) return fallback;

    return Math.round(extractCareerScoreFromResponse(rankedML, targetCareer?.id, fallback));
  }, [rankedML, skills, targetCareer]);

  const skillsToImprove = useMemo(() => {
    return skills.filter((s) => (s.proficiency || 0) < 60).length;
  }, [skills]);

  // ✅ Modal Open
  const onOpenAddSkill = () => {
    setAddTab("text");
    setAiText("");
    setResumeFile(null);
    setExtractMsg("");
    setOpenAddSkill(true);
  };

  // ✅ Analyze & Add Skills
  const onAnalyzeAndAdd = async () => {
    try {
      setExtractMsg("");
      setLoadingExtract(true);

      let textToAnalyze = "";

      if (addTab === "text") {
        if (!aiText.trim()) {
          setExtractMsg("⚠️ Please paste some text before analyzing.");
          return;
        }
        textToAnalyze = aiText;
      }

      if (addTab === "resume") {
        if (!resumeFile) {
          setExtractMsg("⚠️ Please upload a resume file before analyzing.");
          return;
        }
        if (!resumeText.trim()) {
          setExtractMsg("⚠️ Resume text is empty. Try another PDF or DOCX.");
          return;
        }
        textToAnalyze = resumeText;
      }

      setExtractMsg("⏳ Extracting skills with Gemini...");

      const aiResp = await extractSkillsAI(textToAnalyze, allowedSkills, 30);
      const extracted = Array.isArray(aiResp?.skills) ? aiResp.skills : [];

      const extractedSkills = extracted.map((s) => ({
        name: s.name,
        proficiency: Math.max(0, Math.min(100, Number(s.proficiency || 60))),
        category: "technical",
      }));

      const merged = mergeSkills(skills, extractedSkills, { allowedSkills });
      const finalSkills = applySkillInference(merged);

      await saveProfile({ ...profile, skills: finalSkills });

      const warn = (aiResp?.warnings || []).length ? ` (${aiResp.warnings[0]})` : "";
      setExtractMsg(`✅ Skills updated successfully${warn}`);
      setAiText("");
      setResumeFile(null);

      setActiveTab("mySkills");

      setTimeout(() => {
        setOpenAddSkill(false);
        setExtractMsg("");
      }, 700);
    } catch (err) {
      console.error(err);
      setExtractMsg("❌ Extraction failed. Please try again.");
    } finally {
      setLoadingExtract(false);
    }
  };

  const onGenerateRecommendations = async () => {
    try {
      setLoadingRecs(true);

      const currentSkills = skills || [];
      const freshMissing = computeMissingSkills(currentSkills, targetCareer?.requiredSkills || []);
      const norm = (x) => String(x || "").trim().toLowerCase();

      const skillMap = new Map();
      for (const s of currentSkills) {
        skillMap.set(norm(s.name), Number(s.proficiency || 0));
      }
      const getCur = (nm) => skillMap.get(norm(nm)) || 0;

      const missingNames = [];
      const gapDetails = [];

      const topMissing = freshMissing.length > 0 ? freshMissing.slice(0, 8) : [];

      if (!topMissing.length) {
        missingNames.push("General improvement");
      } else {
        for (const m of topMissing) {
          if (m.groupType === "anyOf" && Array.isArray(m.options)) {
            let bestOpt = null;
            let bestCur = -1;

            for (const opt of m.options) {
              const cur = getCur(opt);
              if (cur > bestCur) {
                bestCur = cur;
                bestOpt = opt;
              }
            }

            const chosen = bestOpt || m.options[0];

            missingNames.push(m.name);
            missingNames.push(chosen);

            gapDetails.push({
              skill: m.name,
              groupType: "anyOf",
              options: m.options,
              chosenOption: chosen,
              required: m.required,
              current: m.current,
              gap: m.gap,
            });
          } else {
            missingNames.push(m.name);
            gapDetails.push({
              skill: m.name,
              required: m.required,
              current: m.current,
              gap: m.gap,
            });
          }
        }
      }

      const recsResp = await recommendations(targetCareer.id, missingNames, 6, gapDetails);

      console.log("RECOMMENDATION REQUEST missingNames:", missingNames);
      console.log("RECOMMENDATION RESPONSE:", recsResp);

      const missingSet = new Set(missingNames.map(norm));

      const groupState = new Map();
      for (const r of targetCareer?.requiredSkills || []) {
        if (r?.type === "anyOf" && Array.isArray(r.options)) {
          const label = norm(r.label || "one of");
          groupState.set(label, {
            options: r.options.map(norm),
            required: Number(r.proficiency || r.requiredProficiency || 0),
          });
        }
      }

      const missingGroupChoice = new Map();
      for (const m of freshMissing) {
        if (m.groupType === "anyOf" && Array.isArray(m.options)) {
          let bestOpt = null;
          let bestCur = -1;
          for (const opt of m.options) {
            const cur = getCur(opt);
            if (cur > bestCur) {
              bestCur = cur;
              bestOpt = opt;
            }
          }
          const chosen = bestOpt || m.options[0];
          missingGroupChoice.set(norm(m.name), norm(chosen));
        }
      }

      const enforceGroupLogic = (title, skillsArr) => {
        const text = `${title} ${skillsArr.join(" ")}`;

        let matchesMissing = false;
        for (const tok of missingSet) {
          if (tok && (text.includes(tok) || skillsArr.includes(tok))) {
            matchesMissing = true;
            break;
          }
        }
        if (!matchesMissing) return false;

        for (const [groupLabel, st] of groupState.entries()) {
          const options = st.options;
          const mentionsAnyOption = options.some((opt) => text.includes(opt) || skillsArr.includes(opt));
          if (!mentionsAnyOption) continue;

          const chosen = missingGroupChoice.get(groupLabel);

          if (chosen) {
            if (!(text.includes(chosen) || skillsArr.includes(chosen))) return false;
          } else {
            return false;
          }
        }

        return true;
      };

      const allowedLevelsForGap = (lvl) => {
        if (lvl === "Beginner") return new Set(["Beginner", "Intermediate"]);
        if (lvl === "Moderate") return new Set(["Intermediate", "Advanced"]);
        return new Set(["Advanced"]);
      };

      const desiredLevelSet = new Set();
      for (const m of freshMissing.slice(0, 8)) {
        const lvl = gapLevel(m.current, m.required);
        const allowed = allowedLevelsForGap(lvl);
        for (const x of allowed) desiredLevelSet.add(String(x).toLowerCase());
      }

      const rawCourses = recsResp?.courses || [];
      const filteredCourses = rawCourses.filter((c) => {
        const title = norm(c?.title);
        const skillsArr = Array.isArray(c?.skills) ? c.skills.map(norm) : [];
        if (!enforceGroupLogic(title, skillsArr)) return false;

        const lvl = String(c?.level || "").toLowerCase();
        if (desiredLevelSet.size && lvl && !desiredLevelSet.has(lvl)) return false;

        return true;
      });

      const rawProjects = recsResp?.projects || [];
      const filteredProjects = rawProjects.filter((p) => {
        const title = norm(p?.title);
        const skillsArr = Array.isArray(p?.skills) ? p.skills.map(norm) : [];
        if (!enforceGroupLogic(title, skillsArr)) return false;

        const lvl = String(p?.level || "").toLowerCase();
        if (desiredLevelSet.size && lvl && !desiredLevelSet.has(lvl)) return false;

        return true;
      });

      setCourseRecs(filteredCourses);
      setProjectRecs(filteredProjects);

      try {
        const gapsForModel = freshMissing.slice(0, 10).map((m) => {
          const req = (targetCareer.requiredSkills || []).find((r) => {
            if (r?.type === "anyOf") return (r.label || "") === m.name;
            return (r.skill || r.name) === m.name;
          });

          return {
            skill: m.name,
            required: m.required,
            current: m.current,
            gap: m.gap,
            importance: req?.importance || req?.weight || 1.0,
          };
        });

        const gapResp = await gapPriority(targetCareer.id, gapsForModel);
        setGapPriorityData(gapResp);
      } catch (e) {
        console.warn("Gap priority failed:", e.message);
      }
    } catch (err) {
      console.error(err);
      setCourseRecs([]);
      setProjectRecs([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading skills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Analysis"
        subtitle="Track your skills and identify gaps for your target career"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const ok = confirm("Are you sure you want to delete ALL skills?");
                if (!ok) return;

                await saveProfile({
                  ...profile,
                  skills: [],
                });

                setCourseRecs([]);
                setProjectRecs([]);
                setGapPriorityData(null);
              }}
              className="mm-btn"
              disabled={saving}
            >
              Clear Skills
            </button>

            <button onClick={onOpenAddSkill} className="mm-btn-primary" disabled={saving}>
              <Plus size={18} />
              Add Skill
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="mm-card px-7 py-6 relative overflow-hidden">
          <div className="absolute right-6 top-6 opacity-70">
            <Target size={20} className="text-[rgba(47,107,255,0.85)]" />
          </div>
          <p className="text-sm mm-muted">Total Skills</p>
          <p className="text-[42px] font-bold mt-2">{totalSkills}</p>
          <p className="text-sm mm-muted mt-2">Across {categoryCount} categories</p>
        </div>

        <div className="mm-card px-7 py-6 relative overflow-hidden">
          <div className="absolute right-6 top-6 opacity-80">
            <Activity size={20} className="text-[#5EE58B]" />
          </div>
          <p className="text-sm mm-muted">Career Readiness</p>
          <p className="text-[42px] font-bold mt-2">{careerReadiness}%</p>
          <div className="mt-5 h-[6px] w-full rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div
              className="h-full bg-[var(--mm-blue)]"
              style={{ width: `${Math.min(100, Math.max(0, careerReadiness))}%` }}
            />
          </div>
        </div>

        <div className="mm-card px-7 py-6 relative overflow-hidden">
          <div className="absolute right-6 top-6 opacity-80">
            <AlertCircle size={20} className="text-[#FBBF24]" />
          </div>
          <p className="text-sm mm-muted">Skills to Improve</p>
          <p className="text-[42px] font-bold mt-2">{skillsToImprove}</p>
          <p className="text-sm mm-muted mt-2">Below 60% proficiency</p>
        </div>
      </div>

      <div className="mm-card px-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-10">
            <TabLink active={activeTab === "mySkills"} onClick={() => setActiveTab("mySkills")}>
              My Skills
            </TabLink>
            <TabLink active={activeTab === "gaps"} onClick={() => setActiveTab("gaps")}>
              Skill Gaps
            </TabLink>
            <TabLink active={activeTab === "recs"} onClick={() => setActiveTab("recs")}>
              Recommendations
            </TabLink>
          </div>
        </div>

        <div className="p-6">
          <div className="h-[70vh] overflow-y-auto pr-2">
            {activeTab === "mySkills" && (
              <MySkillsView
                skills={skills}
                onDeleteSkill={async (skillName) => {
                  const updated = (skills || []).filter(
                    (x) => x.name.toLowerCase() !== String(skillName).toLowerCase()
                  );

                  await saveProfile({
                    ...profile,
                    skills: updated,
                  });
                }}
              />
            )}

            {activeTab === "gaps" && (
              <SkillGapsView
                missingSkills={missingSkills}
                targetCareer={targetCareer}
                gapPriorityData={gapPriorityData}
              />
            )}

            {activeTab === "recs" && (
              <RecommendationsView
                targetCareer={targetCareer}
                courseRecs={courseRecs}
                projectRecs={projectRecs}
                loadingRecs={loadingRecs}
                onGenerate={onGenerateRecommendations}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        open={openAddSkill}
        title="Add Skills to Digital Twin"
        subtitle=""
        onClose={() => setOpenAddSkill(false)}
      >
        <div className="flex items-center gap-6 border-b border-[var(--mm-border)] pb-3">
          <button
            onClick={() => setAddTab("text")}
            className={`text-sm font-semibold transition pb-2 ${
              addTab === "text"
                ? "text-[var(--mm-blue)] border-b-2 border-[var(--mm-blue)]"
                : "text-[rgba(234,240,255,0.55)] hover:text-white"
            }`}
          >
            AI Text Analysis
          </button>

          <button
            onClick={() => setAddTab("resume")}
            className={`text-sm font-semibold transition pb-2 ${
              addTab === "resume"
                ? "text-[var(--mm-blue)] border-b-2 border-[var(--mm-blue)]"
                : "text-[rgba(234,240,255,0.55)] hover:text-white"
            }`}
          >
            Extract from Resume
          </button>
        </div>

        <div className="mt-4">
          {addTab === "text" && (
            <div className="space-y-3">
              <p className="text-sm mm-muted">
                Paste any text (project description, course summary, or achievement list). MentorMind
                extracts skills locally (no Gemini required).
              </p>

              <textarea
                className="mm-input min-h-[150px]"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. I built a full-stack React app with Node.js backend..."
              />
            </div>
          )}

          {addTab === "resume" && (
            <div className="space-y-3">
              <p className="text-sm mm-muted">
                Upload resume file (PDF/DOC). For now, paste the extracted text in the box above.
                Later we’ll add a backend parser.
              </p>

              <div className="mm-card-deep px-5 py-4">
                <div className="flex items-center gap-3">
                  <Upload size={18} className="text-[var(--mm-blue)]" />
                  <p className="font-semibold">Upload Resume</p>
                </div>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="mt-4 block w-full text-sm text-[rgba(234,240,255,0.75)]
                  file:mr-4 file:py-2 file:px-4 file:rounded-xl
                  file:border-0 file:bg-[rgba(255,255,255,0.12)] file:text-white file:font-semibold
                  hover:file:bg-[rgba(255,255,255,0.18)]"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    setResumeFile(file);
                    setResumeText("");
                    setExtractMsg("");

                    if (!file) return;

                    try {
                      setLoadingExtract(true);
                      setExtractMsg("⏳ Reading resume text...");

                      const txt = await extractResumeText(file);
                      setResumeText(txt);

                      if (!txt.trim()) {
                        setExtractMsg("⚠️ No readable text found in this PDF. (Scanned PDFs need OCR)");
                      } else {
                        setExtractMsg("✅ Resume text extracted successfully!");
                      }
                    } catch (err) {
                      console.error(err);
                      setExtractMsg("❌ Resume parsing failed. Try PDF/DOCX/TXT.");
                    } finally {
                      setLoadingExtract(false);
                    }
                  }}
                />

                {resumeFile && (
                  <p className="text-xs mm-muted mt-2">
                    Selected: <span className="text-white">{resumeFile.name}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {extractMsg && (
            <div className="mt-4 mm-card-deep px-4 py-3 border border-[rgba(251,191,36,0.15)] bg-[rgba(251,191,36,0.04)]">
              <p className="text-sm">{extractMsg}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={onAnalyzeAndAdd}
              disabled={loadingExtract || saving}
              className="mm-btn-primary px-6"
            >
              <Sparkles size={18} />
              {loadingExtract ? "Analyzing..." : "Analyze & Add Skills"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabLink({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-semibold pb-2 transition ${
        active
          ? "text-[var(--mm-blue)] border-b-2 border-[var(--mm-blue)]"
          : "text-[rgba(234,240,255,0.55)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MySkillsView({ skills, onDeleteSkill }) {
  if (!skills.length) {
    return (
      <div className="mm-card-deep px-6 py-10 text-center mm-muted">
        No skills tracked yet
        <div className="text-[var(--mm-blue)] mt-2 font-semibold cursor-default">
          Add your first skill
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {skills.map((s, idx) => (
        <div key={idx} className="mm-card-deep px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{s.name}</p>
              <p className="text-xs mm-muted mt-1 capitalize">
                Category: {s.category || "technical"}
              </p>
            </div>

            <button
              onClick={() => onDeleteSkill?.(s.name)}
              className="px-3 py-1 rounded-lg text-xs font-semibold
              bg-[rgba(239,68,68,0.12)] text-[#F87171]
              border border-[rgba(239,68,68,0.22)]
              hover:bg-[rgba(239,68,68,0.18)] transition"
            >
              Delete
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm mm-muted">Proficiency</p>
            <p className="text-sm mm-muted">{s.proficiency}%</p>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div
              className="h-full bg-[var(--mm-blue)]"
              style={{ width: `${Math.min(100, Math.max(0, s.proficiency || 0))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillGapsView({ missingSkills, targetCareer, gapPriorityData }) {
  return (
    <div>
      <p className="text-lg font-semibold">
        Missing or Low Proficiency Skills for{" "}
        <span className="text-[var(--mm-blue)]">{targetCareer.title}</span>
      </p>

      {gapPriorityData?.topGapsToFixFirst?.length ? (
        <div className="mt-4 mm-card-deep px-5 py-4">
          <p className="text-sm font-semibold">Top gaps to fix first</p>
          <p className="text-sm mm-muted mt-2">
            {gapPriorityData.topGapsToFixFirst.join(", ")}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {missingSkills.slice(0, 8).map((m, idx) => (
          <div key={idx} className="mm-card-deep px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{formatGapSkillName(m)}</p>
              <p className="text-sm mm-muted mt-1">
                Required: {m.required}% | Current: {m.current}%
              </p>
            </div>

            <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-[rgba(239,68,68,0.12)] text-[#F87171] border border-[rgba(239,68,68,0.22)]">
              -{m.gap}% Gap
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsView({
  targetCareer,
  courseRecs,
  projectRecs,
  loadingRecs,
  onGenerate,
}) {
  const coursesEmpty = !courseRecs || courseRecs.length === 0;
  const projectsEmpty = !projectRecs || projectRecs.length === 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[var(--mm-border)]">
        <p className="text-base font-semibold">
          Recommendations for{" "}
          <span className="text-[var(--mm-blue)]">{targetCareer.title}</span>
        </p>

        <button onClick={onGenerate} className="mm-btn-primary">
          <Sparkles size={18} />
          {loadingRecs ? "Generating..." : "Generate Recommendations"}
        </button>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto pr-2">
        {coursesEmpty && projectsEmpty ? (
          <div className="mm-card-deep px-6 py-16 border border-dashed border-[rgba(255,255,255,0.10)] flex flex-col items-center justify-center text-center">
            <MonitorPlay size={42} className="text-[rgba(234,240,255,0.35)]" />
            <p className="mt-4 text-sm mm-muted">
              Click generate to see personalized course and project recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="text-base font-semibold">Courses</p>
              {coursesEmpty ? (
                <p className="text-sm mm-muted mt-2">No course recommendations found.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseRecs.map((c, idx) => (
                    <div key={idx} className="mm-card-deep px-6 py-5">
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:bg-[rgba(255,255,255,0.04)] transition rounded-xl"
                      >
                        <p className="font-semibold text-lg">{c.title}</p>
                        <p className="text-xs mm-muted mt-2">
                          {c.platform} • {c.level} {c.duration ? `• ${c.duration}` : ""}
                        </p>
                        <p className="text-xs text-[var(--mm-blue)] mt-3 font-semibold">
                          Open Course →
                        </p>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-base font-semibold">Projects</p>
              {projectsEmpty ? (
                <p className="text-sm mm-muted mt-2">No project recommendations found.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectRecs.map((p, idx) => (
                    <div key={idx} className="mm-card-deep px-6 py-5">
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:bg-[rgba(255,255,255,0.04)] transition rounded-xl"
                      >
                        <p className="font-semibold text-lg">{p.title}</p>
                        <p className="text-xs mm-muted mt-2">
                          {p.level} • Skills: {(p.skills || []).slice(0, 5).join(", ")}
                        </p>
                        <p className="text-xs text-[var(--mm-blue)] mt-3 font-semibold">
                          Open Project →
                        </p>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}