import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import {
  LANDING_PEACH,
  LANDING_TEAL,
  LANDING_PURPLE,
  LANDING_BLUE,
  withOpacity,
} from "../../data/landingTheme";

interface HeroConstellationProps {
  width?: number;
  height?: number;
  nodeCount?: number;
  animationSpeed?: number;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  displacementX: number;
  displacementY: number;
  maxConnectionDistance: number; // Variable connection range for each node
  twinklePhase: number; // For slow opacity breathing
  twinkleSpeed: number; // Individual twinkle timing
}

interface NodePosition {
  x: number;
  y: number;
  radius: number;
}

// Helper to get design token colors
function getDesignTokenColors() {
  const styles = getComputedStyle(document.documentElement);

  // Fallback colors matching StarryBackground.tsx soft white aesthetic
  const primaryColor =
    styles.getPropertyValue("--color-primary").trim() || "#9333ea";
  const whiteBase = withOpacity("#FFFFFF", 0.85); // Even brighter white
  const whiteShadow = withOpacity("#FFFFFF", 0.45); // Brighter shadow

  // Brand colors from centralized theme (with higher opacity for brightness)
  const peachBase = withOpacity(LANDING_PEACH, 0.85); // 85% opacity
  const peachShadow = withOpacity(LANDING_PEACH, 0.5); // 50% opacity
  const tealBase = withOpacity(LANDING_TEAL, 0.85); // 85% opacity
  const tealShadow = withOpacity(LANDING_TEAL, 0.5); // 50% opacity
  const purpleBase = withOpacity(LANDING_PURPLE, 0.85); // 85% opacity
  const purpleShadow = withOpacity(LANDING_PURPLE, 0.5); // 50% opacity
  const blueBase = withOpacity(LANDING_BLUE, 0.85); // 85% opacity
  const blueShadow = withOpacity(LANDING_BLUE, 0.5); // 50% opacity

  return {
    whiteBase,
    whiteShadow,
    peachBase,
    peachShadow,
    tealBase,
    tealShadow,
    purpleBase,
    purpleShadow,
    blueBase,
    blueShadow,
  };
}

export default function HeroConstellation({
  width = 600,
  height = 600,
  nodeCount = 100,
  animationSpeed = 1.0,
  className = "",
}: HeroConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const rotationRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mouse position tracking with Framer Motion
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const smoothMouseX = useSpring(mouseX, {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  });
  const smoothMouseY = useSpring(mouseY, {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  });
  const canvasRectRef = useRef<DOMRect | null>(null);
  const lastMouseUpdateRef = useRef(0);
  const pointerInsideRef = useRef(false); // Comment 1: Track if pointer is inside canvas
  const prevTimeRef = useRef(0); // Comment 5: Track previous frame time for time-based decay

  // Cap nodeCount to prevent O(n^2) performance issues (Comment 7)
  const safeNodeCount = Math.min(nodeCount, 150);

  // Update canvas bounding rect (Comment 2)
  const updateRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  // Pointer event handlers for particle displacement (Comment 3: Use PointerEvent)
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const now = Date.now();
      // Throttle to ~60fps
      if (now - lastMouseUpdateRef.current < 16) return;

      lastMouseUpdateRef.current = now;

      if (!canvasRectRef.current) return;

      const rect = canvasRectRef.current;
      // Use CSS pixels (not device pixels) for accurate positioning
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      pointerInsideRef.current = true; // Comment 1: Set flag when pointer moves
      mouseX.set(localX);
      mouseY.set(localY);
    },
    [mouseX, mouseY]
  );

  const handlePointerLeave = useCallback(() => {
    pointerInsideRef.current = false; // Comment 1: Clear flag when pointer leaves
    // Reset to canvas center to avoid tilt (Comment 1)
    mouseX.set(width / 2);
    mouseY.set(height / 2);
  }, [mouseX, mouseY, width, height]);

  const handlePointerCancel = useCallback(() => {
    pointerInsideRef.current = false; // Comment 3: Handle pointer cancel
    mouseX.set(width / 2);
    mouseY.set(height / 2);
  }, [mouseX, mouseY, width, height]);

  // Monitor prefers-reduced-motion changes at runtime (Comment 6)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setReducedMotion(e.matches);
    };

    // Set initial value
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Static render function for reduced motion
  const renderStatic = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const colors = getDesignTokenColors();

      // Draw connection lines
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        let connectionCount = 0;

        // Simple O(n^2) optimization: skip every other check for large counts (Comment 7)
        const step = safeNodeCount > 100 ? 2 : 1;

        for (let j = i + 1; j < nodes.length; j += step) {
          if (connectionCount >= 3) break;

          const nodeB = nodes[j];
          const dx = nodeA.baseX - nodeB.baseX;
          const dy = nodeA.baseY - nodeB.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Use variable connection distance for each node
          const maxDist = Math.min(
            nodeA.maxConnectionDistance,
            nodeB.maxConnectionDistance
          );

          if (distance < maxDist) {
            // Use brighter lines with varied colors
            const lineColorIndex = (i + j) % 10;
            if (lineColorIndex < 6) {
              ctx.strokeStyle = withOpacity("#FFFFFF", 0.25); // Brighter white lines
            } else if (lineColorIndex === 6) {
              ctx.strokeStyle = withOpacity(LANDING_PEACH, 0.25); // Peach lines
            } else if (lineColorIndex === 7) {
              ctx.strokeStyle = withOpacity(LANDING_TEAL, 0.25); // Teal lines
            } else if (lineColorIndex === 8) {
              ctx.strokeStyle = withOpacity(LANDING_PURPLE, 0.25); // Purple lines
            } else {
              ctx.strokeStyle = withOpacity(LANDING_BLUE, 0.25); // Blue lines
            }

            ctx.beginPath();
            ctx.moveTo(nodeA.baseX, nodeA.baseY);
            ctx.lineTo(nodeB.baseX, nodeB.baseY);
            ctx.stroke();

            connectionCount++;
          }
        }
      }

      // Draw static nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        const gradient = ctx.createRadialGradient(
          node.baseX,
          node.baseY,
          0,
          node.baseX,
          node.baseY,
          node.radius * 3
        );

        // Use design token colors with all 4 brand colors sprinkled in
        const colorIndex = i % 10; // 10 different patterns
        let shadowColor;

        if (colorIndex < 5) {
          // 50% white nodes
          shadowColor = colors.whiteShadow;
          gradient.addColorStop(0, withOpacity("#FFFFFF", 0.9));
          gradient.addColorStop(0.5, withOpacity("#FFFFFF", 0.5));
        } else if (colorIndex === 5) {
          // Peach nodes
          shadowColor = colors.peachShadow;
          gradient.addColorStop(0, colors.peachBase);
          gradient.addColorStop(0.5, colors.peachShadow);
        } else if (colorIndex === 6 || colorIndex === 7) {
          // Teal nodes (2 out of 10 for more visibility)
          shadowColor = colors.tealShadow;
          gradient.addColorStop(0, colors.tealBase);
          gradient.addColorStop(0.5, colors.tealShadow);
        } else if (colorIndex === 8) {
          // Purple nodes
          shadowColor = colors.purpleShadow;
          gradient.addColorStop(0, colors.purpleBase);
          gradient.addColorStop(0.5, colors.purpleShadow);
        } else {
          // Blue nodes
          shadowColor = colors.blueShadow;
          gradient.addColorStop(0, colors.blueBase);
          gradient.addColorStop(0.5, colors.blueShadow);
        }

        gradient.addColorStop(1, withOpacity("#FFFFFF", 0));

        ctx.shadowBlur = 8;
        ctx.shadowColor = shadowColor;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.baseX, node.baseY, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    },
    [safeNodeCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cancel any existing animation before reinitializing (Comment 1)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    // Set canvas dimensions with devicePixelRatio for sharp rendering (Comment 2)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Store canvas bounding rect for mouse coordinate conversion (Comment 2)
    updateRect();

    // Add window listeners for resize/scroll to update rect (Comment 2)
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true); // Use capture for scroll

    // Add pointer event listeners if motion is enabled (Comment 3)
    if (!reducedMotion) {
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", handlePointerLeave);
      canvas.addEventListener("pointercancel", handlePointerCancel);
    }

    // Always regenerate nodes based on current props (Comment 1)
    const nodes: Node[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const minDistance = 50; // Minimum distance between nodes to prevent clustering

    for (let i = 0; i < safeNodeCount; i++) {
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 50;

      // Keep trying until we find a position far enough from other nodes
      do {
        // More even distribution across canvas (less clustering in center)
        const angle = Math.random() * Math.PI * 2;
        // Use linear distribution instead of squared for better spread
        const distance = Math.random() * (Math.min(width, height) / 2) * 0.85;
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
        attempts++;
      } while (
        attempts < maxAttempts &&
        nodes.some((node) => {
          const dx = node.baseX - x;
          const dy = node.baseY - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        })
      );

      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        radius: 1 + Math.random() * 2, // 1-3px
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.001 + Math.random() * 0.002, // 0.001-0.003
        displacementX: 0,
        displacementY: 0,
        maxConnectionDistance: 120 + Math.random() * 120, // 120-240px for varied line lengths
        twinklePhase: Math.random() * Math.PI * 2, // Random starting phase
        twinkleSpeed: 0.0003 + Math.random() * 0.0005, // Very slow: 0.0003-0.0008
      });
    }

    nodesRef.current = nodes;

    // Static render for reduced motion
    if (reducedMotion) {
      renderStatic(ctx, width, height);
      return;
    }

    // Animation loop (Comment 5: use const)
    const startTime = performance.now();
    prevTimeRef.current = startTime; // Initialize previous time (Comment 5)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      // Calculate delta time for frame-independent animations (Comment 5)
      const deltaMs = currentTime - prevTimeRef.current;
      prevTimeRef.current = currentTime;

      // Clear canvas (Comment 2: use CSS pixels since context is scaled)
      ctx.clearRect(0, 0, width, height);

      // Save context state
      ctx.save();

      // Translate to center for rotation
      ctx.translate(width / 2, height / 2);

      // Apply slow rotation
      rotationRef.current += 0.0001 * animationSpeed;
      ctx.rotate(rotationRef.current);

      // Translate back (no tilt/drift - removed to prevent shift on hover)
      ctx.translate(-width / 2, -height / 2);

      // Update and draw nodes
      const nodes = nodesRef.current;

      // Get current smooth mouse position for displacement
      const currentMouseX = smoothMouseX.get();
      const currentMouseY = smoothMouseY.get();
      const displacementRadius = 120; // Tighter radius for more precise control

      // Compute current positions snapshot (Comment 4: update before drawing connections)
      const positions: NodePosition[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Apply gentle drift using sine waves
        const driftX = Math.sin(elapsed * 0.0003 + node.pulsePhase) * 2;
        const driftY = Math.cos(elapsed * 0.0002 + node.pulsePhase * 1.5) * 2;

        node.x = node.baseX + driftX;
        node.y = node.baseY + driftY;

        // Apply particle displacement (Comment 1: only if pointer inside and not reduced motion)
        if (!reducedMotion && pointerInsideRef.current) {
          const dx = node.x - currentMouseX;
          const dy = node.y - currentMouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < displacementRadius && distance > 0) {
            // Stronger burst effect with exponential falloff
            const normalizedDist = distance / displacementRadius;
            const force = (1 - normalizedDist) * (1 - normalizedDist) * 40; // Reduced from 50 to 40
            const angle = Math.atan2(dy, dx);

            node.displacementX = Math.cos(angle) * force;
            node.displacementY = Math.sin(angle) * force;
          } else {
            // Time-based decay for frame-independent smoothing (Comment 5)
            const decay = Math.pow(0.9, deltaMs / 16.67);
            node.displacementX *= decay;
            node.displacementY *= decay;
          }
        } else {
          // Time-based decay when pointer outside or reduced motion (Comment 5)
          const decay = Math.pow(0.9, deltaMs / 16.67);
          node.displacementX *= decay;
          node.displacementY *= decay;
        }

        // Breathing/pulsing radius
        const pulseAmount =
          Math.sin(
            elapsed * node.pulseSpeed * animationSpeed + node.pulsePhase
          ) * 0.5;
        const currentRadius = node.radius + pulseAmount;

        // Apply displacement to final position
        const finalX = node.x + node.displacementX;
        const finalY = node.y + node.displacementY;

        positions.push({
          x: finalX,
          y: finalY,
          radius: currentRadius,
        });
      }

      // Draw connection lines first (behind nodes) using current positions
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const posA = positions[i];
        let connectionCount = 0;

        // Simple O(n^2) optimization: skip every other check for large counts (Comment 7)
        const step = safeNodeCount > 100 ? 2 : 1;

        for (let j = i + 1; j < nodes.length; j += step) {
          if (connectionCount >= 3) break; // Limit connections per node

          const posB = positions[j];
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Use variable connection distance for each node
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const maxDist = Math.min(
            nodeA.maxConnectionDistance,
            nodeB.maxConnectionDistance
          );

          if (distance < maxDist) {
            // Brighter, more visible lines
            const opacity = (1 - distance / maxDist) * 0.25; // Increased from 0.15

            // Alternate between colors with more variety
            const lineColorIndex = (i + j) % 10;
            if (lineColorIndex < 6) {
              ctx.strokeStyle = withOpacity("#FFFFFF", opacity);
            } else if (lineColorIndex === 6) {
              ctx.strokeStyle = withOpacity(LANDING_PEACH, opacity); // Peach
            } else if (lineColorIndex === 7) {
              ctx.strokeStyle = withOpacity(LANDING_TEAL, opacity); // Teal
            } else if (lineColorIndex === 8) {
              ctx.strokeStyle = withOpacity(LANDING_PURPLE, opacity); // Purple
            } else {
              ctx.strokeStyle = withOpacity(LANDING_BLUE, opacity); // Blue
            }

            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(posB.x, posB.y);
            ctx.stroke();

            connectionCount++;
          }
        }
      }

      // Draw nodes using computed positions (Comment 4)
      for (let i = 0; i < nodes.length; i++) {
        const pos = positions[i];
        const node = nodes[i];

        // Calculate twinkle opacity (slow breathing effect) - subtle, stays mostly visible
        const twinkle = Math.sin(
          elapsed * node.twinkleSpeed * animationSpeed + node.twinklePhase
        );
        const twinkleOpacity = 0.75 + twinkle * 0.25; // Range: 0.5 to 1.0 (mostly visible, occasional subtle dim)

        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          pos.radius * 3
        );

        // Pre-calculate opacity values to avoid string operations in loop
        const opacity0 = 0.8 * twinkleOpacity;
        const opacity1 = 0.4 * twinkleOpacity;
        const opacity2 = 0.6 * twinkleOpacity;
        const opacity3 = 0.3 * twinkleOpacity;

        // Use design token colors with purple accent nodes (Comment 3)
        if (i % 7 === 0) {
          // Purple nodes - sparse accent
          gradient.addColorStop(0, withOpacity(LANDING_PURPLE, opacity0));
          gradient.addColorStop(0.5, withOpacity(LANDING_PURPLE, opacity1));
          ctx.shadowColor = withOpacity(LANDING_PURPLE, opacity3);
        } else if (i % 2 === 0) {
          gradient.addColorStop(0, withOpacity("#FFFFFF", opacity0));
          gradient.addColorStop(0.5, withOpacity("#FFFFFF", opacity1));
          ctx.shadowColor = withOpacity("#FFFFFF", 0.18 * twinkleOpacity);
        } else {
          gradient.addColorStop(0, withOpacity(LANDING_PEACH, opacity2));
          gradient.addColorStop(0.5, withOpacity(LANDING_PEACH, opacity3));
          ctx.shadowColor = withOpacity(LANDING_PEACH, 0.4 * twinkleOpacity);
        }
        gradient.addColorStop(1, withOpacity("#FFFFFF", 0));

        // Apply shadow blur for additional glow using design tokens (Comment 3)
        ctx.shadowBlur = 6;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
      }

      // Restore context state
      ctx.restore();

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Remove pointer event listeners (Comment 3)
      if (canvas) {
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
        canvas.removeEventListener("pointercancel", handlePointerCancel);
      }
      // Remove window listeners (Comment 2)
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [
    width,
    height,
    safeNodeCount,
    animationSpeed,
    reducedMotion,
    renderStatic,
    handlePointerMove,
    handlePointerLeave,
    handlePointerCancel,
    updateRect,
    smoothMouseX,
    smoothMouseY,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
