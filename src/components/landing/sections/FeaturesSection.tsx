import { motion } from "framer-motion";
import { FeatureBlock } from "../../landing/demo/FeatureBlock";
import { landingFeatures } from "../../../data/landingFeatures";

/**
 * FeaturesSection - Landing page features section
 *
 * Displays "What You Can Do Today" features using imported feature data.
 */
const FeaturesSection = () => {
  return (
    <motion.section
      id="features"
      className="max-w-7xl mx-auto px-6 py-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-16">
        <h3 className="text-4xl font-bold mb-3 tracking-tight">
          What You Can Do Today
        </h3>
        <p className="text-gray-400 max-w-2xl">
          NPC Finder currently provides media tracking and recommendations as
          the first module in a broader private dashboard.
        </p>
      </div>

      {/* Modern feature list with accent borders */}
      <div className="space-y-16">
        {landingFeatures.map((feature) => (
          <FeatureBlock
            key={feature.title}
            icon={feature.icon}
            iconColor={feature.iconColor}
            title={feature.title}
            items={feature.items}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
