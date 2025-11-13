import type { Icon } from "@phosphor-icons/react";

interface IdentityBadgeProps {
  label: string;
  icon: Icon;
  color: string;
}

export default function IdentityBadge({
  label,
  icon: Icon,
  color,
}: IdentityBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm hover:scale-105 transition-all duration-200"
      style={{
        backgroundColor: `${color}08`,
        border: `1.5px solid ${color}20`,
        boxShadow: `0 2px 8px ${color}08`,
        transition:
          "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.backgroundColor = `${color}12`;
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}20`;
        e.currentTarget.style.backgroundColor = `${color}08`;
        e.currentTarget.style.boxShadow = `0 2px 8px ${color}08`;
      }}
    >
      <Icon
        className="w-3.5 h-3.5"
        style={{ color, opacity: 0.9 }}
        weight="duotone"
      />
      <span
        className="text-sm font-medium tracking-wide"
        style={{ color, opacity: 0.95 }}
      >
        {label}
      </span>
    </div>
  );
}
