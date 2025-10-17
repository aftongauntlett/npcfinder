import React, { useEffect, useState } from "react";
import { ThemeContext } from "../hooks/useTheme";
import { type ThemeColorName, getTheme } from "../styles/colorThemes";

type ThemeOption = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [themeColor, setThemeColor] = useState<ThemeColorName>("purple");

  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem("theme") as ThemeOption | null;
        if (savedTheme) {
          setTheme(savedTheme);
        }

        const savedColor = localStorage.getItem(
          "themeColor"
        ) as ThemeColorName | null;
        if (savedColor) {
          setThemeColor(savedColor);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateResolvedTheme);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Apply theme color CSS custom properties
  useEffect(() => {
    const colorTheme = getTheme(themeColor);
    const root = document.documentElement;

    root.style.setProperty("--color-primary", colorTheme.primary);
    root.style.setProperty("--color-primary-dark", colorTheme.primaryDark);
    root.style.setProperty("--color-primary-light", colorTheme.primaryLight);
    root.style.setProperty("--color-primary-pale", colorTheme.primaryPale);
    root.style.setProperty("--color-primary-ring", colorTheme.primaryRing);
    root.style.setProperty("--color-text-on-primary", colorTheme.textOnPrimary);
  }, [themeColor]);

  const changeTheme = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const changeThemeColor = (newColor: ThemeColorName) => {
    setThemeColor(newColor);
    try {
      localStorage.setItem("themeColor", newColor);
    } catch (error) {
      console.error("Failed to save theme color:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        themeColor,
        changeTheme,
        changeThemeColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
