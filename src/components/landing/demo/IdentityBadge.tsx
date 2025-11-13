import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface IdentityBadgeProps {
  label: string;
  icon: LucideIcon | PhosphorIcon;
  color: string;
  isPhosphor?: boolean;
}

export default function IdentityBadge({
  label,
  icon: Icon,
  color,
  isPhosphor: _isPhosphor = false,
}: IdentityBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
      style={{
        backgroundColor: `${color}08`,
        border: `1.5px solid ${color}20`,
        boxShadow: `0 2px 8px ${color}08`,
        transition:
          "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.backgroundColor = `${color}12`;
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}20`;
        e.currentTarget.style.backgroundColor = `${color}08`;
        e.currentTarget.style.boxShadow = `0 2px 8px ${color}08`;
      }}
    >
      <Icon
        className="w-4 h-4"
        style={{ color, opacity: 0.9, strokeWidth: 2 }}
        weight="bold"
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
