import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("theme");
    console.log("Initial theme mode:", savedMode || "not set");
    if (savedMode) return savedMode;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    console.log("System prefers dark mode:", systemDark);
    return systemDark ? "dark" : "light";
  });

  useEffect(() => {
    console.log("Theme changing to:", mode);
    localStorage.setItem("theme", mode);

    // Update both HTML and document element classes
    const html = document.querySelector("html");
    const doc = document.documentElement;

    console.log("Before change - HTML classList:", html.classList.toString());

    // Remove both light and dark classes from both elements
    html.classList.remove("light", "dark");
    doc.classList.remove("light", "dark");

    // Add the new theme class to both elements
    html.classList.add(mode);
    doc.classList.add(mode);

    console.log("After change - HTML classList:", html.classList.toString());
    console.log(
      "HTML background color:",
      window.getComputedStyle(html).backgroundColor
    );
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "light" ? "dark" : "light";
      console.log("Toggling theme from", prevMode, "to", newMode);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
