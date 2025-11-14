import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

interface IdentityBadgeProps {
  label: string;
  icon: Icon;
  color: string;
  index?: number;
}

export default function IdentityBadge({
  label,
  icon: Icon,
  color,
  index = 0,
}: IdentityBadgeProps) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white"
      style={{
        backgroundColor: `${color}08`,
        border: `1.5px solid ${color}20`,
        boxShadow: `0 2px 8px ${color}08`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{
        scale: 1.05,
        borderColor: `${color}40`,
        backgroundColor: `${color}12`,
        boxShadow: `0 4px 12px ${color}15`,
      }}
      role="status"
      aria-label={`${label} badge`}
      tabIndex={0}
    >
      <Icon
        className="w-3.5 h-3.5"
        style={{ color, opacity: 0.9 }}
        weight="duotone"
        aria-hidden="true"
      />
      <span
        className="text-sm font-medium tracking-wide"
        style={{ color, opacity: 0.95 }}
      >
        {label}
      </span>
    </motion.div>
  );
}
