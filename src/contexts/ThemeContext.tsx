import React, { useEffect, useState } from "react";
import db from "../lib/database";
import { ThemeContext } from "../hooks/useTheme";

type ThemeOption = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await db.settings.get(1);
        if (settings?.theme) {
          setTheme(settings.theme as ThemeOption);
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

  const changeTheme = async (newTheme: ThemeOption) => {
    setTheme(newTheme);
    try {
      await db.settings.update(1, {
        theme: newTheme,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
