import {
  ShieldCheck,
  UserMinus,
  EyeSlash,
  Stack,
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
  disclaimer: string;
  privacyDocsLink: {
    label: string;
    href: string;
  };
}

export const landingPrivacy: PrivacyData = {
  title: "Why Privacy Matters",
  description:
    "NPC Finder is built with privacy as a core principle, but it's important to understand what that means - and what it doesn't mean.",
  points: [
    {
      icon: ShieldCheck,
      iconColor: LANDING_TEAL,
      title: "Protected from Other Users",
      description:
        "PostgreSQL Row-Level Security ensures other users cannot access your private data - only you and connected friends.",
    },
    {
      icon: UserMinus,
      iconColor: LANDING_PEACH,
      title: "Invite-Only Access",
      description:
        "No public signup means no strangers. Only people with admin-generated invite codes can join.",
    },
    {
      icon: EyeSlash,
      iconColor: LANDING_PURPLE,
      title: "No Tracking or Analytics",
      description:
        "No third-party tracking, no analytics scripts, no data mining. Your activity stays within the app.",
    },
    {
      icon: Stack,
      iconColor: LANDING_BLUE,
      title: "Database Isolation",
      description:
        "Each installation uses its own Supabase project. When you clone this repo, you create a completely separate database.",
    },
  ],
  disclaimer:
    "**What's NOT private:** This is not end-to-end encrypted like Signal or WhatsApp. The database admin (whoever runs the Supabase instance) can technically access the data. This is the same privacy model as Netflix, Spotify, or most web apps. If you need Signal-level privacy, this app isn't designed for that use case. See the Privacy Reality Check documentation for full details.",
  privacyDocsLink: {
    label: "Read the Privacy Reality Check",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md",
  },
};
