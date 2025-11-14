import {
  FilmStrip,
  ShieldCheck,
  UsersThree,
  Sliders,
  type Icon,
} from "@phosphor-icons/react";
import {
  LANDING_PEACH,
  LANDING_PURPLE,
  LANDING_TEAL,
  LANDING_BLUE,
} from "./landingTheme";

interface FeatureData {
  icon: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingFeatures: FeatureData[] = [
  {
    icon: FilmStrip,
    iconColor: LANDING_PEACH,
    title: "Media Tracking & Recommendations",
    items: [
      "Build personal libraries for movies, TV, music, books, and games",
      "Rate and review what you consume, then send recommendations to friends with personal notes",
      "Mark recommendations as hits, misses, or queued",
    ],
  },
  {
    icon: ShieldCheck,
    iconColor: LANDING_PURPLE,
    title: "Privacy-First",
    items: [
      "Invite-only access controlled by admins - no public signup, no strangers",
      "Row-Level Security (RLS) ensures your data is protected at the database level",
      "Your libraries and recommendations stay within your trusted friend group",
    ],
  },
  {
    icon: UsersThree,
    iconColor: LANDING_TEAL,
    title: "Small Group Sharing",
    items: [
      "Connect with friends through manual, opt-in connections",
      "See what your connected friends are watching, reading, and playing",
      "Get recommendations from people who know your taste - not ad-driven feeds",
    ],
  },
  {
    icon: Sliders,
    iconColor: LANDING_BLUE,
    title: "Customization & Personalization",
    items: [
      "Choose custom theme colors to personalize your dashboard",
      "Customize which dashboard cards you see and hide unused features",
      "Set your display name and personal greeting",
    ],
  },
];
