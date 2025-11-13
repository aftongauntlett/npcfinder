import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface AudienceCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export default function AudienceCard({
  iconColor,
  title,
  description,
}: AudienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative bg-slate-800/40 border-l-4 border-t border-r border-b border-white/10 rounded-xl p-8 hover:bg-slate-800/60 transition-all duration-300"
      style={{
        borderLeftColor: iconColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.4)";
      }}
    >
      {/* Content */}
      <div className="text-left">
        <h4 className="text-xl font-semibold text-white mb-3">{title}</h4>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
