import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Hook for animating a number counting up from 0 to target value
 * Uses Framer Motion's spring physics for smooth, natural animation
 *
 * @param target - The final number to count up to
 * @param duration - Animation duration in seconds (default: 2)
 * @returns MotionValue that can be used with motion components
 */
export function useCountUp(target: number, duration: number = 2) {
  const count = useMotionValue(0);
  const springCount = useSpring(count, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const prevTarget = useRef(target);

  useEffect(() => {
    // Only animate if the target actually changed
    if (prevTarget.current !== target) {
      count.set(target);
      prevTarget.current = target;
    }
  }, [target, count]);

  return springCount;
}
