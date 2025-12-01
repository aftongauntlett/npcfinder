import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cards } from "../../../data/dashboardCards";
import Button from "../ui/Button";

const Breadcrumb: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show breadcrumb on home page
  if (location.pathname === "/app" || location.pathname === "/app/") {
    return null;
  }

  // Find the current page from our cards data
  const currentCard = cards.find((card) =>
    location.pathname.startsWith(card.route)
  );

  // If we can't find the card (e.g., settings, admin pages), handle gracefully
  const pageName = currentCard?.title || getPageNameFromPath(location.pathname);

  return (
    <nav
      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4"
      aria-label="Breadcrumb"
    >
      <Button
        onClick={() => void navigate("/app")}
        variant="subtle"
        icon={<Home size={16} />}
        className="text-sm"
        aria-label="Navigate to dashboard"
      >
        Dashboard
      </Button>
      <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
      <span className="text-gray-900 dark:text-white font-medium">
        {pageName}
      </span>
    </nav>
  );
};

// Helper function to get page name from path for special pages
function getPageNameFromPath(path: string): string {
  if (path.includes("/settings")) return "Settings";
  if (path.includes("/admin")) return "Admin Panel";

  // Fallback: capitalize path segments
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default Breadcrumb;
