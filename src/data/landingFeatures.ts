import {
  FilmStripIcon as FilmStrip,
  ShieldCheckIcon as ShieldCheck,
  UsersThreeIcon as UsersThree,
  GameControllerIcon as GameController,
  type Icon,
} from "@phosphor-icons/react";
import { LANDING_PEACH, LANDING_PURPLE, LANDING_TEAL } from "./landingTheme";

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
    title: "Track Everything You Love",
    items: [
      "Movies, TV, books, music, games - all in one place instead of scattered notes and apps",
      "Write reviews, rate things, and share picks with people you actually want recommendations from",
    ],
  },
  {
    icon: UsersThree,
    iconColor: LANDING_TEAL,
    title: "Shared Collections",
    items: [
      "Build mixed-media collections and share them with people you invite - nobody else can see them",
      "Set roles so you stay in control of who can contribute vs. just browse",
    ],
  },
  {
    icon: GameController,
    iconColor: LANDING_PURPLE,
    title: "Interactive Game (Phase 1 Live)",
    items: [
      "The first stage of the interactive game is playable right inside NPC Finder",
      "Use immersive mode for focused play, or pop it out into a new tab",
    ],
  },
  {
    iconColor: LANDING_PEACH,
    icon: ShieldCheck,
    title: "Private by Default",
    items: [
      "Invite-only - no sign-up button, no public access, no strangers",
      "Row-Level Security at the database level means other users literally cannot read your data",
    ],
  },
];
