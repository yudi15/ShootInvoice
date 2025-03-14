import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  const handleClick = () => {
    console.log("Before toggle - Current mode:", mode);
    toggleTheme();
    // Note: mode won't update immediately due to React state updates
    console.log(
      "After toggle - Will change to:",
      mode === "light" ? "dark" : "light"
    );
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200
        ${
          mode === "dark"
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
    >
      {mode === "dark" ? "🌞 Light" : "🌙 Dark"}
    </button>
  );
}
