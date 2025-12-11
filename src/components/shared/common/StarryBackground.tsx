import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDevToolsDetection } from "../../../hooks/useDevToolsDetection";
import { usePerformanceMonitor } from "../../../hooks/usePerformanceMonitor";

const STAR_COUNT = 18;

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface StarProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
  twinkleDelay: number;
  color?: string;
  shadowColor?: string;
}

const Star = React.memo<StarProps>(({
  x,
  y,
  size,
  delay,
  duration,
  dx,
  dy,
  twinkleDelay,
  color = "rgba(255,255,255,0.48)",
  shadowColor = "rgba(255,255,255,0.18)",
}) => (
  <motion.div
    style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size * 2}px ${size / 2}px ${shadowColor}`,
    }}
    animate={{
      opacity: [0.18, 0.7, 0.18, 0.7, 0.18],
      scale: [1, 1.2, 1, 1.1, 1],
      x: [0, dx],
      y: [0, dy],
    }}
    transition={{
      opacity: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: duration * 0.7,
        delay: twinkleDelay,
      },
      scale: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: duration * 0.7,
        delay: twinkleDelay,
      },
      x: {
        repeat: Infinity,
        repeatType: "mirror",
        duration,
        delay,
      },
      y: {
        repeat: Infinity,
        repeatType: "mirror",
        duration,
        delay,
      },
    }}
  />
));

interface StarData {
  key: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
  twinkleDelay: number;
}

// Memoized star generation to prevent recreation on re-renders
const generateStars = (): StarData[] => {
  return Array.from({ length: STAR_COUNT }).map((_, i) => {
    const angle = random(0, 2 * Math.PI);
    const distance = random(30, 70); // percent of viewport
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    return {
      key: i,
      x: random(0, 100),
      y: random(0, 100),
      size: random(1.5, 3.5),
      delay: random(0, 6),
      duration: random(12, 22),
      dx,
      dy,
      twinkleDelay: random(0, 8),
    };
  });
};

// Generate stars once and reuse
const stars = generateStars();

/**
 * StarryBackground - Animated starfield for dark mode UI
 * Shows twinkling, drifting stars with reduced motion support
 */
const StarryBackground = React.memo(function StarryBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const shouldPauseAnimations = useDevToolsDetection();

  usePerformanceMonitor({ componentName: "StarryBackground", threshold: 5 });

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setReducedMotion(e.matches);
    };
    setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Hide stars if user prefers reduced motion or DevTools is open
  if (reducedMotion || shouldPauseAnimations) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "none",
      }}
    >
      {stars.map(
        ({ key, x, y, size, delay, duration, dx, dy, twinkleDelay }) => (
          <Star
            key={key}
            x={x}
            y={y}
            size={size}
            delay={delay}
            duration={duration}
            dx={dx}
            dy={dy}
            twinkleDelay={twinkleDelay}
            color="rgba(255,255,255,0.48)"
            shadowColor="rgba(255,255,255,0.18)"
          />
        )
      )}
    </div>
  );
});

export default StarryBackground;
