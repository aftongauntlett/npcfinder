import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";
import { hexToRgb } from "../../../data/landingTheme";

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

  // Convert hex color to RGB for opacity variations (memoized)
  const rgbString = useMemo(() => {
    const rgb = hexToRgb(iconColor);
    return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "255, 255, 255";
  }, [iconColor]);

  // Check for reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  return (
    <article
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-labelledby={`feature-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className="flex items-start gap-12">
        {/* Content column */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-5">
            <h4
              id={`feature-${title.replace(/\s+/g, "-").toLowerCase()}`}
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
                  aria-hidden="true"
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
          <div
            className="hidden lg:flex items-center justify-center flex-shrink-0 w-40 h-40 relative"
            aria-hidden="true"
          >
            {/* Middle pulsing glow */}
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${rgbString}, 0.08), transparent 70%)`,
              }}
              animate={
                !prefersReducedMotion && isHovered
                  ? {
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }
                  : { scale: 1, opacity: 0.1 }
              }
              transition={{
                duration: 2,
                repeat: !prefersReducedMotion && isHovered ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Inner glow */}
            <motion.div
              className="absolute inset-6 rounded-full blur-xl"
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
              className="relative z-10 flex items-center justify-center w-24 h-24 rounded-[22px]"
              style={{
                background: `linear-gradient(135deg, rgba(${rgbString}, 0.2), rgba(${rgbString}, 0.08))`,
                border: `1px solid rgba(${rgbString}, 0.16)`,
                boxShadow: isHovered
                  ? `0 16px 44px -10px rgba(${rgbString}, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)`
                  : `0 8px 24px -10px rgba(${rgbString}, 0.18)`,
              }}
              animate={
                !prefersReducedMotion && isHovered
                  ? {
                      rotateY: [0, 10, -10, 0],
                      rotateX: [0, -5, 5, 0],
                      scale: 1.05,
                    }
                  : { rotateY: 0, rotateX: 0, scale: 1 }
              }
              transition={{
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {/* Icon */}
              <motion.div
                animate={
                  !prefersReducedMotion && isHovered
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0],
                      }
                    : { scale: 1, rotate: 0 }
                }
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Icon
                  weight="duotone"
                  size={58}
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
            {!prefersReducedMotion && isHovered && (
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
    </article>
  );
};
