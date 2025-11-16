import { motion } from "framer-motion";
import Accordion from "../../landing/demo/Accordion";
import { landingArchitecture } from "../../../data/landingArchitecture";

/**
 * TechnicalSection - Landing page technical details section
 *
 * Displays tech stack badges and architecture details with accordions.
 */
const TechnicalSection = () => {
  return (
    <motion.section
      id="technical-details"
      className="max-w-7xl mx-auto px-6 py-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-12">
        <h3 className="text-4xl font-bold mb-3 tracking-tight">
          Technical Details
        </h3>
        <p className="text-gray-400 max-w-2xl">
          Decisions made with security, performance, and maintainability in
          mind.
        </p>
      </div>

      {/* Tech Stack Badges */}
      <div className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            "React 19",
            "TypeScript",
            "Vite",
            "Supabase",
            "PostgreSQL",
            "TailwindCSS",
            "Framer Motion",
            "React Router",
            "TanStack Query",
            "Vitest",
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700/60 hover:border-white/20 hover:text-white transition-all duration-200 text-center"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Architecture Details - Click to Expand */}
      <div className="space-y-4">
        {landingArchitecture.map((arch, index) => (
          <Accordion
            key={arch.title}
            title={arch.title}
            defaultOpen={index === 0}
            index={index}
            idPrefix="tech"
            icon={arch.icon}
            iconColor={arch.iconColor}
            items={arch.items}
            itemColors={arch.itemColors}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default TechnicalSection;
