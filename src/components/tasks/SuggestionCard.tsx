/**
 * Suggestion Card Component
 *
 * Displays helpful suggestions for creating boards or tasks
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import Card from "../shared/ui/Card";

interface SuggestionCardProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  icon: Icon,
  emoji,
  title,
  description,
  onClick,
}) => {
  return (
    <Card
      variant="interactive"
      hover="border"
      className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon/Emoji */}
          <div className="flex-shrink-0">
            {emoji ? (
              <span className="text-4xl">{emoji}</span>
            ) : Icon ? (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SuggestionCard;
