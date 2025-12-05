/**
 * BentoBoardCard Component
 * Modern, sleek board card with glass morphism and sparkle effects
 * Inspired by Linear and Apple design systems
 */

import React, { useState } from "react";
import { motion } from "framer-motion";

interface BentoBoardCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  title: string;
  description?: string;
  taskCount: number;
  boardType: "grid" | "list";
  onClick: () => void;
}

export const BentoBoardCard: React.FC<BentoBoardCardProps> = ({
  icon: Icon,
  iconColor,
  title,
  description,
  taskCount,
  boardType,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    // Small delay for animation to play before navigation
    setTimeout(() => {
      onClick();
      setIsClicked(false);
    }, 200);
  };

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer group hover:-translate-y-0.5 transition-transform duration-200"
      animate={{
        scale: isClicked ? 0.95 : 1,
        opacity: isClicked ? 0.7 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Glass morphism card */}
      <div
        className="relative overflow-hidden rounded-[20px] p-6 transition-all duration-300"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${
            isHovered ? iconColor + "40" : "rgba(255, 255, 255, 0.1)"
          }`,
          boxShadow: isHovered
            ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px ${iconColor}20`
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Board type badge - top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide backdrop-blur-sm bg-white/5 border border-white/10 text-gray-400">
            {boardType}
          </div>
        </div>

        {/* Content */}
        <div className="relative space-y-4">
          {/* Icon with glow effect */}
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
            style={{
              background: `${iconColor}15`,
              border: `1px solid ${iconColor}30`,
            }}
            animate={{
              rotate: isHovered ? [0, -3, 3, -3, 0] : 0,
            }}
            transition={{
              rotate: { duration: 0.5, ease: "easeInOut" },
            }}
          >
            {/* Icon glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl blur-xl"
              style={{ background: iconColor, opacity: 0 }}
              animate={{ opacity: isHovered ? 0.4 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <Icon
              width={32}
              height={32}
              style={{ color: iconColor, strokeWidth: 2 }}
            />
          </motion.div>

          {/* Title and description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Task count badge - bottom */}
          <div className="pt-4 border-t border-white/5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: taskCount > 0 ? iconColor : "#6B7280",
                  boxShadow: taskCount > 0 ? `0 0 8px ${iconColor}80` : "none",
                }}
              />
              <span className="text-xs font-medium text-gray-300">
                {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BentoBoardCard;
