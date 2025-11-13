import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ArchitectureCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

/**
 * Architecture card component for DemoLanding technical details section
 * Minimal text-only design - no icons
 */
export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  iconColor,
  title,
  items,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group space-y-4 bg-slate-800/40 border-l-4 rounded-lg p-8 hover:bg-slate-800/60 transition-all duration-300"
      style={{
        borderLeftColor: iconColor,
      }}
    >
      <h4 className="text-xl font-semibold mb-6">{title}</h4>
      <ul className="space-y-3 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span
              className="mt-0.5 flex-shrink-0 font-bold"
              style={{ color: iconColor }}
            >
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};
