from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import joblib
import numpy as np
import os
import json
from datetime import datetime
import re

app = FastAPI(title="MentorMind ML Service")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

career_model_path = os.path.join(MODEL_DIR, "career_ranker.pkl")
career_encoder_path = os.path.join(MODEL_DIR, "skill_encoder.pkl")
gap_model_path = os.path.join(MODEL_DIR, "gap_priority.pkl")
reco_path = os.path.join(os.path.dirname(__file__), "data", "recommender.pkl")

COURSES_JSON = os.path.join(os.path.dirname(__file__), "data", "courses_db.json")
PROJECTS_JSON = os.path.join(os.path.dirname(__file__), "data", "projects_db.json")

career_model = joblib.load(career_model_path) if os.path.exists(career_model_path) else None
skill_encoder = joblib.load(career_encoder_path) if os.path.exists(career_encoder_path) else None
gap_model = joblib.load(gap_model_path) if os.path.exists(gap_model_path) else None
reco_bundle = joblib.load(reco_path) if os.path.exists(reco_path) else None

FEEDBACK_LOG = os.path.join(os.path.dirname(__file__), "data", "career_feedback.jsonl")


# ----------- Schemas -----------

class Skill(BaseModel):
    name: str
    proficiency: int

class CareerRankRequest(BaseModel):
    skills: List[Skill]
    career_paths: List[Dict[str, Any]]

class GapPriorityRequest(BaseModel):
    careerId: str
    gaps: List[Dict[str, Any]]

class RecommendRequest(BaseModel):
    careerId: str
    missingSkills: List[str]
    topK: int = 5
    gapDetails: Optional[List[Dict[str, Any]]] = None

class CareerFeedbackRequest(BaseModel):
    careerId: str
    event: str = "select"
    skills: List[Skill]
    meta: Optional[Dict[str, Any]] = None


# ----------- Helpers -----------

def norm_skill(s: str) -> str:
    s = str(s or "").strip().lower()

    s = re.sub(r"\s*/\s*", " ", s)
    s = re.sub(r"\s+", " ", s).strip()

    alias = {
        "react.js": "react",
        "reactjs": "react",
        "react js": "react",

        "nodejs": "node.js",
        "node js": "node.js",

        "express.js": "express",
        "expressjs": "express",
        "express js": "express",

        "rest apis": "rest api",
        "restapi": "rest api",

        "api testing": "api testing",
        "git github": "git",
        "github": "git",

        "springboot": "spring boot",
        "spring-boot": "spring boot",
    }

    return alias.get(s, s)

def to_skill_vector(skills: List[Skill], all_skills: List[str]) -> np.ndarray:
    vec = np.zeros(len(all_skills), dtype=np.float32)
    idx = {norm_skill(s): i for i, s in enumerate(all_skills)}

    for sk in skills:
        name = norm_skill(sk.name)
        if name in idx:
            vec[idx[name]] = float(sk.proficiency) / 100.0

    return vec

def _user_skill_map(skills: List[Skill]) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for s in skills:
        k = norm_skill(s.name)
        v = int(s.proficiency or 0)
        out[k] = max(out.get(k, 0), v)
    return out

def _infer_cloud_provider(req: RecommendRequest) -> Optional[str]:
    tokens = " ".join(req.missingSkills).lower()
    for p in ["aws", "azure", "gcp"]:
        if p in tokens:
            return p

    if req.gapDetails:
        for g in req.gapDetails:
            opts = g.get("options") if isinstance(g, dict) else None
            if isinstance(opts, list):
                joined = " ".join([str(x).lower() for x in opts])
                for p in ["aws", "azure", "gcp"]:
                    if p in joined:
                        return p
    return None

def _infer_level(req: RecommendRequest, provider: Optional[str]) -> Optional[str]:
    if not req.gapDetails:
        return None

    if provider:
        for g in req.gapDetails:
            if not isinstance(g, dict):
                continue
            skill_name = str(g.get("skill", "")).lower()
            opts = g.get("options") if isinstance(g.get("options"), list) else []
            opts_l = [str(x).lower() for x in opts]

            if "cloud provider" in skill_name or provider in skill_name or provider in " ".join(opts_l):
                cur = int(g.get("current", 0) or 0)
                if cur <= 20:
                    return "Beginner"
                if cur <= 50:
                    return "Intermediate"
                return "Advanced"

    best = None
    for g in req.gapDetails:
        if not isinstance(g, dict):
            continue
        if best is None or int(g.get("gap", 0) or 0) > int(best.get("gap", 0) or 0):
            best = g

    if best:
        cur = int(best.get("current", 0) or 0)
        if cur <= 20:
            return "Beginner"
        if cur <= 50:
            return "Intermediate"
        return "Advanced"
    return None

def _doc_text(x: Dict[str, Any]) -> str:
    title = str(x.get("title", "")).lower()
    skills = " ".join([str(s).lower() for s in (x.get("skills", []) or [])])
    level = str(x.get("level", "")).lower()
    return f"{title} {skills} {level}".strip()

def _fallback_recommend(missing_skills: List[str], topk: int):
    try:
        courses = json.load(open(COURSES_JSON, "r", encoding="utf-8")) if os.path.exists(COURSES_JSON) else []
        projects = json.load(open(PROJECTS_JSON, "r", encoding="utf-8")) if os.path.exists(PROJECTS_JSON) else []
    except Exception:
        return [], []

    q = " ".join(missing_skills).lower().split()
    q = [t for t in q if t.strip()]

    def score_item(item):
        doc = _doc_text(item)
        return sum(1 for t in q if t in doc)

    courses_sorted = sorted(courses, key=score_item, reverse=True)
    projects_sorted = sorted(projects, key=score_item, reverse=True)

    courses_out = [c for c in courses_sorted[:topk] if score_item(c) > 0]
    projects_out = [p for p in projects_sorted[:topk] if score_item(p) > 0]

    return courses_out, projects_out


# ----------- Endpoints -----------

@app.post("/predict-careers")
def predict_careers(req: CareerRankRequest):
    print("\n=== Incoming skills to /predict-careers ===")
    try:
        payload = req.model_dump()
    except Exception:
        payload = req.dict()
    print(json.dumps(payload.get("skills", []), indent=2))
    print("=== end skills ===\n")

    career_paths = req.career_paths
    user_skills_map = _user_skill_map(req.skills)

    def _credit(cur: int, reqp: int) -> float:
        if reqp <= 0:
            return 0.0
        ratio = cur / float(reqp)
        return min(1.1, ratio) / 1.1

    def _score_cap_from_missing_penalty(missing_penalty: float, missing_count: int) -> int:
        """
        Importance-aware universal cap policy.
        Lower cap when important required skills are still below threshold.
        """
        if missing_count == 0:
            return 92
        if missing_penalty <= 0.8:
            return 88
        if missing_penalty <= 1.6:
            return 84
        if missing_penalty <= 2.5:
            return 78
        if missing_penalty <= 3.5:
            return 72
        return 68

    ranked = []

    for c in career_paths:
        required = c.get("requiredSkills", [])
        total = 0.0
        hit = 0.0
        missing = []
        matched = []
        missing_penalty = 0.0

        debug_this = c.get("id") in {"backend_dev", "frontend_dev", "fullstack_dev", "cloud_engineer"}
        if debug_this:
            print(f"\n========== DEBUG CAREER: {c.get('id')} | {c.get('title')} ==========")

        for r in required:
            imp = float(r.get("importance", 1.0) or 1.0)

            # anyOf
            if isinstance(r, dict) and r.get("type") == "anyOf" and isinstance(r.get("options"), list):
                reqp = int(r.get("requiredProficiency", 0) or 0)
                w = reqp * imp
                total += w

                best_cur = 0
                best_opt = None
                for opt in r["options"]:
                    cur = int(user_skills_map.get(norm_skill(opt), 0))
                    if cur > best_cur:
                        best_cur = cur
                        best_opt = opt

                cred = _credit(best_cur, reqp)
                gained = w * cred
                hit += gained

                if debug_this:
                    print(
                        f"[{c['id']}] anyOf={r.get('label')} "
                        f"req={reqp} best_opt={best_opt} best_cur={best_cur} "
                        f"importance={imp} weight={w:.2f} credit={cred:.4f} gained={gained:.2f}"
                    )

                if best_cur >= reqp:
                    matched.append(r.get("label") or str(best_opt) or "anyOf")
                else:
                    missing.append(r.get("label") or "One of")
                    missing_penalty += imp
                continue

            # normal skill
            nm = norm_skill(r.get("skill", ""))
            reqp = int(r.get("requiredProficiency", 0) or 0)
            cur = int(user_skills_map.get(nm, 0))

            w = reqp * imp
            total += w

            cred = _credit(cur, reqp)
            gained = w * cred
            hit += gained

            if debug_this:
                print(
                    f"[{c['id']}] skill={nm} req={reqp} cur={cur} "
                    f"importance={imp} weight={w:.2f} credit={cred:.4f} gained={gained:.2f}"
                )

            if cur >= reqp:
                matched.append(r.get("skill"))
            else:
                missing.append(r.get("skill"))
                missing_penalty += imp

        coverage_score = int((hit / total) * 100) if total > 0 else 0
        coverage_score = max(0, min(100, coverage_score))

        score_cap = _score_cap_from_missing_penalty(missing_penalty, len(missing))
        capped_coverage = min(score_cap, coverage_score)

        prob = min(0.99, max(0.01, capped_coverage / 100.0))

        if debug_this:
            print(
                f"[{c['id']}] TOTAL weight={total:.2f} | HIT={hit:.2f} | "
                f"COVERAGE_SCORE={coverage_score} | MISSING_COUNT={len(missing)} | "
                f"MISSING_PENALTY={missing_penalty:.2f} | SCORE_CAP={score_cap} | "
                f"CAPPED_COVERAGE={capped_coverage} | MATCHED={matched} | MISSING={missing}"
            )

        ranked.append({
            "careerId": c["id"],
            "title": c["title"],
            "score": capped_coverage,
            "probability": float(prob),
            "topMatchedSkills": matched[:5],
            "topMissingSkills": missing[:5],
            "_debugMissingPenalty": missing_penalty,   # harmless internal field for now
            "_debugScoreCap": score_cap,              # harmless internal field for now
        })

    if career_model and skill_encoder:
        all_skills = skill_encoder["all_skills"]
        x = to_skill_vector(req.skills, all_skills).reshape(1, -1)
        probs = career_model.predict_proba(x)[0]
        careers = skill_encoder["all_careers"]

        prob_map = {careers[i]: float(probs[i]) for i in range(len(careers))}

        W_COV = 0.90
        W_LGBM = 0.10

        for item in ranked:
            cid = item["careerId"]
            if cid in prob_map:
                p = prob_map[cid]
                lgbm_score = int(p * 100)
                coverage_score = int(item["score"])
                score_cap = int(item.get("_debugScoreCap", 92))

                # safeguard: if coverage is already strong, don't let near-zero LGBM crush it
                if coverage_score >= 75 and lgbm_score < 20:
                    blended = coverage_score
                else:
                    blended = int(W_COV * coverage_score + W_LGBM * lgbm_score)

                blended = min(score_cap, blended)
                blended = min(92, max(0, blended))

                if cid in {"backend_dev", "frontend_dev", "fullstack_dev", "cloud_engineer"}:
                    print(
                        f"[{cid}] CAPPED_COVERAGE={coverage_score} | "
                        f"LGBM_SCORE={lgbm_score} | PROB={p:.4f} | "
                        f"SCORE_CAP={score_cap} | FINAL={blended}"
                    )

                item["probability"] = p
                item["score"] = blended

    # remove internal debug-only fields from API response
    for item in ranked:
        item.pop("_debugMissingPenalty", None)
        item.pop("_debugScoreCap", None)

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {"rankedCareers": ranked, "careers": ranked, "ranked": ranked}

@app.post("/gap-priority")
def gap_priority(req: GapPriorityRequest):
    out = []
    for g in req.gaps:
        gap = int(g.get("gap", 0))
        importance = float(g.get("importance", 1.0))

        if gap_model:
            X = np.array([[gap, importance, int(g.get("required", 0))]], dtype=np.float32)
            pred = int(gap_model.predict(X)[0])
            priority = ["Low", "Medium", "High"][max(0, min(2, pred))]
        else:
            score = gap * importance
            if score >= 120:
                priority = "High"
            elif score >= 60:
                priority = "Medium"
            else:
                priority = "Low"

        p = str(priority).strip().lower()
        if "high" in p:
            priority = "High"
        elif "medium" in p:
            priority = "Medium"
        else:
            priority = "Low"

        item = dict(g)
        item["priority"] = priority
        out.append(item)

    rank = {"High": 3, "Medium": 2, "Low": 1}
    out.sort(key=lambda x: rank.get(x.get("priority", "Low"), 1), reverse=True)

    top = [x.get("skill") for x in out[:5]]
    return {"careerId": req.careerId, "gaps": out, "topGapsToFixFirst": top}


@app.post("/recommend")
def recommend(req: RecommendRequest):
    topk = int(req.topK or 5)

    if not reco_bundle:
        courses_out, proj_out = _fallback_recommend(req.missingSkills, topk)
        return {"careerId": req.careerId, "courses": courses_out, "projects": proj_out}

    courses = reco_bundle["courses"]
    projects = reco_bundle["projects"]
    course_vec = reco_bundle["course_vec"]
    project_vec = reco_bundle["project_vec"]
    vectorizer = reco_bundle["vectorizer"]

    query = " ".join(req.missingSkills).lower().strip()
    qv = vectorizer.transform([query])

    course_scores = (qv @ course_vec.T).toarray()[0]
    proj_scores = (qv @ project_vec.T).toarray()[0]

    provider = _infer_cloud_provider(req)
    level = _infer_level(req, provider)

    def boost_score(item: Dict[str, Any], base: float) -> float:
        if base <= 0:
            return base
        doc = _doc_text(item)
        if provider:
            if provider in doc:
                base *= 1.35
            else:
                base *= 0.95
        if level:
            lv = level.lower()
            if lv in doc:
                base *= 1.25
        return base

    boosted_course_scores = np.array([boost_score(courses[i], float(course_scores[i])) for i in range(len(courses))])
    boosted_proj_scores = np.array([boost_score(projects[i], float(proj_scores[i])) for i in range(len(projects))])

    course_idx = np.argsort(-boosted_course_scores)[:topk]
    proj_idx = np.argsort(-boosted_proj_scores)[:topk]

    course_out = [courses[i] for i in course_idx if boosted_course_scores[i] > 0]
    proj_out = [projects[i] for i in proj_idx if boosted_proj_scores[i] > 0]

    return {"careerId": req.careerId, "courses": course_out, "projects": proj_out}


@app.post("/log-career-feedback")
def log_career_feedback(req: CareerFeedbackRequest):
    os.makedirs(os.path.dirname(FEEDBACK_LOG), exist_ok=True)

    row = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "careerId": str(req.careerId).strip(),
        "event": str(req.event or "select").strip(),
        "skills": [
            {"name": norm_skill(s.name), "proficiency": int(s.proficiency or 0)}
            for s in (req.skills or [])
        ],
        "meta": req.meta or {},
    }

    with open(FEEDBACK_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")

    return {"ok": True}