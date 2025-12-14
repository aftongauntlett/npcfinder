/**
 * EmptyStateAddCard Component Tests
 *
 * Tests for the unified empty state component used across the app.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Film, ShoppingCart } from "lucide-react";
import EmptyStateAddCard from "../../src/components/shared/common/EmptyStateAddCard";
import { ThemeProvider } from "../../src/contexts/ThemeContext";

// Mock matchMedia for ThemeContext
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
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
});

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe("EmptyStateAddCard", () => {
  const defaultProps = {
    icon: Film,
    title: "Your list is empty",
    description: "Add your first item to get started",
    onClick: vi.fn(),
  };

  it("renders with all required props", () => {
    renderWithTheme(<EmptyStateAddCard {...defaultProps} />);

    expect(screen.getByText("Your list is empty")).toBeTruthy();
    expect(screen.getByText("Add your first item to get started")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders the provided icon", () => {
    const { container } = renderWithTheme(
      <EmptyStateAddCard {...defaultProps} />
    );

    // Check that the icon SVG is rendered
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<EmptyStateAddCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Enter key is pressed", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<EmptyStateAddCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Space key is pressed", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<EmptyStateAddCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses title as aria-label when ariaLabel is not provided", () => {
    renderWithTheme(<EmptyStateAddCard {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Your list is empty");
  });

  it("uses custom aria-label when provided", () => {
    renderWithTheme(
      <EmptyStateAddCard
        {...defaultProps}
        ariaLabel="Add movies to your watchlist"
      />
    );

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe(
      "Add movies to your watchlist"
    );
  });

  it("applies custom className when provided", () => {
    const { container } = renderWithTheme(
      <EmptyStateAddCard
        {...defaultProps}
        className="min-h-[400px] custom-class"
      />
    );

    const card = container.querySelector('[data-testid="empty-state-add-card"]');
    expect(card?.classList.contains("min-h-[400px]")).toBe(true);
    expect(card?.classList.contains("custom-class")).toBe(true);
  });

  it("is keyboard accessible", () => {
    renderWithTheme(<EmptyStateAddCard {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button.getAttribute("type")).toBe("button");

    // Should be focusable (not disabled)
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("renders with different icons", () => {
    const { container, rerender } = renderWithTheme(
      <EmptyStateAddCard {...defaultProps} icon={Film} />
    );

    // First icon
    let svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    // Rerender with different icon
    rerender(
      <ThemeProvider>
        <EmptyStateAddCard {...defaultProps} icon={ShoppingCart} />
      </ThemeProvider>
    );

    // Icon should still be present (different one)
    svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("has proper semantic HTML structure", () => {
    renderWithTheme(<EmptyStateAddCard {...defaultProps} />);

    const button = screen.getByRole("button");

    // Should be a button element
    expect(button.tagName).toBe("BUTTON");

    // Should have type="button"
    expect(button.getAttribute("type")).toBe("button");
  });

  it("native button keyboard activation works", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<EmptyStateAddCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole("button");
    button.focus();

    // Test that native button behavior triggers onClick via keyboard
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalled();
  });

  it("renders long descriptions correctly", () => {
    const longDescription =
      "This is a very long description that should wrap properly and display within the max-width constraint of the component. It should remain readable and centered.";

    renderWithTheme(
      <EmptyStateAddCard {...defaultProps} description={longDescription} />
    );

    expect(screen.getByText(longDescription)).toBeTruthy();
  });

  it("handles multiple rapid clicks correctly", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<EmptyStateAddCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole("button");

    // Click multiple times rapidly
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(3);
  });
});
