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
    category: "Productivity",
    color: LANDING_PURPLE,
    features: [
      {
        title: "Advanced Analytics",
        description:
          "Track productivity patterns, media consumption trends, and personal insights over time",
      },
      {
        title: "Calendar Integration",
        description:
          "Sync tasks and meal plans with your calendar for better time management",
      },
    ],
  },
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
        title: "In-Browser Social Game",
        description:
          "A cozy social game built into the dashboard. Keep pets, tend gardens, decorate your house, and visit friends. Think Animal Crossing meets productivity tracking.",
      },
    ],
  },
  {
    category: "Scalability",
    color: LANDING_TEAL,
    features: [
      {
        title: "Discord-Style Networks",
        description:
          "Optional user-created networks where groups manage their own spaces, permissions, and membership - scaling beyond small friend groups while maintaining privacy controls.",
      },
      {
        title: "End-to-End Encryption",
        description:
          "Private messaging and journaling with full E2E encryption like Signal. Requires significant architectural changes - long-term goal.",
      },
    ],
  },
];
