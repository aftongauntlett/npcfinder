import React from "react";
import { Check, Clock } from "lucide-react";

export type MediaStatus =
  | "watched"
  | "to-watch"
  | "played"
  | "to-play"
  | "read"
  | "to-read"
  | "saved"
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
    label: "To Watch",
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
    label: "To Play",
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
    label: "To Read",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
  saved: {
    label: "Saved",
    icon: Check,
    colorClass: "text-green-600 dark:text-green-400",
    badgeColorClass: "bg-green-500",
  },
  "to-listen": {
    label: "To Listen",
    icon: Clock,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500",
  },
};
