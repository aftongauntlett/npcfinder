import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

interface FeatureBlockProps {
  icon?: Icon;
  iconColor: string;
  title: string;
  items: string[];
}

/**
 * Feature block component for DemoLanding page
 * Enterprise-level design with sophisticated icon animations on right side
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
    const normalizedHex = hex.replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
    );

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      normalizedHex
    );
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
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-16">
        {/* Content column */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-5">
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
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-3 group/item">
                <span
                  className="mt-1 flex-shrink-0"
                  style={{ color: iconColor }}
                >
                  -
                </span>
                <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Large animated icon on the right */}
        {Icon && (
          <div className="hidden lg:flex items-center justify-center flex-shrink-0 w-48 h-48 relative">
            {/* Middle pulsing glow */}
            <motion.div
              className="absolute inset-4 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${rgbString}, 0.08), transparent 70%)`,
              }}
              animate={{
                scale: isHovered ? [1, 1.1, 1] : 1,
                opacity: isHovered ? [0.5, 0.8, 0.5] : 0.1,
              }}
              transition={{
                duration: 2,
                repeat: isHovered ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Inner glow */}
            <motion.div
              className="absolute inset-8 rounded-full blur-xl"
              style={{
                backgroundColor: iconColor,
              }}
              animate={{
                opacity: isHovered ? 0.3 : 0.02,
                scale: isHovered ? 1.2 : 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* Icon container with 3D effect */}
            <motion.div
              className="relative z-10 flex items-center justify-center w-32 h-32 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, rgba(${rgbString}, 0.2), rgba(${rgbString}, 0.08))`,
                border: `1px solid rgba(${rgbString}, 0.2)`,
                boxShadow: isHovered
                  ? `0 20px 60px -10px rgba(${rgbString}, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
                  : `0 10px 30px -10px rgba(${rgbString}, 0.2)`,
              }}
              animate={{
                rotateY: isHovered ? [0, 10, -10, 0] : 0,
                rotateX: isHovered ? [0, -5, 5, 0] : 0,
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {/* Icon */}
              <motion.div
                animate={{
                  scale: isHovered ? [1, 1.1, 1] : 1,
                  rotate: isHovered ? [0, -5, 5, 0] : 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Icon
                  weight="duotone"
                  size={80}
                  style={{
                    color: iconColor,
                    filter: isHovered
                      ? `drop-shadow(0 0 20px rgba(${rgbString}, 0.6))`
                      : "none",
                  }}
                  className="transition-all duration-500"
                />
              </motion.div>
            </motion.div>

            {/* Floating particles */}
            {isHovered && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: iconColor,
                      left: `${30 + i * 20}%`,
                      top: `${20 + i * 25}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [-20, -60],
                      x: [(i - 1) * 20, (i - 1) * 40],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
