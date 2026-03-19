import {
  KeyIcon as Key,
  LockIcon as Lock,
  type Icon,
} from "@phosphor-icons/react";
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
  title: "How to Get In",
  description:
    "NPC Finder is currently a private beta and invite-only by me. Not in a hype-waitlist way - intentionally low-key so I know who has access while the product is still taking shape.",
  points: [
    {
      icon: Key,
      iconColor: LANDING_TEAL,
      title: "How Invites Work",
      description:
        "An admin generates a code tied to your email address. It expires after 30 days, works exactly once, and then it's gone. Small on purpose.",
    },
    {
      icon: Lock,
      iconColor: LANDING_PURPLE,
      title: "No Public Registration",
      description:
        "There's no public sign-up. If you want access, reach out and tell me why you'd like to join. I review requests manually and keep access intentionally limited for now.",
    },
  ],
  demoNote:
    "A walkthrough video is coming soon. I'll show the core features and what the day-to-day actually looks like.",
  ctaText: "Have an invite code? Come on in",
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
