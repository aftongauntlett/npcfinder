import {
  KeyIcon as Key,
  LockOpenIcon as LockOpen,
  type Icon,
} from "@phosphor-icons/react";
import { LANDING_TEAL, LANDING_PURPLE } from "./landingTheme";

export interface AvailabilityPoint {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface AvailabilityData {
  title: string;
  description: string;
  points: AvailabilityPoint[];
}

export interface DocLink {
  label: string;
  href: string;
  description: string;
}

export const landingAvailability: AvailabilityData = {
  title: "Project Status & Source",
  description:
    "This project is public on GitHub and actively evolving. The product stays private by design while core workflows are refined.",
  points: [
    {
      icon: Key,
      iconColor: LANDING_TEAL,
      title: "Private Access Model",
      description:
        "Access is invite-only for now so collaboration stays trusted while the product matures. If you have questions or want to test it out, contact me through my portfolio.",
      ctaLabel: "Contact",
      ctaHref: "https://www.aftongauntlett.com/#contact",
    },
    {
      icon: LockOpen,
      iconColor: LANDING_PURPLE,
      title: "Built in the Open",
      description:
        "The source code is public on GitHub and development happens in the open. Features are actively iterated as the app continues to evolve.",
      ctaLabel: "View Source",
      ctaHref: "https://github.com/aftongauntlett/npcfinder",
    },
  ],
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
