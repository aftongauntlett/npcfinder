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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard Cards
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose which sections appear on your dashboard
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {visibleCards.length} of {cards.length} visible
        </div>
      </div>

      <div className="grid gap-3">
        {cards.map((card) => {
          const isVisible = visibleCards.includes(card.cardId);

          return (
            <button
              key={card.cardId}
              type="button"
              onClick={() => onToggleCard(card.cardId)}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                isVisible
                  ? "border-primary bg-primary-pale/10 dark:bg-primary-pale/10"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60 hover:opacity-80"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isVisible
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {isVisible ? (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-medium ${
                    isVisible
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {card.title}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    isVisible
                      ? "text-gray-600 dark:text-gray-300"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {card.description}
                </p>
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                    isVisible
                      ? "bg-primary text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
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
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ You must have at least one card visible on your dashboard
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomizer;
