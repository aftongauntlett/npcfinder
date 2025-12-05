/**
 * BoardIcon Component
 * Animated board icon with glow effect similar to landing page
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface BoardIconProps {
  icon: LucideIcon;
  color: string;
  size?: "sm" | "md" | "lg";
}

export const BoardIcon: React.FC<BoardIconProps> = ({
  icon: Icon,
  color,
  size = "md",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-2xl border transition-all duration-300 ease-out relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
          opacity: 0,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <div>
        <Icon size={iconSizes[size]} style={{ color }} strokeWidth={2} />
      </div>
    </motion.div>
  );
};

export default BoardIcon;
