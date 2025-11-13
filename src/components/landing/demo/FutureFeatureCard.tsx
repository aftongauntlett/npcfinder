import React from "react";
import { motion } from "framer-motion";

interface FutureFeatureCardProps {
  title: string;
  badge: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  description: string;
  descriptionExtra?: string;
  isBigDream?: boolean;
}

/**
 * Future feature card component for DemoLanding "What's Next" section
 * Displays future plans with category badges
 */
export const FutureFeatureCard: React.FC<FutureFeatureCardProps> = ({
  title,
  badge,
  badgeColor,
  description,
  descriptionExtra,
  isBigDream = false,
}) => {
  if (isBigDream) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border border-teal-400/20 rounded-2xl p-8 bg-slate-800/40 hover:border-teal-400/40 hover:bg-slate-800/60 transition-all duration-300 cursor-default"
      >
        <h4 className="text-xl font-semibold mb-2">{title}</h4>
        <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-300 text-xs font-semibold rounded-md border border-teal-400/20 mb-4">
          {badge}
        </span>
        <p className="text-gray-300 leading-relaxed mb-3">{description}</p>
        {descriptionExtra && (
          <p className="text-sm text-gray-400 italic">{descriptionExtra}</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group cursor-default bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-all duration-300"
      style={{
        ["--badge-color" as string]: badgeColor.text,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = badgeColor.border.replace(
          "20",
          "30"
        );
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
    >
      <h4
        className="text-lg font-semibold mb-2 transition-colors"
        style={{
          ["--hover-color" as string]: badgeColor.text,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = badgeColor.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "";
        }}
      >
        {title}
      </h4>
      <span
        className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md border mb-3"
        style={{
          backgroundColor: badgeColor.bg,
          color: badgeColor.text,
          borderColor: badgeColor.border,
        }}
      >
        {badge}
      </span>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};
