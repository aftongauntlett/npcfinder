import type { LucideIcon } from "lucide-react";
import { LockKey, TrendDown, Database } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export interface IdentityBadge {
  label: string;
  icon: LucideIcon | PhosphorIcon;
  color: string;
  isPhosphor?: boolean;
}

export interface IdentityData {
  title: string;
  tagline: string;
  description: string;
  keyPoints: string[];
  badges: IdentityBadge[];
}

export interface ComparisonData {
  npcFinder: string[];
  publicSocialApps: string[];
}

export const landingIdentity: IdentityData = {
  title: "What Is NPC Finder Today",
  tagline:
    "A private, modular life dashboard for small, trusted friend groups.",
  description:
    "A privacy-first platform starting with media tracking, expanding into tasks, recipes, fitness, and more. Built for small groups (5-50 people) who want control without algorithms or strangers.",
  keyPoints: [
    "Modular design: media tracking live, multi-purpose tools coming",
    "Each installation isolated - your data in your own database",
    "Not a social network - a private tool for existing friend groups",
  ],
  badges: [
    {
      label: "Invite-Only",
      icon: LockKey,
      color: "#5DCCCC", // Teal - matches app primary color
      isPhosphor: true,
    },
    {
      label: "No Algorithms",
      icon: TrendDown,
      color: "#A78BDD", // Soft purple - complements teal
      isPhosphor: true,
    },
    {
      label: "Self-Hosted",
      icon: Database,
      color: "#8E9DAD", // Dusty blue-gray - neutral complement
      isPhosphor: true,
    },
  ],
};

export const comparisonData: ComparisonData = {
  npcFinder: [
    "Invite-only",
    "Small groups",
    "Private by default",
    "No public profiles",
    "Manual connections",
  ],
  publicSocialApps: [
    "Open signup",
    "Unlimited users",
    "Public by default",
    "Discoverable profiles",
    "Follow/friend requests",
  ],
};
