import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

const STAR_COUNT = 18;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

const Star = ({
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
);

// Memoized star generation to prevent recreation on re-renders
const generateStars = () => {
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

const StarryBackground = React.memo(function StarryBackground() {
  const { resolvedTheme } = useTheme();

  // Only show stars in dark mode
  if (resolvedTheme !== "dark") {
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
