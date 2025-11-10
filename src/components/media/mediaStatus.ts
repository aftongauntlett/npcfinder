import React from "react";
import { Check, Clock } from "lucide-react";

export type MediaStatus =
  | "watched"
  | "to-watch"
  | "played"
  | "to-play"
  | "read"
  | "to-read"
  | "to-listen";

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  badgeColorClass?: string;
}

export const STATUS_MAP: Record<MediaStatus, StatusConfig> = {
  watched: {
    label: "Watched",
    icon: Check,
    colorClass: "text-green-600 dark:text-green-400",
    badgeColorClass: "bg-green-500",
  },
  "to-watch": {
    label: "Watching",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
  played: {
    label: "Played",
    icon: Check,
    colorClass: "text-green-600 dark:text-green-400",
    badgeColorClass: "bg-green-500",
  },
  "to-play": {
    label: "Playing",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
  read: {
    label: "Read",
    icon: Check,
    colorClass: "text-green-600 dark:text-green-400",
    badgeColorClass: "bg-green-500",
  },
  "to-read": {
    label: "Reading",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
  "to-listen": {
    label: "Listening",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
};
