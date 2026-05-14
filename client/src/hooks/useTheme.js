import { useEffect, useState } from "react";

/**
 * ✅ Theme handling (Dark by default)
 * - Stores theme in localStorage
 * - Adds theme class to <html>
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("mm_theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("mm_theme", theme);

    // Apply class to <html>
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}
