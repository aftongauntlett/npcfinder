import { LANDING_PEACH, LANDING_TEAL } from "./landingTheme";

export interface FutureFeature {
  title: string;
  description: string;
  color: string;
}

export interface FutureCategory {
  category: string;
  color: string;
  features: FutureFeature[];
}

export const futureDisclaimer =
  "These are things I'd love to build someday. No promises, no timelines - just honest intentions. Real life gets in the way sometimes, and that's okay.";

export const landingFutureCategories: FutureCategory[] = [
  {
    category: "Social",
    color: LANDING_PEACH,
    features: [
      {
        title: "Custom Profiles",
        color: LANDING_PEACH,
        description:
          "MySpace used to let you blast a song at people and have a Top 8. I want something like that - expressive, personal, a little nostalgic, but actually good this time.",
      },
      {
        title: "Private Groups",
        color: LANDING_TEAL,
        description:
          "Small, invitation-based groups - like a Discord server, but quieter and more intentional. A place for your actual people.",
      },
    ],
  },
];

export const gameMilestone = {
  title: "Interactive Game Foundation Is Live",
  description:
    "The first stage of the interactive game is now playable inside NPC Finder. Game systems are the current build focus.",
};

export const futureVisionBlurb = {
  title: "Big Dream, Tiny Team",
  updatedAt: "March 18, 2026",
  content:
    "Long-term goal: Discord + MySpace + Stardew Valley energy. You get a home in town that others can discover, and friends can step inside. Optional watch parties should feel social and cozy, not like a stream dashboard.",
  realityCheck:
    "I don’t yet know how to do this legally and safely at scale, especially around licensing, sync, and browser playback limits. If you know practical legal paths, I’d genuinely love to hear from you.",
  values:
    "The direction stays the same: free to use, no ads, no data selling, and stronger privacy by default. It’s ambitious, but still worth pursuing.",
};
