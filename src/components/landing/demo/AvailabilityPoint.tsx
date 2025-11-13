import type { Icon } from "@phosphor-icons/react";

interface AvailabilityPointProps {
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export default function AvailabilityPoint({
  icon: Icon,
  iconColor,
  title,
  description,
}: AvailabilityPointProps) {
  return (
    <div className="group bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300">
      {/* Horizontal Layout for Desktop, Vertical for Mobile */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Icon Container */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${iconColor}20, ${iconColor}10)`,
            border: `1px solid ${iconColor}30`,
          }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: iconColor }}
            weight="duotone"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h5 className="text-lg font-semibold text-white mb-2">{title}</h5>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
