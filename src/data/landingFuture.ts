interface FutureFeatureData {
  title: string;
  badge: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  description: string;
  descriptionExtra?: string;
  isBigDream?: boolean;
}

export const futureDisclaimer =
  "These features are under consideration for future development. None of them are currently available. Plans may change based on user feedback, technical feasibility, and project priorities.";

export const landingFutureFeatures: FutureFeatureData[] = [
  {
    title: "Productivity Tools",
    badge: "PRODUCTIVITY",
    badgeColor: {
      bg: "rgba(6, 182, 212, 0.1)", // cyan-500/10
      text: "#67e8f9", // cyan-300
      border: "rgba(34, 211, 238, 0.2)", // cyan-400/20
    },
    description:
      "Task management with drag-and-drop, priorities, and shared lists. Track fitness routines, job applications, or personal goals - all integrated into the dashboard.",
  },
  {
    title: "Custom Profiles",
    badge: "SOCIAL",
    badgeColor: {
      bg: "#FFB08810",
      text: "#FFB088",
      border: "#FFB08820",
    },
    description:
      "Customizable profiles inspired by MySpace - custom backgrounds, music players, and personal expression. Not professional networking.",
  },
  {
    title: "Discord-Style Networks",
    badge: "SCALABILITY",
    badgeColor: {
      bg: "rgba(20, 184, 166, 0.1)", // teal-500/10
      text: "#5eead4", // teal-300
      border: "rgba(45, 212, 191, 0.2)", // teal-400/20
    },
    description:
      "Optional user-created networks where groups manage their own spaces, permissions, and membership - scaling beyond small friend groups while maintaining privacy controls.",
  },
  {
    title: "End-to-End Encryption",
    badge: "ENCRYPTION",
    badgeColor: {
      bg: "#FF6B6B10", // rgba equivalent
      text: "#FF8E53",
      border: "#FF6B6B20",
    },
    description:
      "Private messaging and journaling with full E2E encryption like Signal. Requires significant architectural changes - long-term goal.",
  },
  {
    title: "In-Browser Social Game",
    badge: "THE BIG DREAM",
    badgeColor: {
      bg: "rgba(20, 184, 166, 0.1)", // teal-500/10
      text: "#5eead4", // teal-300
      border: "rgba(45, 212, 191, 0.2)", // teal-400/20
    },
    description:
      "A cozy social game built into the dashboard. Keep pets, tend gardens, decorate your house, and visit friends. Think Animal Crossing meets productivity tracking.",
  },
];
