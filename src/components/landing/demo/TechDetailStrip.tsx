import { useState } from "react";
import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";
import {
  LANDING_TEAL,
  LANDING_PURPLE,
  LANDING_PEACH,
} from "../../../data/landingTheme";

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

  // Brand colors for bullets (cycling pattern)
  const bulletColors = [LANDING_TEAL, LANDING_PURPLE, LANDING_PEACH];

  // Unique IDs for accessibility
  const headerId = `tech-${title.replace(/\s+/g, "-").toLowerCase()}-header`;
  const panelId = `tech-${title.replace(/\s+/g, "-").toLowerCase()}-panel`;

  // Calculate max height with some padding
  const maxHeight = items.length * 40;

  return (
    <div className="relative overflow-hidden">
      {/* Colored accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: iconColor }}
        animate={{ opacity: isExpanded ? 1 : 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Content container */}
      <motion.div
        className="pl-6 pr-6 py-6 rounded-lg"
        animate={{
          backgroundColor: isExpanded
            ? "rgba(30, 41, 59, 0.5)"
            : "rgba(30, 41, 59, 0.4)",
          borderColor: isExpanded
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
          boxShadow: isExpanded
            ? `0 0 30px -5px rgba(93, 204, 204, 0.15)`
            : "0 0 0px 0px rgba(93, 204, 204, 0)",
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
        }}
      >
        {/* Header - now a proper button */}
        <motion.button
          type="button"
          className="flex items-center gap-4 mb-4 w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white rounded"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          id={headerId}
        >
          <motion.div
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
            animate={{
              backgroundColor: isExpanded ? `${iconColor}20` : `${iconColor}10`,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.div
              animate={{ scale: isExpanded ? 1.1 : 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Icon
                className="w-6 h-6"
                style={{ color: iconColor }}
                weight="duotone"
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>
          <motion.h4
            className="text-xl font-semibold"
            animate={{ color: isExpanded ? iconColor : "#ffffff" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {title}
          </motion.h4>
        </motion.button>

        {/* Expandable content with brand-colored bullets */}
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="overflow-hidden"
          animate={{
            maxHeight: isExpanded ? `${maxHeight}px` : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ul className="space-y-4 pl-14">
            {items.map((item, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-3 text-gray-300 hover:translate-x-1 transition-all duration-200 hover:text-white"
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                  x: isExpanded ? 0 : -10,
                }}
                transition={{
                  duration: 0.3,
                  delay: isExpanded ? index * 0.05 : 0,
                  ease: "easeOut",
                }}
              >
                <span
                  className="font-bold flex-shrink-0"
                  style={{
                    color: bulletColors[index % 3],
                  }}
                  aria-hidden="true"
                >
                  -
                </span>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
