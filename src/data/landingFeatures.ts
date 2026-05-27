import {
  ClockCounterClockwiseIcon as ClockCounterClockwise,
  ListStarIcon as ListStar,
  BrainIcon as Brain,
  type Icon,
} from "@phosphor-icons/react";
import { LANDING_PEACH, LANDING_TEAL } from "./landingTheme";

interface FeatureData {
  icon: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingFeatures: FeatureData[] = [
  {
    icon: ClockCounterClockwise,
    iconColor: LANDING_PEACH,
    title: "Personal Media Timeline",
    items: [
      "Track movies, TV, books, music, and games in one place with API-powered search and autofill.",
      "Leave quick notes and ratings so future-you remembers why something mattered.",
      "Keep a timeline of when you watched, read, played, or listened.",
    ],
  },
  {
    icon: ListStar,
    iconColor: LANDING_TEAL,
    title: "Shared Collections",
    items: [
      "Build mixed-media playlists from items already in your tracker.",
      "Share with invited friends and exchange notes and recommendations.",
      "Collaborate without turning it into a public social feed.",
    ],
  },
  {
    iconColor: LANDING_PEACH,
    icon: Brain,
    title: "Built for Focus",
    items: [
      "Private by default, with invite-only access.",
      "Encourages reflection and retention instead of engagement chasing.",
      "Open source and actively developed in the open.",
    ],
  },
];
