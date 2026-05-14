import os
import re
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))  # mentormind/
CLIENT_CONSTANTS = os.path.join(ROOT, "client", "src", "data", "constants.js")
OUT_JSON = os.path.join(ROOT, "ml_service", "data", "careers_seed.json")

def norm(s: str) -> str:
    return str(s or "").strip().lower()

def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def extract_career_paths_block(js: str) -> str:
    # crude but works for your file: find "export const CAREER_PATHS = [ ... ];"
    m = re.search(r"export\s+const\s+CAREER_PATHS\s*=\s*(\[[\s\S]*?\n\]);", js)
    if not m:
        raise RuntimeError("Could not find 'export const CAREER_PATHS = [...]' block in constants.js")
    return m.group(1)

def js_object_array_to_json(text: str) -> str:
    """
    Convert a JS array of objects into JSON:
    - replace unquoted keys with quoted keys
    - convert single quotes to double quotes (your file uses double quotes already)
    - remove trailing commas
    """
    # quote keys: { id: "x" } -> { "id": "x" }
    text = re.sub(r'(\{|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1 "\2":', text)

    # remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)

    return text

def main():
    if not os.path.exists(CLIENT_CONSTANTS):
        raise FileNotFoundError(f"Missing: {CLIENT_CONSTANTS}")

    js = read_file(CLIENT_CONSTANTS)
    block = extract_career_paths_block(js)
    jsonish = js_object_array_to_json(block)

    try:
        careers = json.loads(jsonish)
    except Exception as e:
        raise RuntimeError(f"Failed to parse CAREER_PATHS as JSON. Error: {e}")

    out = []
    for c in careers:
        req = c.get("requiredSkills", []) or []
        seed_req = []

        for r in req:
            # anyOf groups
            if isinstance(r, dict) and r.get("type") == "anyOf":
                opts = r.get("options") or []
                seed_req.append({
                    "type": "anyOf",
                    "label": r.get("label") or "One of",
                    "options": [norm(x) for x in opts if str(x).strip()],
                    "requiredProficiency": int(r.get("proficiency") or r.get("requiredProficiency") or 60),
                    "importance": float(r.get("weight") or r.get("importance") or 1.0),
                })
                continue

            # normal skill
            name = r.get("name") or r.get("skill")
            if not name:
                continue
            seed_req.append({
                "skill": norm(name),
                "requiredProficiency": int(r.get("proficiency") or r.get("requiredProficiency") or 60),
                "importance": float(r.get("weight") or r.get("importance") or 1.0),
            })

        out.append({
            "id": c.get("id"),
            "title": c.get("title"),
            "keywords": [norm(x) for x in (c.get("keywords") or [])],
            "requiredSkills": seed_req,
        })

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print("✅ Exported:", OUT_JSON)
    print("   Careers:", len(out))

if __name__ == "__main__":
    main()
