import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, type Icon } from "@phosphor-icons/react";
import {
  LANDING_TEAL,
  LANDING_PURPLE,
  LANDING_PEACH,
} from "../../../data/landingTheme";

interface AccordionProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  index?: number;
  icon?: Icon;
  iconColor?: string;
  idPrefix?: string;
  items?: string[]; // If provided, render as bullet list instead of children
  itemColors?: string[]; // Colors for each bullet (optional, falls back to iconColor)
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  index = 0,
  icon: Icon,
  iconColor,
  idPrefix = "accordion",
  items,
  itemColors,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isHovered, setIsHovered] = useState(false);

  // Brand colors for hover effect - memoize to prevent recalculation
  const hoverColor = useMemo(
    () => iconColor || [LANDING_TEAL, LANDING_PURPLE, LANDING_PEACH][index % 3],
    [iconColor, index]
  );

  const headerId = `${idPrefix}-header-${index}`;
  const panelId = `${idPrefix}-panel-${index}`;

  return (
    <div className="bg-slate-800/40 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/60 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white/50"
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={headerId}
        type="button"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 ease-out"
              style={{
                backgroundColor: isHovered
                  ? `${hoverColor}20`
                  : `${hoverColor}10`,
              }}
            >
              <Icon
                className="w-6 h-6 transition-transform duration-300 ease-out"
                style={{
                  color: hoverColor,
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
                weight="duotone"
              />
            </div>
          )}
          <h5
            className="text-lg font-semibold transition-colors duration-300 ease-out"
            style={{ color: isHovered ? hoverColor : "#ffffff" }}
          >
            {title}
          </h5>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ willChange: "transform" }}
          aria-hidden="true"
        >
          <CaretDown className="w-5 h-5 text-gray-400" weight="bold" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            style={{ willChange: "height, opacity" }}
          >
            <div className="px-5 pb-5 pt-4 text-gray-300 text-sm leading-relaxed border-t border-white/5">
              {items ? (
                <ul className="space-y-3">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="mt-1 flex-shrink-0"
                        style={{
                          color: itemColors?.[idx] || hoverColor,
                        }}
                        aria-hidden="true"
                      >
                        -
                      </span>
                      <span className="text-gray-300 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                children
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
