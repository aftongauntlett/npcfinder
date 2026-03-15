import { LANDING_PURPLE, LANDING_PEACH, LANDING_TEAL } from "./landingTheme";

export interface FutureFeature {
  title: string;
  description: string;
}

export interface FutureCategory {
  category: string;
  color: string;
  features: FutureFeature[];
}

export const futureDisclaimer =
  "These features are under consideration for future development. None of them are currently available. Plans may change based on user feedback, technical feasibility, and project priorities.";

export const landingFutureCategories: FutureCategory[] = [
  {
    category: "Social",
    color: LANDING_PEACH,
    features: [
      {
        title: "Custom Profiles",
        description:
          "Customizable profiles inspired by MySpace - custom backgrounds, music players, and personal expression. Not professional networking.",
      },
      {
        title: "Discord-Style Networks",
        description:
          "User-created groups with membership, permissions, and invite workflows so people can belong to multiple trusted circles.",
      },
      {
        title: "In-Browser Social Game",
        description:
          "A cozy social game built into the dashboard. Keep pets, tend gardens, decorate your house, and visit friends. Think Animal Crossing meets productivity tracking.",
      },
    ],
  },
  {
    category: "Productivity",
    color: LANDING_PURPLE,
    features: [
      {
        title: "Advanced Analytics",
        description:
          "Track productivity patterns, media consumption trends, and personal insights over time",
      },
      {
        title: "Private Journals (E2E protected)",
        description:
          "End-to-end encrypted personal journals for private thoughts, reflections, and daily entries",
      },
    ],
  },
  {
    category: "Scalability",
    color: LANDING_TEAL,
    features: [
      {
        title: "End-to-End Encryption",
        description:
          "Private messaging and journaling with full E2E encryption like Signal. Requires significant architectural changes - long-term goal.",
      },
    ],
  },
];
