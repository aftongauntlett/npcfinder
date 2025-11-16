import { motion } from "framer-motion";
import { LANDING_TEAL } from "../../../data/landingTheme";
import {
  landingFutureCategories,
  futureDisclaimer,
  type FutureCategory,
  type FutureFeature,
} from "../../../data/landingFuture";

/**
 * RoadmapSection - Landing page roadmap section
 *
 * Shows future vision and roadmap with feature categories.
 */
const RoadmapSection = () => {
  return (
    <motion.section
      id="roadmap"
      className="max-w-7xl mx-auto px-6 py-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-12">
        <h3 className="text-4xl font-bold mb-6 tracking-tight">
          Roadmap: Future Vision
        </h3>

        {/* Refined Disclaimer */}
        <div
          className="relative pl-6 pr-4 py-4 rounded-r-lg"
          style={{
            background: `linear-gradient(to right, ${LANDING_TEAL}0D, transparent)`,
            borderLeft: `2px solid ${LANDING_TEAL}80`,
          }}
        >
          <p className="text-gray-300 text-sm leading-relaxed">
            <span className="font-medium" style={{ color: LANDING_TEAL }}>
              Note:
            </span>{" "}
            {futureDisclaimer}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {landingFutureCategories.map((category: FutureCategory) => (
          <div
            key={category.category}
            className="group/column"
            style={{ "--cat-color": category.color } as React.CSSProperties}
          >
            <h4 className="text-xl font-semibold mb-2 text-white transition-all duration-300 ease-out group-hover/column:scale-105 origin-left cursor-default">
              {category.category}
            </h4>
            <div
              className="h-0.5 w-16 group-hover/column:w-32 mb-6 bg-gradient-to-r from-current to-transparent transition-all duration-500 ease-out"
              style={{ color: category.color }}
            />
            <div className="space-y-6 transition-colors duration-300 ease-out group-hover/column:text-gray-200">
              {category.features.map((feature: FutureFeature) => (
                <div key={feature.title} className="group/item">
                  <h5 className="text-base font-medium text-gray-200 mb-2 transition-colors duration-300 ease-out group-hover/item:[color:var(--cat-color)]">
                    {feature.title}
                  </h5>
                  <p className="text-sm text-gray-400 leading-relaxed group-hover/column:text-gray-300 transition-colors duration-300 ease-out">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default RoadmapSection;
