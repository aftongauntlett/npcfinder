import React from "react";
import { Check, Clock, Play, Book, Music, LucideIcon } from "lucide-react";

type MediaType = "movie" | "tv" | "book" | "game" | "music";

interface StatusBadgeProps {
  status: string;
  mediaType?: MediaType;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "pill";
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

// Unified status configuration
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Completed states (green)
  watched: { label: "Watched", icon: Check, colorClass: "bg-green-500" },
  read: { label: "Read", icon: Check, colorClass: "bg-green-500" },
  played: { label: "Played", icon: Check, colorClass: "bg-green-500" },
  completed: { label: "Completed", icon: Check, colorClass: "bg-green-500" },

  // In-progress states (blue)
  watching: { label: "Watching", icon: Clock, colorClass: "bg-blue-500" },
  reading: { label: "Reading", icon: Book, colorClass: "bg-blue-500" },
  playing: { label: "Playing", icon: Play, colorClass: "bg-blue-500" },
  listening: { label: "Listening", icon: Music, colorClass: "bg-blue-500" },

  // Planned states (purple)
  "to-watch": { label: "To Watch", icon: Clock, colorClass: "bg-purple-500" },
  "to-read": { label: "To Read", icon: Book, colorClass: "bg-purple-500" },
  "to-play": { label: "To Play", icon: Play, colorClass: "bg-purple-500" },
  "to-listen": { label: "To Listen", icon: Music, colorClass: "bg-purple-500" },
  planned: { label: "Planned", icon: Clock, colorClass: "bg-purple-500" },
  queued: { label: "Queued", icon: Clock, colorClass: "bg-purple-500" },

  // Dropped states (red)
  dropped: { label: "Dropped", icon: Check, colorClass: "bg-red-500" },
};

export default function StatusBadge({
  status,
  mediaType: _mediaType,
  size = "md",
  variant = "pill",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] || {
    label: status,
    icon: Check,
    colorClass: "bg-gray-500",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const roundedClass = variant === "pill" ? "rounded-full" : "rounded";

  return (
    <span
      className={`inline-flex items-center gap-1 ${config.colorClass} text-white font-medium ${sizeClasses[size]} ${roundedClass} ${className}`}
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span className={size === "sm" ? "hidden sm:inline" : ""}>
        {config.label}
      </span>
    </span>
  );
}
