import React from "react";
import type { Icon } from "@phosphor-icons/react";

interface ArchitectureCardProps {
  icon: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

/**
 * Architecture card component for DemoLanding technical details section
 * Minimal text-only design - no icons
 */
export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  iconColor,
  title,
  items,
}) => {
  return (
    <div
      className="group space-y-4 bg-slate-800/40 border border-white/10 border-l-4 rounded-lg p-8 hover:bg-slate-800/60 hover:scale-[1.02] hover:shadow-xl transform-gpu"
      style={{
        borderLeftColor: iconColor,
        transition:
          "background-color 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.4s ease-out, border-left-color 0.4s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), -4px 0 12px -2px ${iconColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <h4 className="text-xl font-semibold mb-6">{title}</h4>
      <ul className="space-y-3 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span
              className="mt-0.5 flex-shrink-0 font-bold"
              style={{ color: iconColor }}
            >
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
