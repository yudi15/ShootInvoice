import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className={`theme-toggle-btn focus:outline-none focus:ring-2 focus:ring-gray-200
        ${
          mode === "dark"
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      {mode === "dark" ? "🌞" : "🌙"}
      <span className="theme-toggle-text">
        {mode === "dark" ? "Enable Light Mode" : "Enable Dark Mode"}
      </span>
    </button>
  );
}
