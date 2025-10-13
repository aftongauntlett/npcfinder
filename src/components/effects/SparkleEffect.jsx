import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Reusable sparkle/shimmer effect component
 * Creates subtle floating particles on hover
 */
const SparkleEffect = ({ children, className = "", intensity = "medium" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);

  const intensityMap = {
    low: 3,
    medium: 5,
    high: 8,
  };

  const particleCount = intensityMap[intensity] || 5;

  useEffect(() => {
    if (isHovered) {
      // Generate random particles when hovering
      const newParticles = Array.from({ length: particleCount }, () => ({
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 2,
      }));
      setParticles(newParticles);
    }
  }, [isHovered, particleCount]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Shimmer overlay */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Floating particles */}
      {isHovered &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `sparkle ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          >
            <div className="w-full h-full rounded-full bg-amber-200/60 dark:bg-amber-300/40 blur-[1px]" />
          </div>
        ))}
    </div>
  );
};

SparkleEffect.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  intensity: PropTypes.oneOf(["low", "medium", "high"]),
};

export default SparkleEffect;
