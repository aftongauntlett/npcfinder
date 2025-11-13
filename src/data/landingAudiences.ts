import type { LucideIcon } from "lucide-react";
import { Briefcase, Code, Eye, UserCheck } from "lucide-react";

export interface AudienceItem {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export interface AudiencesData {
  sectionTitle: string;
  sectionDescription: string;
  audiences: AudienceItem[];
}

export const landingAudiences: AudiencesData = {
  sectionTitle: "Who This Page Is For",
  sectionDescription:
    "Different audiences will find different parts of this page useful.",
  audiences: [
    {
      icon: Briefcase,
      iconColor: "#3b82f6",
      title: "Recruiters & Hiring Managers",
      description:
        "Full-stack React + TypeScript with Supabase, Row-Level Security, and modern tooling. Review the technical architecture below.",
    },
    {
      icon: Code,
      iconColor: "#10b981",
      title: "Developers",
      description:
        "Clone and deploy your own instance. Complete setup guides, migrations, and API configuration included.",
    },
    {
      icon: Eye,
      iconColor: "#f59e0b",
      title: "Curious Visitors",
      description:
        "Exploring the concept? Learn what the app does, why privacy matters, and future plans. No signup needed.",
    },
    {
      icon: UserCheck,
      iconColor: "#8b5cf6",
      title: "Invited Users",
      description:
        "Have an invite code? Click login in the header. Use the email address tied to your code.",
    },
  ],
};
