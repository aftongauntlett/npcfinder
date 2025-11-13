import { Database, Shield, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ArchitectureData {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingArchitecture: ArchitectureData[] = [
  {
    icon: Database,
    iconColor: "#60a5fa", // blue-400
    title: "Database Architecture",
    items: [
      "PostgreSQL with Supabase",
      "Row-Level Security (RLS)",
      "Optimized indexes & queries",
      "Real-time subscriptions",
    ],
  },
  {
    icon: Shield,
    iconColor: "#4ade80", // green-400
    title: "Security Features",
    items: [
      "Invite-code authentication",
      "JWT session management",
      "Admin role-based access",
      "Database-level RLS policies",
    ],
  },
  {
    icon: Zap,
    iconColor: "#facc15", // yellow-400
    title: "Performance",
    items: [
      "React Query caching",
      "Code splitting & lazy loading",
      "Optimistic UI updates",
      "Production build optimization",
    ],
  },
];
