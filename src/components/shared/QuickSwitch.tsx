import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { cards } from "../../data/dashboardCards";

const QuickSwitch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find the current page
  const currentCard = cards.find((card) =>
    location.pathname.startsWith(card.route)
  );

  // Don't show on home page
  if (location.pathname === "/app" || location.pathname === "/app/") {
    return null;
  }

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    void navigate(route);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        aria-label="Quick switch sections"
        aria-expanded={isOpen}
      >
        <Grid3x3 size={16} />
        <span className="hidden sm:inline">
          {currentCard ? currentCard.title : "Navigate"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Quick Switch
            </div>
            {cards.map((card) => {
              const isCurrent = location.pathname.startsWith(card.route);
              return (
                <button
                  key={card.id}
                  onClick={() => handleNavigate(card.route)}
                  disabled={isCurrent}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    isCurrent
                      ? "bg-primary/10 text-primary cursor-default"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{card.title}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isCurrent
                        ? "text-primary/80"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {card.description}
                  </div>
                </button>
              );
            })}

            {/* Separator and link back to dashboard */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            <button
              onClick={() => handleNavigate("/app")}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <div className="font-medium text-sm">View All Sections</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Back to dashboard
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSwitch;
