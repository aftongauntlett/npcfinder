import {
  ShieldCheckIcon as ShieldCheck,
  DatabaseIcon as Database,
  EyeSlashIcon as EyeSlash,
  StackIcon as Stack,
  type Icon,
} from "@phosphor-icons/react";
import {
  LANDING_TEAL,
  LANDING_PEACH,
  LANDING_PURPLE,
  LANDING_BLUE,
} from "./landingTheme";

export interface PrivacyPoint {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export interface PrivacyData {
  title: string;
  description: string;
  points: PrivacyPoint[];
}

export const landingPrivacy: PrivacyData = {
  title: "Why It's Private",
  description:
    "NPC Finder is intentionally invite-only. It keeps the space small and trusted while avoiding public social pressure.",
  points: [
    {
      icon: ShieldCheck,
      iconColor: LANDING_TEAL,
      title: "Small Trusted Access",
      description:
        "Accounts are invite-only so the app stays intentional while features continue to evolve.",
    },
    {
      icon: Database,
      iconColor: LANDING_PEACH,
      title: "Your Data Is Not a Product",
      description:
        "No ad network, no data resale, and no incentive to optimize for attention metrics.",
    },
    {
      icon: Stack,
      iconColor: LANDING_BLUE,
      title: "No Public Performance Layer",
      description:
        "You can keep notes and ratings for yourself without turning it into a public persona.",
    },
    {
      icon: EyeSlash,
      iconColor: LANDING_PURPLE,
      title: "Private by Default",
      description:
        "Tracker data is personal by default, and sharing is explicit and scoped to playlists.",
    },
  ],
};
