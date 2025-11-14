import {
  Database,
  ShieldCheck,
  Lightning,
  type Icon,
} from "@phosphor-icons/react";
import { LANDING_TEAL, LANDING_PURPLE, LANDING_PEACH } from "./landingTheme";

interface ArchitectureData {
  icon: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

export const landingArchitecture: ArchitectureData[] = [
  {
    icon: Database,
    iconColor: LANDING_TEAL,
    title: "Database Architecture",
    items: [
      "PostgreSQL with Supabase",
      "Row-Level Security (RLS)",
      "Optimized indexes & queries",
      "Real-time subscriptions",
    ],
  },
  {
    icon: ShieldCheck,
    iconColor: LANDING_PURPLE,
    title: "Security Features",
    items: [
      "Invite-code authentication",
      "JWT session management",
      "Admin role-based access",
      "Database-level RLS policies",
    ],
  },
  {
    icon: Lightning,
    iconColor: LANDING_PEACH,
    title: "Performance",
    items: [
      "React Query caching",
      "Code splitting & lazy loading",
      "Optimistic UI updates",
      "Production build optimization",
    ],
  },
];
