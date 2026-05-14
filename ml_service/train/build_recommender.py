import os
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer


def main():
    # ✅ Always resolve paths based on THIS file's location
    here = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.normpath(os.path.join(here, "..", "data"))

    COURSES = os.path.join(data_dir, "courses_db.json")
    PROJECTS = os.path.join(data_dir, "projects_db.json")
    OUT = os.path.join(data_dir, "recommender.pkl")

    if not os.path.exists(COURSES):
        raise FileNotFoundError(f"Missing courses_db.json at: {COURSES}")
    if not os.path.exists(PROJECTS):
        raise FileNotFoundError(f"Missing projects_db.json at: {PROJECTS}")

    courses = json.load(open(COURSES, "r", encoding="utf-8"))
    projects = json.load(open(PROJECTS, "r", encoding="utf-8"))

    def course_text(c):
        title = str(c.get("title", ""))
        skills = " ".join([str(s) for s in (c.get("skills", []) or [])])
        level = str(c.get("level", ""))
        provider = str(c.get("provider", ""))
        platform = str(c.get("platform", ""))
        cert = str(c.get("cert_name", "")) if c.get("certification") else ""
        return f"{title} {skills} {level} {provider} {platform} {cert}".lower()

    def project_text(p):
        title = str(p.get("title", ""))
        skills = " ".join([str(s) for s in (p.get("skills", []) or [])])
        level = str(p.get("level", ""))
        return f"{title} {skills} {level}".lower()

    course_docs = [course_text(c) for c in courses]
    project_docs = [project_text(p) for p in projects]

    vectorizer = TfidfVectorizer(stop_words="english")
    X = vectorizer.fit_transform(course_docs + project_docs)

    course_vec = X[: len(courses)]
    project_vec = X[len(courses) :]

    bundle = {
        "vectorizer": vectorizer,
        "courses": courses,
        "projects": projects,
        "course_vec": course_vec,
        "project_vec": project_vec,
    }

    joblib.dump(bundle, OUT)
    print(f"✅ Saved recommender to: {OUT}")
    print(f"   Courses: {len(courses)} | Projects: {len(projects)}")


if __name__ == "__main__":
    main()