import { useState, type ReactNode, type ElementType } from "react";
import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

interface ModernCardProps {
  iconColor: string;
  title: string;
  description?: string;
  icon?: Icon;
  iconWeight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  children?: ReactNode;
  onClick?: () => void;
  as?: ElementType;
  variant?: "default" | "compact";
}

export default function ModernCard({
  iconColor,
  title,
  description,
  icon: Icon,
  iconWeight = "duotone",
  children,
  onClick,
  as = "div",
  variant = "default",
}: ModernCardProps) {
  const Component = as;
  const isInteractive = !!onClick;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Component
    >
      <motion.div
        className={`relative bg-slate-800/40 border border-white/10 rounded-lg overflow-hidden transform-gpu ${
          isInteractive ? "cursor-pointer" : ""
        } ${variant === "compact" ? "p-4" : "p-5"}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{
          backgroundColor: "rgba(30, 41, 59, 0.6)",
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), -4px 0 12px -2px ${iconColor}40`,
        }}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        style={{
          transition:
            "background-color 400ms ease-out, box-shadow 400ms ease-out",
        }}
      >
        {/* Slide-up colored border */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 origin-bottom"
          style={{ backgroundColor: iconColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon Container (optional) */}
          {Icon && (
            <div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-300 ease-out"
              style={{
                backgroundColor: `${iconColor}15`,
                borderColor: `${iconColor}30`,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: iconColor }}
                  weight={iconWeight}
                  aria-hidden="true"
                />
              </motion.div>
            </div>
          )}

          {/* Text Content */}
          <div className="flex-1 text-left">
            <h4
              id={`card-${title.replace(/\s+/g, "-").toLowerCase()}`}
              className="text-lg font-semibold mb-2 transition-colors duration-400 ease-out"
              style={{ color: isHovered ? iconColor : "#ffffff" }}
            >
              {title}
            </h4>
            {description && (
              <p className="text-gray-300 text-sm leading-relaxed">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </motion.div>
    </Component>
  );
}
