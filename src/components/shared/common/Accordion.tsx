import React, { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import Button from "../ui/Button";

interface AccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  variant?: "default" | "compact";
  className?: string;
}

export default function Accordion({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  variant = "default",
  className = "",
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const uniqueId = useId();

  // Use controlled mode if isExpanded is provided, otherwise use internal state
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !expanded;

    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }

    onToggle?.(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const contentId = `accordion-content-${uniqueId}`;

  return (
    <div className={`${className}`}>
      <Button
        variant="subtle"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
          expanded ? "rounded-t-lg" : "rounded-lg"
        } ${variant === "compact" ? "py-2 px-3" : "py-3 px-4"}`}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span
            className={`font-medium ${
              variant === "compact" ? "text-sm" : "text-base"
            }`}
          >
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {subtitle}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </Button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg"
          >
            <div className={`${variant === "compact" ? "p-3" : "p-4"}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
