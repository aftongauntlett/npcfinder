import { LockKey, TrendDown, Database, type Icon } from "@phosphor-icons/react";
import { LANDING_TEAL, LANDING_PURPLE, LANDING_BLUE } from "./landingTheme";

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
    "Built for small groups (5-50 people) who want control without ads or tracking",
    "Modular design: media tracking live, multi-purpose tools coming",
    "Each installation isolated - your data in your own database",
    "Not a social network - a private tool for existing friend groups",
  ],
  badges: [
    {
      label: "Invite-Only",
      icon: LockKey,
      color: LANDING_TEAL,
    },
    {
      label: "No Tracking",
      icon: TrendDown,
      color: LANDING_PURPLE,
    },
    {
      label: "Self-Hosted",
      icon: Database,
      color: LANDING_BLUE,
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
