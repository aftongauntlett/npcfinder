import { GithubLogo } from "@phosphor-icons/react";
import HeroConstellation from "../../effects/HeroConstellation";
import LandingButton from "../../landing/LandingButton";
import { LANDING_PEACH } from "../../../data/landingTheme";

/**
 * HeroSection - Landing page hero section
 *
 * Main hero content with constellation background, title, description, and CTA buttons.
 */
const HeroSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:py-28 relative">
      {/* Constellation Background - Full Width */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 pointer-events-auto">
          <HeroConstellation
            width={900}
            height={700}
            nodeCount={50}
            animationSpeed={0.8}
            className="opacity-50"
          />
        </div>
      </div>

      {/* Text Content - Overlaid */}
      <div className="relative z-10 max-w-2xl pointer-events-auto">
        {/* In Development Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-yellow-500/30 bg-yellow-500/10">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-xs font-medium text-yellow-200">
            In Active Development
          </span>
        </div>

        <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-bold mb-6 leading-[1.12] tracking-tight">
          Your Private Life Hub
          <br />
          <span
            className="block mt-1.5 text-[1.6rem] sm:text-[1.95rem] lg:text-[2.4rem] leading-[1.15] bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${LANDING_PEACH}, ${LANDING_PEACH}, ${LANDING_PEACH})`,
            }}
          >
            Organized, Connected, and Fully Yours
          </span>
        </h2>

        <p className="text-base sm:text-lg text-neutral-300 mb-8 max-w-xl leading-relaxed font-light">
          An open-source, self-hosted modular dashboard for your daily life.
          Track media, manage tasks, organize recipes, and share with your
          trusted friends. Clone it, run it with your own friend group, and
          customize it however you want.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <LandingButton
            href="https://github.com/aftongauntlett/npcfinder"
            variant="primary"
            icon={<GithubLogo className="w-5 h-5" weight="duotone" />}
          >
            View Source
          </LandingButton>
          <LandingButton href="#availability" variant="ghost">
            Learn More
          </LandingButton>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
