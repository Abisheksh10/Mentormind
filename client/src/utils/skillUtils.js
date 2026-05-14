export function mergeSkills(existingSkills = [], newSkills = [], options = {}) {
  const { allowedSkills = null } = options || {};

  // Build allowlist set (case-insensitive) if provided
  const allow =
    Array.isArray(allowedSkills) && allowedSkills.length
      ? new Set(allowedSkills.map((s) => normalizeKey(s)))
      : null;

  const map = new Map();

  // Helper to clamp proficiency
  const clamp = (v) => Math.max(0, Math.min(100, Number(v || 0)));

  // Prefer stable display name if the skill already exists
  const upsert = (incoming) => {
    if (!incoming?.name) return;

    const key = normalizeKey(incoming.name);
    if (!key) return;

    // If allowlist exists, ignore non-primary / unknown skills
    if (allow && !allow.has(key)) return;

    const incomingProf = clamp(incoming.proficiency);
    const incomingCat = incoming.category;

    if (!map.has(key)) {
      map.set(key, {
        name: String(incoming.name).trim(), // display name
        proficiency: incomingProf,
        category: incomingCat || "technical",
      });
      return;
    }

    const old = map.get(key);

    map.set(key, {
      // keep old display name (more consistent in UI)
      ...old,
      // ✅ never reduce proficiency
      proficiency: Math.max(clamp(old.proficiency), incomingProf),
      // keep old category unless incoming provides one
      category: incomingCat || old.category || "technical",
    });
  };

  // 1) Load existing first (authoritative display names)
  for (const s of existingSkills || []) upsert(s);

  // 2) Merge new
  for (const s of newSkills || []) upsert(s);

  return Array.from(map.values()).sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0));
}

/**
 * Normalize skill names so minor variants map to same key
 * - lowercases
 * - trims
 * - removes most punctuation/spaces differences
 * - keeps dots for common tech like "node.js" by collapsing sequences
 */
function normalizeKey(name) {
  const raw = String(name || "").trim().toLowerCase();
  if (!raw) return "";

  // normalize common separators (space, underscore, hyphen) to single space
  const spaced = raw.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();

  // collapse "node js" -> "node.js" style key WITHOUT hardcoding career-specific skills:
  // generally: if a token is very short like "js", "ts", keep as token; then join with '.'
  // But to avoid over-aggressive transforms, we just remove spaces around dots and keep dots if present.
  const keepDots = spaced.replace(/\s*\.\s*/g, ".");

  // remove characters that cause duplicates but keep + # . (c++, c#, node.js)
  const cleaned = keepDots.replace(/[^a-z0-9\+\#\. ]/g, "").replace(/\s+/g, " ").trim();

  return cleaned;
}
