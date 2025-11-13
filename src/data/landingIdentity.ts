import { LockKey, TrendDown, Database, type Icon } from "@phosphor-icons/react";

export interface IdentityBadge {
  label: string;
  icon: Icon;
  color: string;
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
  description: "",
  keyPoints: [
    "Built for small groups (5-50 people) who want control without algorithms or strangers",
    "Modular design: media tracking live, multi-purpose tools coming",
    "Each installation isolated - your data in your own database",
    "Not a social network - a private tool for existing friend groups",
  ],
  badges: [
    {
      label: "Invite-Only",
      icon: LockKey,
      color: "#5DCCCC", // Teal - matches app primary color
    },
    {
      label: "No Algorithms",
      icon: TrendDown,
      color: "#A78BDD", // Soft purple - complements teal
    },
    {
      label: "Self-Hosted",
      icon: Database,
      color: "#8E9DAD", // Dusty blue-gray - neutral complement
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
