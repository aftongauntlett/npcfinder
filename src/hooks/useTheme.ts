import React, { useContext } from "react";

type ThemeOption = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeOption;
  resolvedTheme: ResolvedTheme;
  themeColor: string; // Hex color string
  secondaryThemeColor: string | null;
  autoSecondaryColor: boolean;
  changeTheme: (newTheme: ThemeOption) => void;
  changeThemeColor: (newColor: string) => void; // Accepts hex color
  changeSecondaryThemeColor: (newColor: string | null) => void;
  changeAutoSecondaryColor: (auto: boolean) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
