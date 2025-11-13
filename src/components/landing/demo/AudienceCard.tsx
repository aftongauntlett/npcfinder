import type { Icon } from "@phosphor-icons/react";
import ModernCard from "./ModernCard";

interface AudienceCardProps {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export default function AudienceCard({
  icon,
  iconColor,
  title,
  description,
}: AudienceCardProps) {
  return (
    <ModernCard
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description}
    />
  );
}
