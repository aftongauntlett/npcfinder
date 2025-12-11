import { ReactNode, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "@/utils/debounce";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = "right",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      requestAnimationFrame(() => {
        const triggerRect = triggerRef.current?.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();

        if (!triggerRect || !tooltipRect) return;

        let x = 0;
        let y = 0;
        let finalPosition = position;

        // Check if tooltip fits on the right, otherwise use bottom
        if (position === "right") {
          const spaceOnRight = window.innerWidth - triggerRect.right;
          if (spaceOnRight < tooltipRect.width + 16) {
            // Not enough space on right, use bottom
            finalPosition = "bottom";
          }
        }

        switch (finalPosition) {
          case "top":
            x = triggerRect.left + triggerRect.width / 2;
            y = triggerRect.top - 4;
            break;
          case "bottom":
            x = triggerRect.left + triggerRect.width / 2;
            y = triggerRect.bottom + 4;
            break;
          case "left":
            x = triggerRect.left - 4;
            y = triggerRect.top + triggerRect.height / 2;
            break;
          case "right":
            x = triggerRect.right + 4;
            y = triggerRect.top;
            break;
        }

        setActualPosition(finalPosition);
        setTooltipPosition({ x, y });
      });
    };

    const debouncedUpdatePosition = debounce(updatePosition, 100);

    updatePosition(); // Initial update
    window.addEventListener("scroll", debouncedUpdatePosition, true);
    window.addEventListener("resize", debouncedUpdatePosition);

    return () => {
      window.removeEventListener("scroll", debouncedUpdatePosition, true);
      window.removeEventListener("resize", debouncedUpdatePosition);
    };
  }, [isVisible, position]);

  const positionClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2 translate-y-0",
    left: "-translate-x-full translate-y-0",
    right: "translate-x-0 translate-y-0",
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`fixed z-[9999] pointer-events-none ${positionClasses[actualPosition]}`}
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            {/* Tooltip content - modern squared card */}
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2.5 rounded shadow-lg border border-gray-200 dark:border-gray-700 min-w-[120px] max-w-[200px]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
