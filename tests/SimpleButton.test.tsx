/**
 * Simple React component test
 * Testing a basic button component with user interaction
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Simple Button component (you can replace this with a real component later)
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function SimpleButton({ onClick, children, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

describe("SimpleButton", () => {
  it("renders with correct text", () => {
    render(<SimpleButton onClick={() => {}}>Click Me</SimpleButton>);

    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<SimpleButton onClick={handleClick}>Click Me</SimpleButton>);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SimpleButton onClick={handleClick} disabled={true}>
        Click Me
      </SimpleButton>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <SimpleButton onClick={() => {}} disabled={true}>
        Click Me
      </SimpleButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
