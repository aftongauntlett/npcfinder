import { Film, Shield, Users, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureData {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingFeatures: FeatureData[] = [
  {
    icon: Film,
    iconColor: "#ff6b35", // vibrant orange-red
    title: "Media Tracking & Recommendations",
    items: [
      "Build personal libraries for movies, TV, music, books, and games",
      "Rate and review what you consume, then send recommendations to friends with personal notes",
      "Mark recommendations as hits, misses, or queued",
    ],
  },
  {
    icon: Shield,
    iconColor: "#a855f7", // vibrant purple (purple-500)
    title: "Privacy-First",
    items: [
      "Invite-only access controlled by admins - no public signup, no strangers",
      "Row-Level Security (RLS) ensures your data is protected at the database level",
      "Your libraries and recommendations stay within your trusted friend group",
    ],
  },
  {
    icon: Users,
    iconColor: "#14b8a6", // vibrant teal (teal-500)
    title: "Small Group Sharing",
    items: [
      "Connect with friends through manual, opt-in connections",
      "See what your connected friends are watching, reading, and playing",
      "Get recommendations from people who know your taste - not algorithms",
    ],
  },
  {
    icon: Palette,
    iconColor: "#f59e0b", // amber-500
    title: "Customization & Personalization",
    items: [
      "Choose custom theme colors to personalize your dashboard",
      "Customize which dashboard cards you see and hide unused features",
      "Set your display name and personal greeting",
    ],
  },
];
