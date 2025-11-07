import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { springs } from "../../utils/animations";

/**
 * MotionCard - Animated wrapper for any card component
 * 
 * Provides consistent hover/tap animations for cards throughout the app.
 * Can be used as a drop-in replacement for regular divs with automatic
 * micro-interactions.
 * 
 * @example
 * ```tsx
 * <MotionCard variant="lift">
 *   <h3>My Card</h3>
 *   <p>Content goes here</p>
 * </MotionCard>
 * ```
 */

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: React.ReactNode;
  variant?: "lift" | "scale" | "subtle" | "none";
  delay?: number; // Stagger delay for list items
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  variant = "lift",
  delay = 0,
  className = "",
  ...props
}) => {
  const getAnimationProps = () => {
    switch (variant) {
      case "lift":
        return {
          whileHover: { y: -4, transition: springs.snappy },
          whileTap: { scale: 0.98, transition: springs.snappy },
        };
      case "scale":
        return {
          whileHover: { scale: 1.02, transition: springs.snappy },
          whileTap: { scale: 0.98, transition: springs.snappy },
        };
      case "subtle":
        return {
          whileHover: { y: -2, transition: springs.gentle },
        };
      case "none":
        return {};
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay }}
      {...getAnimationProps()}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * MotionButton - Animated button wrapper
 * Provides tap feedback and optional hover effects
 */
interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "default" | "glow";
}

export const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  return (
    <motion.button
      className={className}
      whileHover={
        variant === "glow"
          ? {
              scale: 1.02,
              boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
              transition: springs.snappy,
            }
          : { scale: 1.02, transition: springs.snappy }
      }
      whileTap={{ scale: 0.98, transition: springs.snappy }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * MotionList - Container for animated list items
 * Automatically staggers children animations
 */
interface MotionListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const MotionList: React.FC<MotionListProps> = ({
  children,
  className = "",
  staggerDelay = 0.05,
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * MotionListItem - Individual list item with fade-in animation
 */
export const MotionListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: springs.smooth },
      }}
    >
      {children}
    </motion.div>
  );
};
