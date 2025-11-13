import { useState } from "react";
import type { Icon } from "@phosphor-icons/react";

interface TechDetailStripProps {
  icon: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

export default function TechDetailStrip({
  icon: Icon,
  iconColor,
  title,
  items,
}: TechDetailStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Rainbow colors for bullets (cycling pattern)
  const rainbowColors = ["#5DCCCC", "#A78BDD", "#FFB088"];

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Colored accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ease-out"
        style={{
          backgroundColor: iconColor,
          opacity: isExpanded ? 1 : 0.3,
        }}
      />

      {/* Content container - matches the beautiful card from identity section */}
      <div
        className="pl-6 pr-6 py-6 rounded-lg transition-all duration-500 ease-out"
        style={{
          backgroundColor: isExpanded
            ? "rgba(30, 41, 59, 0.5)"
            : "rgba(30, 41, 59, 0.4)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: isExpanded
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
          boxShadow: isExpanded
            ? `0 0 30px -5px rgba(93, 204, 204, 0.15)`
            : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 ease-out"
            style={{
              backgroundColor: isExpanded ? `${iconColor}20` : `${iconColor}10`,
            }}
          >
            <Icon
              className="w-6 h-6 transition-transform duration-300 ease-out"
              style={{
                color: iconColor,
                transform: isExpanded ? "scale(1.1)" : "scale(1)",
              }}
              weight="duotone"
            />
          </div>
          <h4
            className="text-xl font-semibold transition-colors duration-300 ease-out"
            style={{
              color: isExpanded ? iconColor : "#ffffff",
            }}
          >
            {title}
          </h4>
        </div>

        {/* Expandable content with rainbow bullets */}
        <div
          className="overflow-hidden transition-all duration-500 ease-out"
          style={{
            maxHeight: isExpanded ? `${items.length * 40}px` : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <ul className="space-y-4 pl-14">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-gray-300 hover:translate-x-1 transition-all duration-200 hover:text-white"
                style={{
                  transitionDelay: isExpanded ? `${index * 50}ms` : "0ms",
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? "translateX(0)" : "translateX(-10px)",
                  transition:
                    "opacity 300ms ease-out, transform 300ms ease-out, color 200ms ease-out",
                }}
              >
                <span
                  className="font-bold flex-shrink-0"
                  style={{
                    color: rainbowColors[index % 3],
                  }}
                >
                  -
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
