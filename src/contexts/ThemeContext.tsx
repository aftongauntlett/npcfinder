import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ThemeContext } from "../hooks/useTheme";
import {
  DEFAULT_THEME_COLOR,
  createColorVariations,
} from "../styles/colorThemes";
import { logger } from "@/lib/logger";

type ThemeOption = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [themeColor, setThemeColor] = useState<string>(DEFAULT_THEME_COLOR);

  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem("theme") as ThemeOption | null;
        if (savedTheme) {
          setTheme(savedTheme);
        }

        const savedColor = localStorage.getItem("themeColor");
        if (savedColor) {
          // Validate hex color format
          if (/^#[0-9A-Fa-f]{6}$/.test(savedColor)) {
            setThemeColor(savedColor);
          }
        }
      } catch (error) {
        logger.error("Failed to load theme from localStorage", { error });
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
    const colorVariations = createColorVariations(themeColor);
    const root = document.documentElement;

    root.style.setProperty("--color-primary", colorVariations.primary);
    root.style.setProperty("--color-primary-dark", colorVariations.primaryDark);
    root.style.setProperty(
      "--color-primary-light",
      colorVariations.primaryLight
    );
    root.style.setProperty("--color-primary-pale", colorVariations.primaryPale);
    root.style.setProperty("--color-primary-ring", colorVariations.primaryRing);
    root.style.setProperty(
      "--color-text-on-primary",
      colorVariations.textOnPrimary
    );

    root.style.setProperty("--color-secondary", colorVariations.secondary);
    root.style.setProperty(
      "--color-secondary-dark",
      colorVariations.secondaryDark
    );
    root.style.setProperty(
      "--color-secondary-light",
      colorVariations.secondaryLight
    );
    root.style.setProperty(
      "--color-secondary-pale",
      colorVariations.secondaryPale
    );
    root.style.setProperty(
      "--color-secondary-ring",
      colorVariations.secondaryRing
    );
    root.style.setProperty(
      "--color-text-on-secondary",
      colorVariations.textOnSecondary
    );

    // CSS variables update automatically without forced reflow
    // Removed: void root.offsetHeight; (force repaint)
  }, [themeColor]);
  const changeTheme = useCallback((newTheme: ThemeOption) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      logger.error("Failed to save theme to localStorage", { error, newTheme });
    }
  }, []);

  const changeThemeColor = useCallback((newColor: string) => {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      setThemeColor(newColor);
      try {
        localStorage.setItem("themeColor", newColor);
      } catch (error) {
        logger.error("Failed to save theme color to localStorage", {
          error,
          newColor,
        });
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      themeColor,
      changeTheme,
      changeThemeColor,
    }),
    [theme, resolvedTheme, themeColor, changeTheme, changeThemeColor]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
