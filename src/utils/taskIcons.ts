import {
  CheckCircleIcon,
  ListChecksIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  HouseIcon,
  GearIcon,
  PencilSimpleIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  LightbulbIcon,
  FireIcon,
  LightningIcon,
  SparkleIcon,
  SnowflakeIcon,
  DropIcon,
  type Icon,
} from "@phosphor-icons/react";

export type IconOption = {
  name: string;
  icon: Icon;
  category?: string;
};

export const TASK_ICONS: IconOption[] = [
  { name: "CheckCircle", icon: CheckCircleIcon },
  { name: "ListChecks", icon: ListChecksIcon },
  { name: "Calendar", icon: CalendarIcon },
  { name: "Clock", icon: ClockIcon },
  { name: "Briefcase", icon: BriefcaseIcon },
  { name: "House", icon: HouseIcon },
  { name: "Gear", icon: GearIcon },
  { name: "PencilSimple", icon: PencilSimpleIcon },
  { name: "BookOpen", icon: BookOpenIcon },
  { name: "ShoppingCart", icon: ShoppingCartIcon },
  { name: "Lightbulb", icon: LightbulbIcon },
  { name: "Fire", icon: FireIcon },
  { name: "Lightning", icon: LightningIcon },
  { name: "Sparkle", icon: SparkleIcon },
  { name: "Snowflake", icon: SnowflakeIcon },
  { name: "Drop", icon: DropIcon },
];

export function getTaskIconOptionByName(
  name: string | null | undefined
): IconOption | null {
  if (!name) return null;
  return TASK_ICONS.find((opt) => opt.name === name) || null;
}
