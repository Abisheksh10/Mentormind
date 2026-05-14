export function computeCumulativeGPA(semesters = []) {
  if (!semesters.length) return 0;

  // Weighted GPA by credits
  let totalCredits = 0;
  let weightedSum = 0;

  for (const s of semesters) {
    const gpa = Number(s.gpa || 0);
    const credits = Number(s.credits || 0);
    totalCredits += credits;
    weightedSum += gpa * credits;
  }

  if (totalCredits === 0) return 0;

  const result = weightedSum / totalCredits;
  return Number(result.toFixed(2));
}
