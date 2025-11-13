import type { LucideIcon } from "lucide-react";
import { Key, Lock } from "lucide-react";

export interface AvailabilityPoint {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export interface AvailabilityData {
  title: string;
  description: string;
  points: AvailabilityPoint[];
  demoNote: string;
  ctaText: string;
  ctaLink: string;
}

export interface DocLink {
  label: string;
  href: string;
  description: string;
}

export const landingAvailability: AvailabilityData = {
  title: "Access & Availability",
  description:
    "NPC Finder is currently invite-only and operates as a private tool for small, trusted friend groups. There is no public signup or open registration.",
  points: [
    {
      icon: Key,
      iconColor: "#5DCCCC", // Teal - matches brand
      title: "How Invites Work",
      description:
        "Admins generate invite codes tied to specific email addresses. Codes expire after 30 days and work only once. Your email must match the intended recipient to sign up - this prevents code sharing and keeps access controlled.",
    },
    {
      icon: Lock,
      iconColor: "#A78BDD", // Purple - matches brand
      title: "No Public Registration",
      description:
        "There is no 'Sign Up' button for the general public. You must have an invite code from an existing admin to create an account. NPC Finder is not a public social platform - it's designed for trust and privacy within small friend groups.",
    },
  ],
  demoNote:
    "Demo video coming soon. Check back for a walkthrough of the app's core features and interface.",
  ctaText: "Have an invite code? Get started",
  ctaLink: "/app",
};

export const availabilityDocLinks: DocLink[] = [
  {
    label: "Invite System Guide",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/INVITE-SYSTEM-QUICKSTART.md",
    description: "Learn how invite codes work and how to generate them",
  },
  {
    label: "Privacy Reality Check",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md",
    description:
      "Understand what privacy means in this app (and what it doesn't)",
  },
  {
    label: "Quick Start Guide",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/QUICK-START.md",
    description: "Set up your own instance from scratch",
  },
];
