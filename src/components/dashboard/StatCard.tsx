import React, { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  count: number;
  hoverCount?: number;
  icon: LucideIcon;
  accentColor: "blue" | "emerald" | "amber" | "purple" | "pink";
  label?: string;
  hoverLabel?: string;
}

const colorClasses = {
  blue: {
    border: "hover:border-blue-500/50",
    shadow: "hover:shadow-blue-500/10",
    titleText: "group-hover:text-blue-500",
  },
  emerald: {
    border: "hover:border-emerald-500/50",
    shadow: "hover:shadow-emerald-500/10",
    titleText: "group-hover:text-emerald-500",
  },
  amber: {
    border: "hover:border-amber-500/50",
    shadow: "hover:shadow-amber-500/10",
    titleText: "group-hover:text-amber-500",
  },
  purple: {
    border: "hover:border-primary/50",
    shadow: "hover:shadow-primary/10",
    titleText: "group-hover:text-primary",
  },
  primary: {
    border: "hover:border-primary/50",
    shadow: "hover:shadow-primary/10",
    titleText: "group-hover:text-primary",
  },
  pink: {
    border: "hover:border-pink-500/50",
    shadow: "hover:shadow-pink-500/10",
    titleText: "group-hover:text-pink-500",
  },
};

/**
 * Animated stat card with counting animation
 * Non-clickable, displays metrics with smooth number transitions
 * Hover to see alternative stat
 *
 * Memoized: Rendered in grid of 3 cards, prevents rerenders when count/hoverCount unchanged
 */
const StatCardComponent: React.FC<StatCardProps> = ({
  title,
  count,
  hoverCount,
  icon: _icon,
  accentColor,
  label,
  hoverLabel,
}) => {
  const motionCount = useMotionValue(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Initial load animation
  useEffect(() => {
    const controls = animate(motionCount, count, {
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1], // Smooth easing
    });

    const unsubscribe = motionCount.on("change", (latest) => {
      setDisplayCount(Math.round(latest));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, motionCount]);

  // Hover animation
  useEffect(() => {
    if (hoverCount === undefined) return;

    const targetValue = isHovered ? hoverCount : count;
    const controls = animate(motionCount, targetValue, {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => {
      controls.stop();
    };
  }, [isHovered, count, hoverCount, motionCount]);

  const colors = colorClasses[accentColor];
  const currentLabel = isHovered && hoverLabel ? hoverLabel : label;

  return (
    <motion.div
      className={`group relative p-6 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 ${colors.border} hover:shadow-lg ${colors.shadow} transition-all duration-300 text-center`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
          {displayCount}
        </div>
        <div
          className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${colors.titleText} transition-colors duration-300`}
        >
          {currentLabel || title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </div>
      </div>
    </motion.div>
  );
};

// Memoize with custom comparison to prevent rerenders when count and hoverCount haven't changed
export const StatCard = React.memo(
  StatCardComponent,
  (prevProps, nextProps) =>
    prevProps.count === nextProps.count &&
    prevProps.hoverCount === nextProps.hoverCount &&
    prevProps.title === nextProps.title &&
    prevProps.accentColor === nextProps.accentColor &&
    prevProps.label === nextProps.label &&
    prevProps.hoverLabel === nextProps.hoverLabel
);
