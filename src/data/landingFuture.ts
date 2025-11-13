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

export const landingFutureFeatures: FutureFeatureData[] = [
  {
    title: "End-to-End Encryption",
    badge: "ENCRYPTION",
    badgeColor: {
      bg: "#FF6B6B10", // rgba equivalent
      text: "#FF8E53",
      border: "#FF6B6B20",
    },
    description: "Private messaging and journaling with full E2E encryption.",
  },
  {
    title: "Task Tracker",
    badge: "PRODUCTIVITY",
    badgeColor: {
      bg: "rgba(6, 182, 212, 0.1)", // cyan-500/10
      text: "#67e8f9", // cyan-300
      border: "rgba(34, 211, 238, 0.2)", // cyan-400/20
    },
    description:
      "Flexible tracking for fitness routines, job applications, or personal goals.",
  },
  {
    title: "Interactive To-Do Lists",
    badge: "COLLABORATION",
    badgeColor: {
      bg: "rgba(20, 184, 166, 0.1)", // teal-500/10
      text: "#5eead4", // teal-300
      border: "rgba(45, 212, 191, 0.2)", // teal-400/20
    },
    description:
      "Task management with drag-and-drop, priorities, and shared lists.",
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
      "Customizable profiles with personality, inspired by the old days of MySpace.",
  },
];

export const landingBigDream: FutureFeatureData = {
  title: "In-Browser Social Game",
  badge: "THE BIG DREAM",
  badgeColor: {
    bg: "", // uses gradient
    text: "#5eead4", // teal-300
    border: "rgba(45, 212, 191, 0.2)", // teal-400/20
  },
  description:
    "A cozy social game built into the dashboard. Keep pets, tend to gardens, decorate your house, and visit your friends. Something designed to encourage healthy habits without pressure.",
  descriptionExtra:
    "A relaxing space that fits naturally into your friend network.",
  isBigDream: true,
};
