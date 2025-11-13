import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ArchitectureCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: string[];
}

/**
 * Architecture card component for DemoLanding technical details section
 * Displays centered icon, title, and checklist of technical features
 */
export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  icon: Icon,
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
      className="group space-y-4 bg-slate-800/40 border border-white/10 rounded-2xl p-8 hover:bg-slate-800/60 transition-all duration-300"
      style={{
        ["--icon-color" as string]: iconColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${iconColor}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
    >
      <div className="flex flex-col items-center text-center mb-6">
        <motion.div
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.2 }}
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
          style={{
            backgroundColor: `${iconColor}10`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${iconColor}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${iconColor}10`;
          }}
        >
          <Icon className="w-7 h-7" style={{ color: iconColor }} />
        </motion.div>
        <h4 className="text-xl font-semibold">{title}</h4>
      </div>
      <ul className="space-y-3 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle2
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: iconColor }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};
