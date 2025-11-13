import type { Icon } from "@phosphor-icons/react";
import ModernCard from "./ModernCard";

interface AvailabilityPointProps {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export default function AvailabilityPoint({
  icon,
  iconColor,
  title,
  description,
}: AvailabilityPointProps) {
  return (
    <ModernCard
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description}
    />
  );
}
