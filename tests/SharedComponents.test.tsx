import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Card from "../src/components/shared/Card";
import Alert from "../src/components/shared/Alert";
import Header from "../src/components/shared/Header";
import Footer from "../src/components/shared/Footer";

describe("Card Component", () => {
  it("should render children correctly", () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should have default styling classes", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white", "dark:bg-gray-800");
  });

  it("should apply custom padding", () => {
    const { container } = render(<Card padding="p-4">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("p-4");
  });
});

describe("Alert Component", () => {
  it("should render success alert", () => {
    render(<Alert type="success">Success message</Alert>);
    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render error alert", () => {
    render(<Alert type="error">Error message</Alert>);
    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render info alert", () => {
    render(<Alert type="info">Info message</Alert>);
    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render warning alert", () => {
    render(<Alert type="warning">Warning message</Alert>);
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render with title", () => {
    render(
      <Alert type="success" title="Success Title">
        Success content
      </Alert>
    );
    expect(screen.getByText("Success Title")).toBeInTheDocument();
    expect(screen.getByText("Success content")).toBeInTheDocument();
  });

  it("should apply correct color classes for success", () => {
    const { container } = render(<Alert type="success">Success</Alert>);
    const alert = container.firstChild as HTMLElement;
    expect(alert).toHaveClass("bg-green-50", "dark:bg-green-900/20");
  });

  it("should apply correct color classes for error", () => {
    const { container } = render(<Alert type="error">Error</Alert>);
    const alert = container.firstChild as HTMLElement;
    expect(alert).toHaveClass("bg-red-50", "dark:bg-red-900/20");
  });

  it("should default to info type when no type provided", () => {
    render(<Alert>Default content</Alert>);
    expect(screen.getByText("Default content")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("Header Component", () => {
  it("should render NPC Finder title", () => {
    render(<Header />);
    expect(screen.getByText("NPC Finder")).toBeInTheDocument();
  });

  it("should render current time", () => {
    render(<Header />);
    const timeElement = screen.getByRole("time");
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute("datetime");
  });

  it("should have proper heading hierarchy", () => {
    render(<Header />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("NPC Finder");
  });
});

describe("Footer Component", () => {
  it("should render footer content", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("should render suggestions button", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText("Suggestions")).toBeInTheDocument();
  });

  it("should render GitHub link", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/aftongauntlett"
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render copyright text", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} NPC Finder · Built by`, {
        exact: false,
      })
    ).toBeInTheDocument();
  });
});
