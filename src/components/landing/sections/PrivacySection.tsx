import { motion } from "framer-motion";
import ModernCard from "../../landing/demo/ModernCard";
import { landingPrivacy } from "../../../data/landingPrivacy";

/**
 * PrivacySection - Landing page privacy section
 *
 * Shows "Why Privacy Matters" content with privacy points in grid layout.
 */
const PrivacySection = () => {
  return (
    <motion.section
      className="max-w-7xl mx-auto px-6 py-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-12">
        <h3 className="text-4xl font-bold mb-3 tracking-tight">
          {landingPrivacy.title}
        </h3>
        <p className="text-gray-400 max-w-2xl">{landingPrivacy.description}</p>
      </div>

      {/* Privacy Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {landingPrivacy.points.map((point, index) => (
          <ModernCard
            key={index}
            icon={point.icon}
            iconColor={point.iconColor}
            title={point.title}
            description={point.description}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default PrivacySection;
