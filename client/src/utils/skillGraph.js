// A small knowledge graph to correct scoring strength.
// Example: If user has React skill, they must have HTML/CSS/JS at some baseline.
// This avoids wrong scoring like "React 80 but HTML 0".

export const SKILL_GRAPH = {
  react: {
    implies: [
      { name: "html", min: 55 },
      { name: "css", min: 50 },
      { name: "javascript", min: 60 },
    ],
  },

  "tailwind css": {
    implies: [{ name: "css", min: 55 }],
  },

  node: {
    implies: [{ name: "javascript", min: 65 }],
  },

  typescript: {
    implies: [{ name: "javascript", min: 70 }],
  },

  nextjs: {
    implies: [
      { name: "react", min: 70 },
      { name: "javascript", min: 65 },
    ],
  },

  django: {
    implies: [{ name: "python", min: 65 }],
  },

  flask: {
    implies: [{ name: "python", min: 60 }],
  },

  "aws": {
    implies: [{ name: "cloud", min: 55 }],
  },
};

export const SKILL_ALIASES = {
  js: "javascript",
  ts: "typescript",
  tailwind: "tailwind css",
  "react.js": "react",
  "node.js": "node",
};
