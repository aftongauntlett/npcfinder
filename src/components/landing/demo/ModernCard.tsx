import { useState, type ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";

interface ModernCardProps {
  iconColor: string;
  title: string;
  description?: string;
  icon?: Icon;
  iconWeight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  children?: ReactNode;
}

export default function ModernCard({
  iconColor,
  title,
  description,
  icon: Icon,
  iconWeight = "duotone",
  children,
}: ModernCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-slate-800/40 border border-white/10 rounded-lg p-5 overflow-hidden transform-gpu"
      style={{
        transition:
          "background-color 400ms ease-out, box-shadow 400ms ease-out",
        backgroundColor: isHovered
          ? "rgba(30, 41, 59, 0.6)"
          : "rgba(30, 41, 59, 0.4)",
        boxShadow: isHovered
          ? `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), -4px 0 12px -2px ${iconColor}40`
          : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide-up colored border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 origin-bottom"
        style={{
          backgroundColor: iconColor,
          transform: isHovered ? "scaleY(1)" : "scaleY(0)",
          transition: "transform 500ms ease-out",
        }}
      />

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon Container (optional) */}
        {Icon && (
          <div
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-300 ease-out"
            style={{
              backgroundColor: `${iconColor}15`,
              borderColor: `${iconColor}30`,
            }}
          >
            <Icon
              className="w-6 h-6 transition-transform duration-300 ease-out"
              style={{
                color: iconColor,
                transform: isHovered ? "scale(1.1)" : "scale(1)",
              }}
              weight={iconWeight}
            />
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 text-left">
          <h4
            className="text-lg font-semibold mb-2"
            style={{
              color: isHovered ? iconColor : "#ffffff",
              transition: "color 400ms ease-out",
            }}
          >
            {title}
          </h4>
          {description && (
            <p className="text-gray-300 text-sm leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
