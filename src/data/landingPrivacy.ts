import type { LucideIcon } from "lucide-react";
import { ShieldCheckIcon, UserMinusIcon } from "@heroicons/react/24/outline";
import { EyeNoneIcon, StackIcon } from "@radix-ui/react-icons";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export interface PrivacyPoint {
  icon:
    | LucideIcon
    | PhosphorIcon
    | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  title: string;
  description: string;
  isHeroicon?: boolean;
  isRadix?: boolean;
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
      icon: ShieldCheckIcon,
      iconColor: "#10b981",
      title: "Protected from Other Users",
      description:
        "PostgreSQL Row-Level Security ensures other users cannot access your private data - only you and connected friends.",
      isHeroicon: true,
    },
    {
      icon: UserMinusIcon,
      iconColor: "#f59e0b",
      title: "Invite-Only Access",
      description:
        "No public signup means no strangers. Only people with admin-generated invite codes can join.",
      isHeroicon: true,
    },
    {
      icon: EyeNoneIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>,
      iconColor: "#8b5cf6",
      title: "No Tracking or Analytics",
      description:
        "No third-party tracking, no analytics scripts, no data mining. Your activity stays within the app.",
      isRadix: true,
    },
    {
      icon: StackIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>,
      iconColor: "#3b82f6",
      title: "Database Isolation",
      description:
        "Each installation uses its own Supabase project. When you clone this repo, you create a completely separate database.",
      isRadix: true,
    },
  ],
  disclaimer:
    "**What's NOT private:** This is not end-to-end encrypted like Signal or WhatsApp. The database admin (whoever runs the Supabase instance) can technically access the data. This is the same privacy model as Netflix, Spotify, or most web apps. If you need Signal-level privacy, this app isn't designed for that use case. See the Privacy Reality Check documentation for full details.",
  privacyDocsLink: {
    label: "Read the Privacy Reality Check",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md",
  },
};
