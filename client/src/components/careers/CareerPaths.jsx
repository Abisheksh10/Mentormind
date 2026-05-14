import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../layout/PageHeader";
import { CAREER_PATHS } from "../../data/constants";
import { careerRank, jobs, simulationExplain } from "../../services/mlService";
import { useStudentProfile } from "../../hooks/useStudentProfile";
import { Search, Upload, Play, Briefcase } from "lucide-react";
import { applyWhatIfSkills } from "../../utils/whatIfUtils";
import { computeMissingSkills } from "../../utils/scoreUtils";
import { computeCareerMatchScore } from "../../utils/careerUtils";

// ✅ PDF / DOCX parsing
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * ✅ Build allowlist / vocabulary from careers
 */
function buildAllowedSkillsFromCareers(careers = []) {
  const out = new Set();
  for (const c of careers) {
    for (const r of c.requiredSkills || []) {
      if (r?.type === "anyOf" && Array.isArray(r.options)) {
        r.options.forEach((opt) => out.add(opt));
      } else {
        if (r?.name) out.add(r.name);
        if (r?.skill) out.add(r.skill);
      }
    }
  }
  return Array.from(out).filter(Boolean);
}

const allowedSkills = buildAllowedSkillsFromCareers(CAREER_PATHS);

function normSkillName(x = "") {
  return String(x || "").trim().toLowerCase();
}

function getCareerVocabulary(career) {
  const out = new Set();
  for (const r of career?.requiredSkills || []) {
    if (r?.type === "anyOf" && Array.isArray(r.options)) {
      r.options.forEach((opt) => out.add(normSkillName(opt)));
    } else {
      if (r?.name) out.add(normSkillName(r.name));
      if (r?.skill) out.add(normSkillName(r.skill));
    }
  }
  return out;
}

function mergeExtractedSkills(primary = [], secondary = []) {
  const map = new Map();

  const pushOne = (s) => {
    const key = normSkillName(s?.name);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, { ...s });
      return;
    }

    const old = map.get(key);
    map.set(key, {
      ...old,
      ...s,
      proficiency: Math.max(
        Number(old?.proficiency || 0),
        Number(s?.proficiency || 0)
      ),
      signals: {
        ...(old?.signals || {}),
        ...(s?.signals || {}),
      },
    });
  };

  primary.forEach(pushOne);
  secondary.forEach(pushOne);

  return Array.from(map.values());
}

function extractCareerScoreFromResponse(resp, careerId, fallback = 0) {
  const list = resp?.rankedCareers || resp?.careers || resp?.ranked || [];
  if (!Array.isArray(list)) return fallback;

  const found = list.find((x) => x?.careerId === careerId || x?.id === careerId);
  if (!found) return fallback;

  return Number(found?.score || fallback);
}

/**
 * ✅ Small fallback mapper only if Gemini does not return projected skills
 * This is NOT the main logic, only a safety net.
 */
function buildScenarioConceptSkills(text = "", selectedCareer) {
  const raw = String(text || "").toLowerCase();
  const allowed = getCareerVocabulary(selectedCareer);
  const out = [];

  const addSkill = (name, proficiency = 55) => {
    const key = normSkillName(name);
    if (!allowed.has(key)) return;

    out.push({
      name,
      proficiency,
      category: "technical",
      source: "scenario_concept",
      kind: "learning_plan",
      confidence: 0.85,
      signals: {
        mentions: 2,
      },
    });
  };

  const has = (...patterns) => patterns.some((p) => p.test(raw));

  // ML / DL
  if (has(/deep learning/, /neural network/, /cnn/, /rnn/, /transformer/)) {
    addSkill("machine learning", 58);
    addSkill("tensorflow", 50);
    addSkill("pytorch", 50);
  }

  if (has(/machine learning/, /\bml\b/, /supervised learning/, /unsupervised learning/)) {
    addSkill("machine learning", 60);
  }

  if (has(/mlops/, /model deployment/, /deploy models?/, /model serving/, /pipeline/)) {
    addSkill("mlops", 55);
    addSkill("docker", 50);
  }

  // Backend / full stack
  if (has(/rest api/, /backend api/, /api development/, /api design/)) {
    addSkill("rest api", 60);
  }

  if (has(/docker/, /container/i, /containerization/)) {
    addSkill("docker", 55);
  }

  if (has(/\bgit\b/, /version control/, /github workflow/)) {
    addSkill("git", 55);
  }

  // Frontend
  if (has(/frontend/, /ui development/, /react development/)) {
    addSkill("react", 60);
    addSkill("javascript", 58);
    addSkill("html", 55);
    addSkill("css", 55);
  }

  // Cloud
  if (has(/\baws\b/, /cloud fundamentals/, /cloud engineering/)) {
    addSkill("aws", 60);
  }

  if (has(/linux/, /shell/, /ubuntu/, /server administration/)) {
    addSkill("linux", 58);
  }

  if (has(/networking/, /vpc/, /subnet/, /routing/)) {
    addSkill("networking", 55);
  }

  if (has(/security/, /iam/, /authentication/, /authorization/)) {
    addSkill("security", 55);
  }

  return mergeExtractedSkills(out, []);
}

/**
 * ✅ Read uploaded file into text
 */
async function fileToText(file) {
  if (!file) return "";

  const fileName = String(file.name || "").toLowerCase();

  // txt
  if (fileName.endsWith(".txt")) {
    return await file.text();
  }

  // pdf
  if (fileName.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => it.str || "").join(" ");
      out += pageText + "\n";
    }
    return out.trim();
  }

  // docx
  if (fileName.endsWith(".docx")) {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return String(result.value || "").trim();
  }

  // older .doc not handled reliably in-browser
  return "";
}

function mergeScenarioText(whatIfText, resumeText) {
  const a = String(whatIfText || "").trim();
  const b = String(resumeText || "").trim();

  if (a && b) return `${a}\n\n${b}`;
  if (a) return a;
  return b;
}

export default function CareerPaths() {
  const { profile, saveProfile, loading } = useStudentProfile();

  const [search, setSearch] = useState("");
  const [rankedML, setRankedML] = useState(null);

  const [selectedCareerId, setSelectedCareerId] = useState(
    profile?.targetCareerId || CAREER_PATHS?.[0]?.id
  );

  // ✅ Simulation state
  const [resumeFile, setResumeFile] = useState(null);
  const [whatIfText, setWhatIfText] = useState("");
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState(null);

  // ✅ Jobs
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobResult, setJobResult] = useState(null);

  const skills = profile?.skills || [];
  const [aiSimExplain, setAiSimExplain] = useState(null);

  useEffect(() => {
    if (!profile?.targetCareerId) return;
    setSelectedCareerId(profile.targetCareerId);
  }, [profile?.targetCareerId]);

  const selectedCareer = useMemo(() => {
    return CAREER_PATHS.find((c) => c.id === selectedCareerId) || CAREER_PATHS[0];
  }, [selectedCareerId]);

  const rankedCareers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const mlList = Array.isArray(rankedML)
      ? rankedML
          .map((r) => {
            const c = CAREER_PATHS.find((x) => x.id === r.careerId);
            if (!c) return null;
            return { ...c, matchScore: Number(r.score || 0) };
          })
          .filter(Boolean)
      : null;

    const fallback = CAREER_PATHS
      .map((c) => ({
        ...c,
        matchScore: computeCareerMatchScore(skills, c.requiredSkills || []),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    const baseList = mlList && mlList.length ? mlList : fallback;

    if (!q) return baseList;

    return baseList.filter((c) => {
      const title = String(c.title || "").toLowerCase();
      const desc = String(c.description || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [rankedML, skills, search]);

  const selectedScore = useMemo(() => {
    const found = rankedCareers.find((c) => c.id === selectedCareerId);
    if (found?.matchScore != null) return Math.round(found.matchScore);

    return computeCareerMatchScore(skills, selectedCareer?.requiredSkills || []);
  }, [rankedCareers, selectedCareerId, skills, selectedCareer]);

  useEffect(() => {
    if (!profile) return;

    (async () => {
      try {
        const resp = await careerRank(skills, CAREER_PATHS);
        const list = resp?.rankedCareers || resp?.careers || resp;
        if (Array.isArray(list)) setRankedML(list);
        else setRankedML(null);
      } catch (e) {
        setRankedML(null);
      }
    })();
  }, [profile?.id, JSON.stringify(skills)]);

  const onSelectCareer = async (careerId) => {
    setSelectedCareerId(careerId);
    setJobResult(null);
    setJobsError("");

    try {
      if (!profile) return;
      await saveProfile({ ...profile, targetCareerId: careerId });
    } catch (e) {
      // ignore silently
    }
  };

  /**
   * ✅ WHAT-IF SCENARIO
   * - uses whatIfText and/or uploaded file
   * - uses Gemini projected skill updates from backend
   * - fallback concept skills only if Gemini returns nothing useful
   * - updates skills temporarily only
   * - recomputes score for selected career only
   */
  const onRunSimulation = async () => {
    if (!whatIfText.trim() && !resumeFile) return;

    try {
      setWhatIfLoading(true);
      setWhatIfResult(null);
      setAiSimExplain(null);

      const baseSkills = profile?.skills || [];

      // 1) Read uploaded file if present
      let resumeText = "";
      if (resumeFile) {
        resumeText = await fileToText(resumeFile);
      }

      // 2) Merge scenario text
      const scenarioText = mergeScenarioText(whatIfText, resumeText);

      if (!scenarioText.trim()) {
        throw new Error("No simulation input found.");
      }

      const currentSelectedScore = Number(selectedScore || 0);

      // 3) Current missing skills for the selected career
      const currentMissing = computeMissingSkills(
        baseSkills,
        selectedCareer?.requiredSkills || []
      ).slice(0, 6);

      // 4) SINGLE Gemini call: explanation + projected skill updates
      const explainPayload = {
        careerTitle: selectedCareer?.title,
        whatIfText: scenarioText,
        oldScore: currentSelectedScore,
        newScore: currentSelectedScore,
        delta: 0,
        detectedBoosts: [],
        topMissing: currentMissing.map((m) => ({
          name: m.name,
          gap: m.gap,
          required: m.required,
          current: m.current,
        })),
        currentSkills: baseSkills,
        requiredSkills: selectedCareer?.requiredSkills || [],
      };

      const aiResp = await simulationExplain(explainPayload);
      setAiSimExplain(aiResp);

      // 5) Use Gemini projected updates as primary source
      const geminiProjectedSkills = Array.isArray(aiResp?.simulatedSkillUpdates)
        ? aiResp.simulatedSkillUpdates.map((s) => ({
            name: s.name,
            proficiency: Number(s.proficiency || 0),
            confidence: Number(s.confidence || 0.75),
            category: "technical",
            reason: s.reason || "",
            source: "gemini_projection",
            kind: "learning_plan",
            signals: { mentions: 2 },
          }))
        : [];

      // 6) Small fallback concept mapping only if Gemini gave nothing useful
      const conceptSkills =
        geminiProjectedSkills.length > 0
          ? []
          : buildScenarioConceptSkills(scenarioText, selectedCareer);

      // 7) Merge temporary scenario skill candidates
      const extracted = mergeExtractedSkills(geminiProjectedSkills, conceptSkills);

      // 8) Apply simulated skill updates temporarily only
      const simulatedSkills = applyWhatIfSkills(baseSkills, extracted, {
        mode: "boost",
        newSkillBaseline: 52,
      });

      // 9) Keep old score aligned with current displayed score
      const oldScore = currentSelectedScore;

      // 10) Compute new score using backend ranking for consistency
      let newScore = computeCareerMatchScore(
        simulatedSkills,
        selectedCareer?.requiredSkills || []
      );

      try {
        const simResp = await careerRank(simulatedSkills, CAREER_PATHS);
        newScore = extractCareerScoreFromResponse(simResp, selectedCareerId, newScore);
      } catch (err) {
        console.error("simulation ranking fallback used:", err);
      }

      const delta = newScore - oldScore;

      // 11) Missing skills after simulation
      const newMissing = computeMissingSkills(
        simulatedSkills,
        selectedCareer?.requiredSkills || []
      );

      // 12) Detect temporary skill changes
      const baseMap = new Map(
        baseSkills.map((s) => [normSkillName(s.name), Number(s.proficiency || 0)])
      );

      const simMap = new Map(
        simulatedSkills.map((s) => [normSkillName(s.name), Number(s.proficiency || 0)])
      );

      const detectedBoosts = simulatedSkills
        .map((s) => {
          const key = normSkillName(s.name);
          const before = baseMap.get(key) || 0;
          const after = simMap.get(key) || 0;
          return {
            name: s.name,
            before,
            after,
            delta: Math.round(after - before),
          };
        })
        .filter((x) => x.delta > 0)
        .sort((a, b) => b.delta - a.delta);

      setWhatIfResult({
        oldScore,
        newScore,
        delta,
        boosts: detectedBoosts,
        topMissing: newMissing.slice(0, 6),
        simulatedSkills,
        extractedSkills: extracted,
      });

      // 13) Refresh explanation with final scores/boosts for better narrative alignment
      const finalExplainPayload = {
        careerTitle: selectedCareer?.title,
        whatIfText: scenarioText,
        oldScore,
        newScore,
        delta,
        detectedBoosts: detectedBoosts.map((b) => ({
          name: b.name,
          before: b.before,
          after: b.after,
          delta: b.delta,
        })),
        topMissing: newMissing.slice(0, 6).map((m) => ({
          name: m.name,
          gap: m.gap,
          required: m.required,
          current: m.current,
        })),
        currentSkills: baseSkills,
        requiredSkills: selectedCareer?.requiredSkills || [],
      };

      const refreshedExplain = await simulationExplain(finalExplainPayload);
      setAiSimExplain(refreshedExplain);
    } catch (e) {
      console.error(e);
      setWhatIfResult(null);
      setAiSimExplain(null);
    } finally {
      setWhatIfLoading(false);
    }
  };

  const onFetchJobs = async () => {
    try {
      setJobsLoading(true);
      setJobsError("");
      setJobResult(null);

      const resp = await jobs(
        selectedCareer?.title || "Software Engineer",
        "India",
        skills
      );

      const apiJobs = resp?.jobs || resp?.listings || [];
      setJobResult({ jobs: Array.isArray(apiJobs) ? apiJobs : [] });
    } catch (e) {
      setJobsError(e?.message || "Job fetch failed");
      setJobResult({ jobs: [] });
    } finally {
      setJobsLoading(false);
    }
  };

  const apiJobs = jobResult?.jobs || [];
  const showDirectLinks = jobResult && apiJobs.length === 0;

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading career paths...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Path Simulation"
        subtitle="Explore careers and simulate your progression with AI-powered insights"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 min-h-0 h-[calc(100vh-140px)]">
        {/* LEFT */}
        <div className="mm-card p-4 flex flex-col min-h-0">
          <p className="text-sm font-semibold mb-3">Select Target Career</p>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-[rgba(234,240,255,0.45)]"
            />
            <input
              className="mm-input pl-9"
              placeholder="Search careers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
            {rankedCareers.map((career, idx) => (
              <CareerCard
                key={career.id}
                career={career}
                selected={career.id === selectedCareerId}
                badge={idx <= 2 ? "Top Pick" : ""}
                onClick={() => onSelectCareer(career.id)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="min-h-0 overflow-y-auto pr-2 space-y-6">
          {/* SIMULATION */}
          <div className="mm-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold">{selectedCareer?.title} Simulation</p>
                <p className="text-sm mm-muted mt-1">
                  Analyze your fit and simulate future scenarios
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-[var(--mm-blue)]">
                  {selectedScore}%
                </p>
                <p className="text-xs mm-muted -mt-1">Current Match</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">What-If Scenario (Optional)</p>
                <input
                  className="mm-input"
                  placeholder="e.g., What if I learn Docker, Git, and improve REST API this semester?"
                  value={whatIfText}
                  onChange={(e) => setWhatIfText(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Upload Resume/Context (Optional)
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] transition cursor-pointer">
                  <Upload size={16} />
                  <span className="text-sm font-semibold">Attach File</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                </label>

                {resumeFile ? (
                  <p className="text-xs mm-muted mt-2">
                    Selected:{" "}
                    <span className="text-white font-semibold">
                      {resumeFile.name}
                    </span>
                  </p>
                ) : null}
              </div>

              <button
                onClick={onRunSimulation}
                disabled={whatIfLoading || (!whatIfText.trim() && !resumeFile)}
                className="mm-btn-primary w-full justify-center py-3"
              >
                <Play size={18} />
                {whatIfLoading ? "Running Simulation..." : "Run Simulation"}
              </button>

              <div className="mt-6 mm-card-deep p-6">
                <p className="text-lg font-bold">Simulation Results</p>

                {!whatIfResult ? (
                  <p className="text-sm mm-muted mt-3">
                    Run simulation to see the temporary score change for this selected career.
                  </p>
                ) : (
                  <>
                    <p className="text-sm mm-muted mt-2">
                      For{" "}
                      <span className="text-white font-semibold">
                        {selectedCareer?.title}
                      </span>
                      , your temporary fit score changed from{" "}
                      <span className="text-white font-semibold">
                        {whatIfResult.oldScore}%
                      </span>{" "}
                      to{" "}
                      <span className="text-white font-semibold">
                        {whatIfResult.newScore}%
                      </span>
                      .
                    </p>

                    <p className="mt-3 text-sm font-semibold">
                      {whatIfResult.delta > 0 ? (
                        <span className="text-[#5EE58B]">
                          ✅ Improvement: +{whatIfResult.delta}%
                        </span>
                      ) : whatIfResult.delta < 0 ? (
                        <span className="text-[#F87171]">
                          ⚠ Decrease: {whatIfResult.delta}%
                        </span>
                      ) : (
                        <span className="text-[#FBBF24]">
                          ⚠ No score change detected
                        </span>
                      )}
                    </p>

                    <div className="mt-5">
                      <p className="text-sm font-semibold">Temporarily Updated Skills</p>

                      {whatIfResult.boosts?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {whatIfResult.boosts.map((b, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-xl text-xs font-semibold bg-[rgba(47,107,255,0.14)] text-[var(--mm-blue)] border border-[rgba(47,107,255,0.25)]"
                            >
                              {b.name} ({b.before}% → {b.after}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm mm-muted mt-2">
                          No temporary skill improvements detected.
                        </p>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold">
                        Remaining Gaps After Simulation
                      </p>

                      {whatIfResult.topMissing?.length ? (
                        <div className="mt-3 space-y-2">
                          {whatIfResult.topMissing.map((m, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 bg-[rgba(255,255,255,0.03)]"
                            >
                              <p className="text-sm font-semibold">{m.name}</p>
                              <p className="text-xs mm-muted mt-1">
                                Required: {m.required}% | Current: {m.current}% | Gap:{" "}
                                {m.gap}%
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm mm-muted mt-2">
                          No major gaps remain for this simulated scenario.
                        </p>
                      )}
                    </div>

                    {aiSimExplain?.summary ? (
                      <div className="mt-5 mm-card-deep p-4 border border-[rgba(255,255,255,0.08)]">
                        <p className="text-sm font-semibold">AI Explanation</p>
                        <p className="text-sm mm-muted mt-2">{aiSimExplain.summary}</p>

                        {Array.isArray(aiSimExplain?.nextActions) &&
                        aiSimExplain.nextActions.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-white/80">
                              Suggested Next Actions
                            </p>
                            <ul className="mt-2 space-y-1 text-xs mm-muted">
                              {aiSimExplain.nextActions.slice(0, 3).map((x, i) => (
                                <li key={i}>• {x}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* JOBS */}
          <div className="mm-card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-[var(--mm-blue)]">
                  <Briefcase size={22} />
                </div>

                <div>
                  <p className="text-lg font-bold">Recommended Opportunities</p>
                  <p className="text-sm mm-muted mt-1">
                    Real-time job listings matching your Digital Twin profile for{" "}
                    <span className="text-[var(--mm-blue)] font-semibold">
                      {selectedCareer?.title}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={onFetchJobs}
                disabled={jobsLoading}
                className="mm-btn-primary"
              >
                <Briefcase size={18} />
                {jobsLoading ? "Finding..." : "Find Jobs Now"}
              </button>
            </div>

            <div className="mt-5 mm-card-deep p-6 border border-[rgba(47,107,255,0.22)] bg-[rgba(47,107,255,0.04)]">
              {jobsError ? (
                <p className="text-sm text-[#F87171]">{jobsError}</p>
              ) : null}

              {!jobResult ? (
                <div className="h-[230px] border border-dashed border-[rgba(255,255,255,0.10)] rounded-xl flex flex-col items-center justify-center text-center px-6">
                  <div className="opacity-40">
                    <Briefcase size={48} />
                  </div>

                  <p className="mt-4 font-semibold text-[rgba(234,240,255,0.75)]">
                    Ready to explore?
                  </p>

                  <p className="mt-2 text-sm mm-muted">
                    Click the button above to search for live job openings that
                    <br />
                    match your skills and target career.
                  </p>
                </div>
              ) : null}

              {jobResult && apiJobs.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiJobs.slice(0, 8).map((j, idx) => (
                    <a
                      key={idx}
                      href={j.link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mm-card px-5 py-4 hover:bg-[rgba(255,255,255,0.04)] transition block"
                    >
                      <p className="font-semibold">{j.title || "Job Title"}</p>
                      <p className="text-xs mm-muted mt-1">
                        {j.company || "Company"} • {j.location || "India"}
                      </p>
                      <p className="text-xs text-[var(--mm-blue)] mt-3 font-semibold">
                        Apply →
                      </p>
                    </a>
                  ))}
                </div>
              ) : null}

              {showDirectLinks ? (
                <div className="mt-6">
                  <p className="text-sm font-semibold">Direct Links</p>
                  <p className="text-xs mm-muted mt-1">
                    No API jobs returned. Use official job portals:
                  </p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {buildFallbackLinks(selectedCareer?.title)
                      .slice(0, 6)
                      .map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mm-card px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition block"
                        >
                          <p className="font-semibold truncate">{link.domain}</p>
                          <p className="text-xs mm-muted truncate mt-1">{link.source}</p>
                          <p className="mt-3 text-sm text-[var(--mm-blue)] font-semibold">
                            View Posting →
                          </p>
                        </a>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CareerCard({ career, selected, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl px-5 py-4 transition border
        ${
          selected
            ? "bg-[rgba(47,107,255,0.18)] border border-[rgba(47,107,255,0.35)]"
            : "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold truncate">{career.title}</p>
          <p className="text-sm mm-muted mt-1 line-clamp-2">{career.description}</p>
        </div>

        {badge ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(47,107,255,0.12)] text-[var(--mm-blue)] border border-[rgba(47,107,255,0.25)] shrink-0">
            {badge}
          </span>
        ) : null}
      </div>

      {career.salaryRange ? (
        <p className="text-sm mt-3 text-[rgba(234,240,255,0.55)] flex items-center gap-2">
          <span className="opacity-70">💼</span>
          {career.salaryRange}
        </p>
      ) : null}
    </button>
  );
}

function buildFallbackLinks(role = "Software Engineer") {
  const q = encodeURIComponent(role + " jobs India");
  return [
    { domain: "indeed.com", url: `https://in.indeed.com/jobs?q=${q}`, source: "Search" },
    { domain: "wellfound.com", url: `https://wellfound.com/jobs?search=${q}`, source: "Search" },
    { domain: "linkedin.com", url: `https://www.linkedin.com/jobs/search/?keywords=${q}`, source: "Search" },
    { domain: "naukri.com", url: `https://www.naukri.com/${q}-jobs`, source: "Search" },
    { domain: "internshala.com", url: `https://internshala.com/internships/keywords-${q}`, source: "Search" },
    { domain: "foundit.in", url: `https://www.foundit.in/srp/results?query=${q}`, source: "Search" },
  ];
}