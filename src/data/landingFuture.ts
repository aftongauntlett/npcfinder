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
        title: "Productivity Tools",
        description:
          "Task management with drag-and-drop, priorities, and shared lists. Track fitness routines, job applications, or personal goals - all integrated into the dashboard.",
      },
      {
        title: "Recipe & Meal Planning",
        description:
          "Organize recipes, plan weekly meals, and share favorite dishes with friends. Track what you've cooked, save cooking notes, and build a personal cookbook - all integrated into the dashboard.",
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
