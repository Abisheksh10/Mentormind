# import json
# import os
# import random
# import numpy as np
# import joblib

# # pip install lightgbm
# from lightgbm import LGBMClassifier

# HERE = os.path.dirname(os.path.abspath(__file__))

# CAREERS_JSON = os.path.normpath(os.path.join(HERE, "..", "data", "careers_seed.json"))
# OUT_MODEL = os.path.normpath(os.path.join(HERE, "..", "models", "career_ranker.pkl"))
# OUT_ENCODER = os.path.normpath(os.path.join(HERE, "..", "models", "skill_encoder.pkl"))

# def norm(s: str) -> str:
#     return str(s or "").strip().lower()

# def clamp01(x: float) -> float:
#     return max(0.0, min(1.0, float(x)))

# def build_all_skills(careers):
#     skills = set()
#     for c in careers:
#         for r in c.get("requiredSkills", []):
#             if r.get("type") == "anyOf":
#                 for opt in r.get("options", []):
#                     skills.add(norm(opt))
#             else:
#                 skills.add(norm(r.get("skill")))
#     return sorted([s for s in skills if s])

# def correlated_boosts(vec, idx):
#     """Add realistic correlations without making data too noisy."""
#     def has(skill, thr=0.3):
#         i = idx.get(skill)
#         return i is not None and vec[i] >= thr

#     def bump(skill, lo=0.35, hi=0.85):
#         i = idx.get(skill)
#         if i is None: return
#         vec[i] = max(vec[i], random.uniform(lo, hi))

#     # Docker ↔ Linux
#     if has("docker"):
#         bump("linux", 0.35, 0.80)

#     # DevOps-ish
#     if has("kubernetes"):
#         bump("docker", 0.55, 0.90)
#         bump("linux", 0.45, 0.90)

#     # Cloud provider -> networking + linux often appears
#     if has("aws") or has("azure") or has("gcp"):
#         bump("networking", 0.30, 0.75)
#         bump("linux", 0.30, 0.80)

#     # Backend -> rest api
#     if has("django") or has("fastapi") or has("express") or has("node.js"):
#         bump("rest api", 0.40, 0.90)

#     # ML -> mlops sometimes
#     if has("machine learning"):
#         bump("mlops", 0.20, 0.70)

# def generate_sample_for_career(career, all_skills, idx):
#     """Create one realistic skill vector for a chosen career."""
#     vec = np.zeros(len(all_skills), dtype=np.float32)

#     for r in career.get("requiredSkills", []):
#         reqp = int(r.get("requiredProficiency", 60))
#         target = clamp01((reqp + random.randint(-15, 15)) / 100.0)

#         if r.get("type") == "anyOf":
#             opts = [norm(x) for x in r.get("options", [])]
#             opts = [o for o in opts if o in idx]
#             if opts:
#                 chosen = random.choice(opts)
#                 vec[idx[chosen]] = max(vec[idx[chosen]], target)
#                 # sometimes partially know another option
#                 if random.random() < 0.25 and len(opts) > 1:
#                     other = random.choice([o for o in opts if o != chosen])
#                     vec[idx[other]] = max(vec[idx[other]], target * random.uniform(0.4, 0.8))
#         else:
#             sk = norm(r.get("skill"))
#             if sk in idx:
#                 vec[idx[sk]] = max(vec[idx[sk]], target)

#     # add correlations
#     correlated_boosts(vec, idx)

#     # add small noise skills
#     for _ in range(random.randint(0, 4)):
#         sk = random.choice(all_skills)
#         vec[idx[sk]] = max(vec[idx[sk]], random.uniform(0.15, 0.6))

#     return vec

# def build_dataset(careers, all_skills, n_samples=8000):
#     X, y = [], []
#     career_ids = [c["id"] for c in careers]
#     idx = {s: i for i, s in enumerate(all_skills)}

#     for _ in range(n_samples):
#         c = random.choice(careers)
#         vec = generate_sample_for_career(c, all_skills, idx)
#         X.append(vec)
#         y.append(career_ids.index(c["id"]))

#     return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64), career_ids

# def main():
#     with open(CAREERS_JSON, "r", encoding="utf-8") as f:
#         careers = json.load(f)

#     all_skills = build_all_skills(careers)
#     X, y, career_ids = build_dataset(careers, all_skills, n_samples=10000)

#     # ✅ small + efficient model
#     model = LGBMClassifier(
#         objective="multiclass",
#         n_estimators=250,
#         learning_rate=0.06,
#         num_leaves=31,
#         max_depth=-1,
#         min_child_samples=40,
#         subsample=0.9,
#         colsample_bytree=0.9,
#         reg_lambda=1.0,
#         random_state=42
#     )

#     model.fit(X, y)

#     os.makedirs(os.path.dirname(OUT_MODEL), exist_ok=True)
#     joblib.dump(model, OUT_MODEL)
#     joblib.dump({"all_skills": all_skills, "all_careers": career_ids}, OUT_ENCODER)

#     print("✅ Saved:", OUT_MODEL)
#     print("✅ Saved:", OUT_ENCODER)
#     print("Skills:", len(all_skills), "Careers:", len(career_ids))

# if __name__ == "__main__":
#     main()
