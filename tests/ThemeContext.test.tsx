import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { useTheme } from "../src/hooks/useTheme";

// Define mock functions before vi.mock calls
const mockDbGet = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbPut = vi.fn();

// Mock the database
vi.mock("../src/lib/database", () => ({
  default: {
    settings: {
      get: (...args: unknown[]) => mockDbGet(...args),
      update: (...args: unknown[]) => mockDbUpdate(...args),
      put: (...args: unknown[]) => mockDbPut(...args),
    },
  },
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, resolvedTheme, changeTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => void changeTheme("dark")}>Change to Dark</button>
      <button onClick={() => void changeTheme("light")}>Change to Light</button>
      <button onClick={() => void changeTheme("system")}>
        Change to System
      </button>
    </div>
  );
};

describe("ThemeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.classList.remove("dark");
    // Mock successful database operations
    mockDbGet.mockResolvedValue(undefined);
    mockDbUpdate.mockResolvedValue(1);
  });

  it("should provide default theme values", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
  });

  it("should load theme from database on mount", async () => {
    mockDbGet.mockResolvedValue({
      id: 1,
      theme: "dark",
      goalWeight: null,
      weeklyWorkoutTarget: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockDbGet).toHaveBeenCalledWith(1);
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
  });

  it("should change theme and save to database", async () => {
    const userEventLib = await import("@testing-library/user-event");
    const userEvent = userEventLib.default.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const darkButton = screen.getByText("Change to Dark");
    await userEvent.click(darkButton);

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(mockDbUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          theme: "dark",
        })
      );
    });
  });

  it("should apply dark class to document when theme is dark", async () => {
    mockDbGet.mockResolvedValue({
      id: 1,
      theme: "dark",
      goalWeight: null,
      weeklyWorkoutTarget: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("should remove dark class when theme is light", async () => {
    const userEventLib = await import("@testing-library/user-event");
    const userEvent = userEventLib.default.setup();

    // Start with dark theme
    mockDbGet.mockResolvedValue({
      id: 1,
      theme: "dark",
      goalWeight: null,
      weeklyWorkoutTarget: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    // Change to light
    const lightButton = screen.getByText("Change to Light");
    await userEvent.click(lightButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("should handle database errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockDbGet.mockRejectedValue(new Error("Database error"));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load theme:",
        expect.any(Error)
      );
    });

    // Should still render with default theme
    expect(screen.getByTestId("theme")).toHaveTextContent("system");

    consoleErrorSpy.mockRestore();
  });
});
