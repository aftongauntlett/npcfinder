/**
 * Animation utilities and constants for Framer Motion
 * Provides consistent spring configs and animation variants across the app
 */

import { Variants, Transition } from "framer-motion";

/**
 * Spring configurations for different animation types
 */
export const springs = {
  // Snappy - Quick, responsive (buttons, small UI elements)
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
  // Bouncy - Playful with slight overshoot (cards, modals)
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
  },
  // Smooth - Gentle, elegant (page transitions, large elements)
  smooth: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
  },
  // Gentle - Very subtle (backgrounds, overlays)
  gentle: {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
  },
} as const;

/**
 * Common animation variants for reuse
 */
export const variants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,

  // Scale (cards, buttons)
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  } as Variants,

  // Slide up (modals, drawers)
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  } as Variants,

  // Slide down (dropdowns, menus)
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  } as Variants,

  // Stagger children (for lists, grids)
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  } as Variants,

  // Item within stagger container
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  } as Variants,
} as const;

/**
 * Hover/tap animations for interactive elements
 */
export const interactions = {
  // Subtle lift (cards)
  lift: {
    whileHover: { y: -4, transition: springs.snappy },
    whileTap: { scale: 0.98, transition: springs.snappy },
  },
  // Scale up (buttons, small cards)
  scaleUp: {
    whileHover: { scale: 1.02, transition: springs.snappy },
    whileTap: { scale: 0.98, transition: springs.snappy },
  },
  // Glow effect (action buttons)
  glow: {
    whileHover: {
      boxShadow: "0 0 20px rgba(var(--color-primary-rgb), 0.3)",
      transition: springs.gentle,
    },
  },
  // Press down (clickable items)
  press: {
    whileTap: { scale: 0.95, transition: springs.snappy },
  },
} as const;

/**
 * Page transition variants
 */
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: springs.smooth,
} as const;

/**
 * Modal/overlay transitions
 */
export const modalTransitions = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: springs.bouncy,
  },
} as const;

/**
 * Helper to create stagger delay
 */
export const getStaggerDelay = (index: number, baseDelay = 0.05): number => {
  return index * baseDelay;
};

/**
 * Helper to create custom spring transition
 */
export const createSpring = (
  stiffness: number,
  damping: number
): Transition => ({
  type: "spring",
  stiffness,
  damping,
});
