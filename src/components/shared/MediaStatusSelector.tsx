import React from "react";
import { Check, Clock, PlayCircle, X } from "lucide-react";

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

interface StatusOption {
  value: MediaStatus;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface MediaStatusSelectorProps {
  currentStatus: MediaStatus;
  onStatusChange: (status: MediaStatus) => void;
  mediaType?: "movie" | "tv" | "book" | "game" | "music";
  className?: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "planned",
    label: "Planned",
    icon: <Clock className="w-3.5 h-3.5" />,
    colorClass:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50",
  },
  {
    value: "in-progress",
    label: "Watching",
    icon: <PlayCircle className="w-3.5 h-3.5" />,
    colorClass:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50",
  },
  {
    value: "completed",
    label: "Completed",
    icon: <Check className="w-3.5 h-3.5" />,
    colorClass:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50",
  },
  {
    value: "dropped",
    label: "Dropped",
    icon: <X className="w-3.5 h-3.5" />,
    colorClass:
      "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-900/50",
  },
];

// Customize labels based on media type
const getStatusLabel = (status: MediaStatus, mediaType?: string): string => {
  if (status === "in-progress") {
    switch (mediaType) {
      case "book":
        return "Reading";
      case "game":
        return "Playing";
      case "music":
        return "Listening";
      default:
        return "Watching";
    }
  }
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
};

export default function MediaStatusSelector({
  currentStatus,
  onStatusChange,
  mediaType,
  className = "",
}: MediaStatusSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {STATUS_OPTIONS.map((option) => {
        const isSelected = currentStatus === option.value;
        const label = getStatusLabel(option.value, mediaType);

        return (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              border transition-all duration-200
              transform hover:scale-105 active:scale-95
              ${
                isSelected
                  ? `${option.colorClass} ring-2 ring-offset-1 ring-current ring-offset-white dark:ring-offset-gray-800`
                  : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
            aria-pressed={isSelected}
            aria-label={`Mark as ${label}`}
          >
            {option.icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
