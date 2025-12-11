import { KeyIcon, LockIcon, type Icon } from "@phosphor-icons/react";
import { LANDING_TEAL, LANDING_PURPLE } from "./landingTheme";

export interface AvailabilityPoint {
  icon: Icon;
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
    "NPC Finder is currently invite-only while in beta. You'll receive a code from an existing admin to join your friend group.",
  points: [
    {
      icon: KeyIcon,
      iconColor: LANDING_TEAL,
      title: "How Invites Work",
      description:
        "Admins generate invite codes for specific email addresses. Each code expires after 30 days and works only once. This keeps the community trusted and private.",
    },
    {
      icon: LockIcon,
      iconColor: LANDING_PURPLE,
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
    label: "Quick Start Guide",
    href: "https://github.com/aftongauntlett/npcfinder/blob/main/docs/QUICK-START.md",
    description: "Set up your own instance from scratch",
  },
];
