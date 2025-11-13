import React, { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface FeatureBlockProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

/**
 * Feature block component for DemoLanding page
 * Displays icon, title with gradient line, and list of feature items
 */
export const FeatureBlock: React.FC<FeatureBlockProps> = ({
  icon: Icon,
  iconColor,
  title,
  items,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Convert hex color to RGB for opacity variations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  };

  const rgb = hexToRgb(iconColor);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-12 items-start justify-between">
        {/* Content column */}
        <div className="flex-1 max-w-3xl">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0"
              style={{
                background: `linear-gradient(to bottom right, rgba(${rgbString}, 0.2), rgba(${rgbString}, 0.05))`,
                borderColor: `rgba(${rgbString}, 0.2)`,
              }}
            >
              <Icon className="w-6 h-6" style={{ color: iconColor }} />
            </div>
            <h4
              className="text-2xl font-semibold transition-colors duration-300"
              style={{
                color: isHovered ? iconColor : "white",
              }}
            >
              {title}
            </h4>
            <div
              className="flex-1 h-px transition-all duration-500"
              style={{
                background: `linear-gradient(to right, rgba(${rgbString}, ${
                  isHovered ? "0.6" : "0.4"
                }), rgba(${rgbString}, 0.1), transparent)`,
              }}
            />
          </div>
          <div className="space-y-3 pl-16">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200"
              >
                <span
                  className="mt-1 flex-shrink-0"
                  style={{ color: iconColor }}
                >
                  —
                </span>
                <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Large decorative icon */}
        <div className="hidden lg:block flex-shrink-0">
          <div
            className="relative w-32 h-32 rounded-3xl border flex items-center justify-center transition-all duration-700"
            style={{
              background: `linear-gradient(to bottom right, rgba(${rgbString}, 0.1), rgba(${rgbString}, 0.05))`,
              borderColor: `rgba(${rgbString}, ${isHovered ? "0.4" : "0.2"})`,
              transform: isHovered ? "scale(1.05)" : "scale(1)",
              boxShadow: isHovered
                ? `0 25px 50px -12px rgba(${rgbString}, 0.2)`
                : "0 0 0 rgba(0, 0, 0, 0)",
            }}
          >
            <Icon
              className="transition-all duration-700"
              style={{
                color: isHovered ? iconColor : `rgba(${rgbString}, 0.4)`,
                transform: isHovered ? "rotate(3deg)" : "rotate(0deg)",
              }}
              strokeWidth={1.5}
              size={64}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
