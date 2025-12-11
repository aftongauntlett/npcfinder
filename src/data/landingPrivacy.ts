import {
  ShieldCheckIcon,
  UserMinusIcon,
  EyeSlashIcon,
  StackIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  LANDING_TEAL,
  LANDING_PEACH,
  LANDING_PURPLE,
  LANDING_BLUE,
} from "./landingTheme";

export interface PrivacyPoint {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export interface PrivacyData {
  title: string;
  description: string;
  points: PrivacyPoint[];
}

export const landingPrivacy: PrivacyData = {
  title: "Why Privacy Matters",
  description:
    "NPC Finder is built with privacy as a core principle, but it's important to understand what that means - and what it doesn't mean.",
  points: [
    {
      icon: ShieldCheckIcon,
      iconColor: LANDING_TEAL,
      title: "Protected from Other Users",
      description:
        "PostgreSQL Row-Level Security ensures other users cannot access your private data - only you and connected friends.",
    },
    {
      icon: UserMinusIcon,
      iconColor: LANDING_PEACH,
      title: "Invite-Only Access",
      description:
        "No public signup means no strangers. Only people with admin-generated invite codes can join.",
    },
    {
      icon: EyeSlashIcon,
      iconColor: LANDING_PURPLE,
      title: "No Tracking or Analytics",
      description:
        "No third-party tracking, no analytics scripts, no data mining. Your activity stays within the app.",
    },
    {
      icon: StackIcon,
      iconColor: LANDING_BLUE,
      title: "Database Isolation",
      description:
        "Each installation uses its own Supabase project. When you clone this repo, you create a completely separate database.",
    },
  ],
};
