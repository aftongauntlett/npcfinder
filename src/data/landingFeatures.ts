import {
  FilmStripIcon as FilmStrip,
  ShieldCheckIcon as ShieldCheck,
  UsersThreeIcon as UsersThree,
  SlidersIcon as Sliders,
  CookingPotIcon as CookingPot,
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
    icon: UsersThree,
    iconColor: LANDING_TEAL,
    title: "Shared Collections",
    items: [
      "Create mixed-media collections that combine movies, TV, books, games, and music",
      "Share collections with trusted friends using member roles and controlled access",
      "Keep private collections personal, or publish to logged-in members of your circle",
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
    icon: Sliders,
    iconColor: LANDING_BLUE,
    title: "Customization & Personalization",
    items: [
      "Choose custom theme colors to personalize your dashboard",
      "Customize which dashboard cards you see and hide unused features",
      "Set your display name and personal greeting",
    ],
  },
  {
    icon: UsersThree,
    iconColor: LANDING_PEACH,
    title: "Small Group Sharing",
    items: [
      "Connect with friends through manual, opt-in connections",
      "See what your connected friends are collecting and recommending",
      "Get recommendations from people who know your taste - not ad-driven feeds",
    ],
  },
  {
    icon: CookingPot,
    iconColor: LANDING_BLUE,
    title: "Labs (Optional Personal Tools)",
    items: [
      "Task boards, recipes, and job tracking are available as secondary tools",
      "Labs features are useful but not the core media identity of the product",
      "Use Labs when needed without cluttering the media-first experience",
    ],
  },
];
