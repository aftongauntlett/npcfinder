import { LANDING_PURPLE, LANDING_PEACH, LANDING_TEAL, LANDING_BLUE } from "./landingTheme";

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
  {
    category: "Personal",
    color: LANDING_PURPLE,
    features: [
      {
        title: "Private Journals",
        color: LANDING_PURPLE,
        description:
          "An end-to-end encrypted space for notes and reflections. Something just for you - not synced to a dashboard, not read by me.",
      },
      {
        title: "Personal Insights",
        color: LANDING_BLUE,
        description:
          "Patterns in what you watch, read, or play - just for your own curiosity. Nothing sent anywhere, no algorithm, just you looking at your own habits.",
      },
    ],
  },
];

export const gameMilestone = {
  title: "Interactive Game Foundation Is Live",
  description:
    "The first stage of the interactive game is now playable inside NPC Finder. Game systems are the current build focus.",
};
