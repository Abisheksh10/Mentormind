import os
import json
import random
import numpy as np
import joblib

# pip install lightgbm
import lightgbm as lgb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))

CAREERS_JSON = os.path.join(ROOT, "ml_service", "data", "careers_seed.json")
OUT_MODEL = os.path.join(ROOT, "ml_service", "models", "career_ranker.pkl")
OUT_ENCODER = os.path.join(ROOT, "ml_service", "models", "skill_encoder.pkl")

FEEDBACK_LOG = os.path.join(ROOT, "ml_service", "data", "career_feedback.jsonl")


def norm(x):
    return str(x or "").strip().lower()

def clamp01(v):
    try:
        v = float(v)
    except:
        return 0.0
    return max(0.0, min(1.0, v))


def collect_all_skills(careers):
    skills = set()
    for c in careers:
        for r in c.get("requiredSkills", []):
            if r.get("type") == "anyOf" and isinstance(r.get("options"), list):
                for opt in r["options"]:
                    skills.add(norm(opt))
            else:
                skills.add(norm(r.get("skill")))
    return sorted(skills)


def build_synthetic_dataset(careers, all_skills, n_samples=15000):
    """
    Career-conditioned synthetic:
    - pick a target career
    - generate a skill vector that somewhat satisfies its requirements
    """
    idx_skill = {s: i for i, s in enumerate(all_skills)}
    career_ids = [c["id"] for c in careers]
    y_map = {cid: i for i, cid in enumerate(career_ids)}

    X, y = [], []

    for _ in range(n_samples):
        c = random.choice(careers)
        vec = np.zeros(len(all_skills), dtype=np.float32)

        for r in c.get("requiredSkills", []):
            reqp = int(r.get("requiredProficiency", 0) or 0)
            target = clamp01((reqp / 100.0) + random.uniform(-0.10, 0.20))

            if r.get("type") == "anyOf" and isinstance(r.get("options"), list):
                opt = norm(random.choice(r["options"]))
                if opt in idx_skill:
                    vec[idx_skill[opt]] = max(vec[idx_skill[opt]], target)
            else:
                sk = norm(r.get("skill"))
                if sk in idx_skill:
                    vec[idx_skill[sk]] = max(vec[idx_skill[sk]], target)

        # add some noise skills
        for s in all_skills:
            if random.random() < 0.08:
                vec[idx_skill[s]] = max(vec[idx_skill[s]], random.uniform(0.1, 0.8))

        X.append(vec)
        y.append(y_map[c["id"]])

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64), career_ids


def load_real_feedback(all_skills, career_ids, max_rows=20000):
    idx = {s: i for i, s in enumerate(all_skills)}
    y_map = {cid: i for i, cid in enumerate(career_ids)}

    Xr, yr = [], []
    if not os.path.exists(FEEDBACK_LOG):
        return np.zeros((0, len(all_skills)), dtype=np.float32), np.zeros((0,), dtype=np.int64)

    with open(FEEDBACK_LOG, "r", encoding="utf-8") as f:
        for line in f:
            if len(Xr) >= max_rows:
                break
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except:
                continue

            cid = str(row.get("careerId") or "").strip()
            if cid not in y_map:
                continue

            vec = np.zeros(len(all_skills), dtype=np.float32)
            for sk in row.get("skills", []) or []:
                nm = norm(sk.get("name"))
                if nm in idx:
                    vec[idx[nm]] = clamp01((int(sk.get("proficiency") or 0)) / 100.0)

            Xr.append(vec)
            yr.append(y_map[cid])

    if not Xr:
        return np.zeros((0, len(all_skills)), dtype=np.float32), np.zeros((0,), dtype=np.int64)

    return np.array(Xr, dtype=np.float32), np.array(yr, dtype=np.int64)


def main():
    os.makedirs(os.path.join(ROOT, "ml_service", "models"), exist_ok=True)

    careers = json.load(open(CAREERS_JSON, "r", encoding="utf-8"))

    all_skills = collect_all_skills(careers)
    X_syn, y_syn, career_ids = build_synthetic_dataset(careers, all_skills, n_samples=15000)
    X_real, y_real = load_real_feedback(all_skills, career_ids)

    if len(X_real) > 0:
        # duplicate real to give it higher weight
        X = np.vstack([X_real, X_real, X_syn])
        y = np.concatenate([y_real, y_real, y_syn])
        print(f"✅ Loaded real feedback rows: {len(X_real)} (weighted x2)")
    else:
        X, y = X_syn, y_syn
        print("⚠ No real feedback found; training purely on synthetic data")

    # LightGBM multiclass classifier
    clf = lgb.LGBMClassifier(
        objective="multiclass",
        num_class=len(career_ids),
        n_estimators=350,
        learning_rate=0.08,
        max_depth=6,
        num_leaves=31,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        random_state=42,
    )
    clf.fit(X, y)

    joblib.dump(clf, OUT_MODEL)
    joblib.dump({"all_skills": all_skills, "all_careers": career_ids}, OUT_ENCODER)

    print("✅ Saved:", OUT_MODEL)
    print("✅ Saved:", OUT_ENCODER)
    print(f"✅ Model skills: {len(all_skills)} | careers: {len(career_ids)}")


if __name__ == "__main__":
    main()
