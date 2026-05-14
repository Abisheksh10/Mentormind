export function signOutUser(setProfile, navigateToDashboard) {
  // clear stored data
  localStorage.removeItem("mm_profile");
  localStorage.removeItem("mm_skills");
  localStorage.removeItem("mm_academics");
  localStorage.removeItem("mm_careers");
  localStorage.removeItem("mm_simulation_cache");

  // reset profile state
  setProfile((prev) => ({
    ...prev,
    studentId: "",
    studentName: "abishhek",
    major: "Computer Science",
    academicYear: "Freshman (1st Year)",
    email: "abishek@gmail.com",
    linkedin: "",
    bio: "Welcome to your Digital Twin! Edit your profile to get started.",
    gpa: 0,
    skills: [],
    semesters: [],
    certifications: [],
    targetCareerId: "data_scientist",
  }));

  // redirect
  if (navigateToDashboard) navigateToDashboard();
}
