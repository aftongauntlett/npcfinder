import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  GithubLogoIcon as GithubLogo,
  EnvelopeSimpleIcon as Envelope,
} from "@phosphor-icons/react";
import LandingLayout from "../landing/LandingLayout";
import LandingButton from "../landing/LandingButton";
import HeroConstellation from "../effects/HeroConstellation";
import { FeatureBlock } from "../landing/demo/FeatureBlock";
import { ScreenshotShowcase } from "../landing/demo/ScreenshotShowcase";
import ModernCard from "../landing/demo/ModernCard";
import { LANDING_PEACH, LANDING_PURPLE } from "../../data/landingTheme";
import { landingFeatures } from "../../data/landingFeatures";
import { landingScreenshots } from "../../data/landingScreenshots";
import { landingAvailability } from "../../data/landingAvailability";
import { landingPrivacy } from "../../data/landingPrivacy";
import { usePageMeta } from "../../hooks/usePageMeta";

const TECH_STACK_CHIPS = [
  "React",
  "TypeScript",
  "Supabase",
  "TanStack Query",
  "Framer Motion",
  "Tailwind",
];

// Structured data for search engines (static, outside component)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NPC Finder",
  description:
    "A private media tracker for notes, ratings, and personal timelines, with collaborative playlists for trusted friends.",
  url: "https://npcfinder.com",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Afton Gauntlett",
  },
};

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Private Media Tracker",
  description:
    "Track media with notes and ratings, keep a timeline, and share curated playlists with trusted friends.",
  ogImage: "/og-image.png",
  canonical: "https://npcfinder.com/",
};

/**
 * Public landing page for NPC Finder
 */
const DemoLanding: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const prefersReducedMotion = useReducedMotion();
  return (
    <LandingLayout>
      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start lg:items-center">
            {/* Left column - text */}
            <div className="relative z-10 pointer-events-auto lg:pr-4 lg:order-1">
              <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-bold mb-6 leading-[1.12] tracking-tight">
                Private Media Tracking
                <br />
                <span
                  className="block mt-1.5 text-[1.35rem] sm:text-[1.6rem] lg:text-[1.75rem] font-normal leading-[1.2] bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${LANDING_PEACH}, ${LANDING_PEACH}, ${LANDING_PEACH})`,
                  }}
                >
                  Track It. Note It. Remember It.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-neutral-200 mb-8 max-w-xl leading-relaxed font-normal">
                I built NPC Finder to track what I watch, read, play, and listen
                to in one place. Notes and quick ratings help me focus and
                remember why something mattered. The timeline captures when I
                experienced it, and shared playlists let friends exchange
                recommendations and notes.
              </p>

              <div className="ml-auto w-fit flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
                <LandingButton href="#features" variant="primary" size="compact">
                  Learn More
                </LandingButton>
                <LandingButton
                  href="https://github.com/aftongauntlett/npcfinder"
                  variant="ghost"
                  size="compact"
                  icon={<GithubLogo className="w-4 h-4" weight="duotone" />}
                >
                  View Source
                </LandingButton>
              </div>
            </div>

            {/* Right column - constellation (desktop only) */}
            <div className="hidden lg:flex relative pointer-events-auto lg:order-2 min-h-[420px]">
              {/* Subtle breathing glow behind the constellation */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 -z-10 ${
                  prefersReducedMotion ? "" : "animate-breathe-glow"
                }`}
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${LANDING_PEACH}33 0%, ${LANDING_PURPLE}22 45%, transparent 70%)`,
                  filter: "blur(40px)",
                }}
              />
              <HeroConstellation
                responsive
                nodeCount={50}
                animationSpeed={0.8}
                className="w-full h-full opacity-75"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="max-w-7xl mx-auto px-6 pt-12 pb-24 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-24"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              What the App Does
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Core workflows that are available now.
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

        {/* Demo Screenshots Section */}
        <motion.section
          id="demo"
          className="max-w-7xl mx-auto px-6 py-24 sm:py-28 lg:py-32"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-16">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              See It In Action
            </h3>
            <p className="text-gray-400 max-w-2xl">
              A quick tour through the core screens, from importing your
              history to rating and remembering what mattered.
            </p>
          </div>

          <div className="space-y-24 sm:space-y-28 lg:space-y-32">
            {landingScreenshots.map((screenshot, index) => (
              <ScreenshotShowcase
                key={screenshot.title}
                screenshot={screenshot}
                reverse={index % 2 === 1}
              />
            ))}
          </div>
        </motion.section>

        {/* Why Privacy Matters Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-32"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingPrivacy.title}
            </h3>
            <p className="text-gray-400 max-w-2xl">
              {landingPrivacy.description}
            </p>
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

        {/* Access & Availability Section */}
        <motion.section
          id="status"
          className="max-w-7xl mx-auto px-6 py-32"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingAvailability.title}
            </h3>
            <p className="text-gray-400 max-w-2xl">
              {landingAvailability.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 max-w-2xl">
              {TECH_STACK_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-white/15 bg-slate-800/40 px-3 py-1 text-xs font-medium text-gray-200"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {landingAvailability.points.map((point, index) => (
              <ModernCard
                key={index}
                icon={point.icon}
                iconColor={point.iconColor}
                title={point.title}
                description={point.description}
                descriptionClassName="min-h-[4.75rem]"
                className="h-full min-h-[220px]"
              >
                {point.ctaLabel && point.ctaHref ? (
                  <div className="mt-auto pt-7 flex justify-end">
                    <LandingButton
                      href={point.ctaHref}
                      variant="ghost"
                      size="compact"
                      icon={
                        point.title === "Built in the Open" ? (
                          <GithubLogo className="w-4 h-4" weight="duotone" />
                        ) : (
                          <Envelope className="w-4 h-4" weight="duotone" />
                        )
                      }
                    >
                      {point.ctaLabel}
                    </LandingButton>
                  </div>
                ) : null}
              </ModernCard>
            ))}
          </div>
        </motion.section>
    </LandingLayout>
  );
};

export default DemoLanding;
