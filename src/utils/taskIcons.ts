import {
  AlarmIcon as Alarm,
  BookIcon as Book,
  BrainIcon as Brain,
  BriefcaseIcon as Briefcase,
  BugIcon as Bug,
  CheckCircleIcon as CheckCircle,
  CodeIcon as Code,
  CompassIcon as Compass,
  CookieIcon as Cookie,
  CrownIcon as Crown,
  FireIcon as Fire,
  FlagIcon,
  FlashlightIcon as Flashlight,
  GearIcon as Gear,
  GiftIcon as Gift,
  HeartIcon as Heart,
  LeafIcon as Leaf,
  LightningIcon as Lightning,
  ListChecksIcon as ListChecks,
  MoonIcon as Moon,
  MusicNoteIcon as MusicNote,
  PaintBrushIcon as PaintBrush,
  PenNibIcon as PenNib,
  RocketIcon as Rocket,
  ShoppingCartIcon as ShoppingCart,
  StarIcon as Star,
  TargetIcon as Target,
  TrophyIcon as Trophy,
  type Icon,
} from "@phosphor-icons/react";

export type IconOption = {
  name: string;
  icon: Icon;
  category?: string;
};

export const TASK_ICONS: IconOption[] = [
  // General
  { name: "ListChecks", icon: ListChecks, category: "General" },
  { name: "CheckCircle", icon: CheckCircle, category: "General" },
  { name: "Gear", icon: Gear, category: "General" },
  { name: "Compass", icon: Compass, category: "General" },

  // Priority
  { name: "Flag", icon: FlagIcon, category: "Priority" },
  { name: "Star", icon: Star, category: "Priority" },
  { name: "Target", icon: Target, category: "Priority" },
  { name: "Trophy", icon: Trophy, category: "Priority" },
  { name: "Crown", icon: Crown, category: "Priority" },

  // Work
  { name: "Briefcase", icon: Briefcase, category: "Work" },
  { name: "Code", icon: Code, category: "Work" },
  { name: "Bug", icon: Bug, category: "Work" },
  { name: "Alarm", icon: Alarm, category: "Work" },

  // Personal
  { name: "Heart", icon: Heart, category: "Personal" },
  { name: "Leaf", icon: Leaf, category: "Personal" },
  { name: "Moon", icon: Moon, category: "Personal" },
  { name: "ShoppingCart", icon: ShoppingCart, category: "Personal" },
  { name: "Gift", icon: Gift, category: "Personal" },
  { name: "Cookie", icon: Cookie, category: "Personal" },

  // Creative
  { name: "PaintBrush", icon: PaintBrush, category: "Creative" },
  { name: "PenNib", icon: PenNib, category: "Creative" },
  { name: "MusicNote", icon: MusicNote, category: "Creative" },
  { name: "Book", icon: Book, category: "Creative" },
  { name: "Brain", icon: Brain, category: "Creative" },

  // Energy
  { name: "Lightning", icon: Lightning, category: "Energy" },
  { name: "Flash", icon: Flashlight, category: "Energy" },
  { name: "Fire", icon: Fire, category: "Energy" },
  { name: "Rocket", icon: Rocket, category: "Energy" },
];

export function getTaskIconOptionByName(
  name: string | null | undefined
): IconOption | null {
  if (!name) return null;
  return TASK_ICONS.find((opt) => opt.name === name) || null;
}
