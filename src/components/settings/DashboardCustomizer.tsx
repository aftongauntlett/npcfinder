import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cards } from "../../data/dashboardCards";

interface DashboardCustomizerProps {
  visibleCards: string[];
  onToggleCard: (cardId: string) => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  visibleCards,
  onToggleCard,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white dark:text-white">
            Dashboard Cards
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">
            Choose which sections appear on your dashboard
          </p>
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-400">
          {visibleCards.length} of {cards.length} visible
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3">
        {cards.map((card) => {
          const isVisible = visibleCards.includes(card.cardId);

          return (
            <button
              key={card.cardId}
              type="button"
              onClick={() => onToggleCard(card.cardId)}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                isVisible
                  ? "border-primary bg-primary/10 dark:bg-primary/10"
                  : "border-gray-700 dark:border-gray-700 bg-gray-900/30 dark:bg-gray-900/30 opacity-60 hover:opacity-80"
              }`}
              aria-label={`${isVisible ? "Hide" : "Show"} ${
                card.title
              } card on dashboard`}
              aria-pressed={isVisible}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  isVisible
                    ? "bg-primary-contrast"
                    : "bg-gray-700 dark:bg-gray-700 text-gray-400 dark:text-gray-400"
                }`}
              >
                {isVisible ? (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                ) : (
                  <EyeOff
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-medium text-sm sm:text-base ${
                    isVisible
                      ? "text-white dark:text-white"
                      : "text-gray-400 dark:text-gray-400"
                  }`}
                >
                  {card.title}
                </h4>
                <p
                  className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                    isVisible
                      ? "text-gray-300 dark:text-gray-300"
                      : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {card.description}
                </p>
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                    isVisible
                      ? "bg-primary-contrast"
                      : "bg-gray-700 dark:bg-gray-700 text-gray-300 dark:text-gray-300"
                  }`}
                >
                  {isVisible ? "Visible" : "Hidden"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {visibleCards.length === 0 && (
        <div className="mt-4 p-4 bg-amber-900/30 dark:bg-amber-900/30 border border-amber-700/50 dark:border-amber-700/50 rounded-lg">
          <p className="text-sm text-amber-300 dark:text-amber-300">
            ⚠️ You must have at least one card visible on your dashboard
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomizer;
