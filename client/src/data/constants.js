// client/src/data/constants.js

export const CAREER_PATHS = [
  {
    id: "frontend_dev",
    title: "Frontend Developer",
    description: "Build modern UI experiences with frameworks, accessibility, and performance.",
    salaryRange: "₹6 LPA - ₹22 LPA",
    requiredSkills: [
      {
        type: "anyOf",
        label: "Frontend Framework",
        options: ["React", "Angular", "Vue"],
        proficiency: 75,
        weight: 1.3,
        category: "frontend",
      },
      { name: "JavaScript", proficiency: 70, weight: 1.2, category: "frontend" },
      { name: "HTML", proficiency: 65, weight: 0.6, category: "frontend" },
      { name: "CSS", proficiency: 65, weight: 0.6, category: "frontend" },
      { name: "Tailwind", proficiency: 60, weight: 0.7, category: "frontend" },
      { name: "Git", proficiency: 55, weight: 0.6, category: "tools" },
    ],
  },

  {
    id: "fullstack_dev",
    title: "Full Stack Developer",
    description: "Develop end-to-end apps with frontend + backend + databases + deployment.",
    salaryRange: "₹8 LPA - ₹28 LPA",
    requiredSkills: [
      {
        type: "anyOf",
        label: "Frontend Framework",
        options: ["React", "Angular", "Vue"],
        proficiency: 70,
        weight: 1.0,
        category: "frontend",
      },

      { name: "Node.js", proficiency: 70, weight: 1.2, category: "backend" },
      { name: "Express", proficiency: 65, weight: 1.0, category: "backend" },

      {
        type: "anyOf",
        label: "Database",
        options: ["MongoDB", "PostgreSQL", "MySQL"],
        proficiency: 60,
        weight: 0.9,
        category: "database",
      },
      {
        type: "anyOf",
        label: "Backend Framework",
        options: ["Django", "FastAPI", "Express"],
        proficiency: 60,
        weight: 1.1,
        category: "backend",
      },
      { name: "Git", proficiency: 55, weight: 0.6, category: "tools" },
      { name: "Docker", proficiency: 50, weight: 0.7, category: "devops" },
    ],
  },

  {
    id: "backend_dev",
    title: "Backend Developer",
    description: "Build scalable APIs, database systems, and business logic.",
    salaryRange: "₹7 LPA - ₹26 LPA",
    requiredSkills: [
      {
        type: "anyOf",
        label: "Backend Language",
        options: ["Python", "JavaScript","Springboot"],
        proficiency: 65,
        weight: 1.0,
        category: "backend",
      },
      {
        type: "anyOf",
        label: "Backend Framework",
        options: ["Django", "FastAPI", "Express"],
        proficiency: 60,
        weight: 1.1,
        category: "backend",
      },
      {
        type: "anyOf",
        label: "Database",
        options: ["PostgreSQL", "MySQL", "MongoDB"],
        proficiency: 65,
        weight: 1.1,
        category: "database",
      },
      { name: "REST API", proficiency: 70, weight: 1.2, category: "backend" },
      { name: "Git", proficiency: 55, weight: 0.6, category: "tools" },
      { name: "Docker", proficiency: 55, weight: 0.7, category: "devops" },
    ],
  },

  {
    id: "qa_automation",
    title: "QA Automation Engineer",
    description: "Automate testing and prevent regressions in releases.",
    salaryRange: "₹5 LPA - ₹18 LPA",
    requiredSkills: [
      {
        type: "anyOf",
        label: "Automation Language",
        options: ["Python", "Java", "JavaScript"],
        proficiency: 60,
        weight: 1.0,
        category: "testing",
      },
      {
        type: "anyOf",
        label: "UI Automation Tool",
        options: ["Selenium", "Playwright", "Cypress"],
        proficiency: 60,
        weight: 1.1,
        category: "testing",
      },
      { name: "API Testing", proficiency: 65, weight: 1.1, category: "testing" },
      { name: "Git", proficiency: 55, weight: 0.6, category: "tools" },
      { name: "CI/CD", proficiency: 50, weight: 0.9, category: "devops" },
    ],
  },

  {
    id: "devops_engineer",
    title: "DevOps Engineer",
    description: "Automate deployments, manage infrastructure, and ensure reliability.",
    salaryRange: "₹10 LPA - ₹35 LPA",
    requiredSkills: [
      { name: "Linux", proficiency: 70, weight: 1.2, category: "devops" },
      { name: "Docker", proficiency: 75, weight: 1.3, category: "devops" },
      { name: "Kubernetes", proficiency: 60, weight: 1.3, category: "devops" },
      { name: "Git", proficiency: 65, weight: 0.7, category: "tools" },
      { name: "CI/CD", proficiency: 65, weight: 1.2, category: "devops" },
      { name: "Monitoring", proficiency: 55, weight: 1.0, category: "devops" },

      {
        type: "anyOf",
        label: "Cloud Provider",
        options: ["AWS", "Azure", "GCP"],
        proficiency: 60,
        weight: 1.2,
        category: "cloud",
      },
    ],
  },

  {
    id: "cloud_engineer",
    title: "Cloud Engineer",
    description: "Design cloud architecture, deploy apps, and manage cloud services securely.",
    salaryRange: "₹10 LPA - ₹38 LPA",
    requiredSkills: [
      {
        type: "anyOf",
        label: "Cloud Provider",
        options: ["AWS", "Azure", "GCP"],
        proficiency: 75,
        weight: 1.4,
        category: "cloud",
      },
      { name: "Linux", proficiency: 65, weight: 1.1, category: "devops" },
      { name: "Networking", proficiency: 60, weight: 1.1, category: "cloud" },
      { name: "Docker", proficiency: 60, weight: 1.1, category: "devops" },
      { name: "Security", proficiency: 55, weight: 1.0, category: "cloud" },
    ],
  },

  {
    id: "cybersecurity_analyst",
    title: "Cybersecurity Analyst",
    description: "Protect systems, detect threats, and improve security posture.",
    salaryRange: "₹8 LPA - ₹28 LPA",
    requiredSkills: [
      { name: "Networking", proficiency: 70, weight: 1.3, category: "security" },
      { name: "Linux", proficiency: 65, weight: 1.2, category: "security" },
      { name: "Security", proficiency: 75, weight: 1.4, category: "security" },
      { name: "OWASP", proficiency: 55, weight: 1.0, category: "security" },
    ],
  },

  {
    id: "data_analyst",
    title: "Data Analyst",
    description: "Analyze data, create dashboards, and generate insights.",
    salaryRange: "₹6 LPA - ₹20 LPA",
    requiredSkills: [
      { name: "SQL", proficiency: 70, weight: 1.3, category: "data" },
      { name: "Python", proficiency: 60, weight: 1.1, category: "data" },
      { name: "Data Visualization", proficiency: 65, weight: 1.2, category: "data" },
      { name: "Statistics", proficiency: 50, weight: 0.9, category: "data" },
    ],
  },

  {
    id: "ml_engineer",
    title: "Machine Learning Engineer",
    description: "Train, deploy, and optimize ML models for real-world systems.",
    salaryRange: "₹14 LPA - ₹45 LPA",
    requiredSkills: [
      { name: "Python", proficiency: 75, weight: 1.2, category: "ml" },
      { name: "Machine Learning", proficiency: 80, weight: 1.4, category: "ml" },
      {
        type: "anyOf",
        label: "Deep Learning Framework",
        options: ["PyTorch", "TensorFlow"],
        proficiency: 60,
        weight: 1.0,
        category: "ml",
      },
      { name: "Docker", proficiency: 60, weight: 1.0, category: "devops" },
      { name: "MLOps", proficiency: 55, weight: 1.0, category: "ml" },
    ],
  },
];


// ✅ Primary Skills Allowlist (used by Gemini extraction)
// Includes: normal skills + anyOf options + labels (optional)
export const PRIMARY_SKILLS = Array.from(
  new Set(
    CAREER_PATHS.flatMap((c) =>
      (c.requiredSkills || []).flatMap((r) => {
        // anyOf group
        if (r?.type === "anyOf" && Array.isArray(r.options)) {
          return [
            ...(r.options || []),    // React / AWS / MongoDB etc
            r.label,                 // optional group label like "Cloud Provider"
          ].filter(Boolean);
        }

        // normal skill
        return [r?.name || r?.skill].filter(Boolean);
      })
    )
  )
).sort();
