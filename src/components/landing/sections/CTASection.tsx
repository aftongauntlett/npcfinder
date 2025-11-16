import { motion } from "framer-motion";
import { GithubLogo } from "@phosphor-icons/react";
import LandingButton from "../../landing/LandingButton";

/**
 * CTASection - Landing page call-to-action section
 *
 * Final call-to-action with development warning and action buttons.
 */
const CTASection = () => {
  return (
    <motion.section
      className="max-w-4xl mx-auto px-6 py-32 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h3 className="text-4xl font-bold mb-6 tracking-tight">
        Open Source & Self-Hostable
      </h3>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
        A real product in active development. Currently in private beta for
        testing with my friend group. Clone the repo and run your own instance,
        or follow development as I build toward a public release.
      </p>

      {/* Development Warning Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full border border-yellow-500/30 bg-yellow-500/10">
        <span className="text-yellow-400 text-lg">⚠️</span>
        <span className="text-sm text-yellow-200">
          In active development - recommend waiting for v1.0 milestone
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <LandingButton
          href="https://github.com/aftongauntlett/npcfinder"
          variant="tertiary"
          icon={<GithubLogo className="w-4 h-4" weight="duotone" />}
        >
          View Source Code
        </LandingButton>
        <LandingButton
          href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/README.md"
          variant="primary"
        >
          Read Documentation
        </LandingButton>
      </div>
    </motion.section>
  );
};

export default CTASection;
