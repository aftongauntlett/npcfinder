import { Film, Shield, Users, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureData {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingFeatures: FeatureData[] = [
  {
    icon: Film,
    iconColor: "#ff6b35", // vibrant orange-red
    title: "Media Tracking & Recommendations",
    items: [
      "Keep personal libraries for movies, TV shows, music, books, and games",
      "Rate what you watch and read, then share recommendations with friends",
      "See what friends loved or hated and mark suggestions as hits or misses",
    ],
  },
  {
    icon: Shield,
    iconColor: "#a855f7", // vibrant purple (purple-500)
    title: "Privacy-First",
    items: [
      "Invite-only access means only people you trust can join",
      "Row-Level Security protects your data at the database level",
      "Your library and recommendations stay between you and your friend group",
    ],
  },
  {
    icon: Users,
    iconColor: "#14b8a6", // vibrant teal (teal-500)
    title: "Friend Network",
    items: [
      "Connect with your real friends and see their media libraries",
      "View their ratings and recommendations side by side",
      "Find out what resonates with the people who know you best",
    ],
  },
  {
    icon: TrendingUp,
    iconColor: "#22c55e", // vibrant green (green-500)
    title: "Suggestions & Voting",
    items: [
      "Create suggestions for anything—where to eat, what to watch, weekend activities",
      "Friends can upvote or downvote to make group decisions easy",
      "Democratic voting keeps everyone's voice heard",
    ],
  },
];
