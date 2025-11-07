import React from "react";
import { motion } from "framer-motion";
import { variants, springs } from "../../utils/animations";

/**
 * Bento Grid Layout Component
 * 
 * Creates a modern bento-box style grid with flexible cell sizing.
 * Supports different span sizes for varied visual hierarchy.
 * 
 * Usage:
 * ```tsx
 * <BentoGrid>
 *   <BentoCard size="large">Featured content</BentoCard>
 *   <BentoCard>Standard content</BentoCard>
 *   <BentoCard size="wide">Wide content</BentoCard>
 * </BentoGrid>
 * ```
 */

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean; // Enable stagger animation on mount
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = "",
  animate = true,
}) => {
  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)] ${className}`}
      variants={animate ? variants.staggerContainer : undefined}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
    >
      {children}
    </motion.div>
  );
};

/**
 * Bento Card Sizes
 * - small: 1x1 (default)
 * - wide: 2x1 (spans 2 columns)
 * - tall: 1x2 (spans 2 rows)
 * - large: 2x2 (spans 2 columns and 2 rows)
 * - full: Full width (spans all columns)
 */
export type BentoSize = "small" | "wide" | "tall" | "large" | "full";

interface BentoCardProps {
  children: React.ReactNode;
  size?: BentoSize;
  className?: string;
  onClick?: () => void;
  interactive?: boolean; // Enable hover/tap animations
  gradient?: string; // Optional gradient background
}

const sizeClasses: Record<BentoSize, string> = {
  small: "", // 1x1 default
  wide: "md:col-span-2", // 2x1
  tall: "md:row-span-2", // 1x2
  large: "md:col-span-2 md:row-span-2", // 2x2
  full: "md:col-span-3", // Full width
};

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  size = "small",
  className = "",
  onClick,
  interactive = true,
  gradient,
}) => {
  const isClickable = !!onClick;

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        p-6
        ${sizeClasses[size]}
        ${isClickable ? "cursor-pointer" : ""}
        ${gradient ? `bg-gradient-to-br ${gradient}` : ""}
        ${className}
      `}
      variants={variants.staggerItem}
      onClick={onClick}
      whileHover={
        interactive
          ? {
              y: -4,
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
              transition: springs.snappy,
            }
          : undefined
      }
      whileTap={
        interactive && isClickable
          ? { scale: 0.98, transition: springs.snappy }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
};

/**
 * Bento Card Content Wrappers for consistent spacing
 */
export const BentoCardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const BentoCardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h3
    className={`text-xl font-semibold text-gray-900 dark:text-white mb-2 ${className}`}
  >
    {children}
  </h3>
);

export const BentoCardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <p className={`text-gray-600 dark:text-gray-300 text-sm ${className}`}>
    {children}
  </p>
);

export const BentoCardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`flex-1 ${className}`}>{children}</div>
);

export const BentoCardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);
