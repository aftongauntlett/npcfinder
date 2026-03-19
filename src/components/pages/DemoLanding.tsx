import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  GithubLogoIcon as GithubLogo,
  LockIcon as Lock,
  QuestionIcon as Question,
  LinkedinLogoIcon as LinkedinLogo,
  ArrowUpIcon as ArrowUp,
} from "@phosphor-icons/react";
import { useTheme } from "@/hooks/useTheme";
import LandingButton from "../landing/LandingButton";
import HeroConstellation from "../effects/HeroConstellation";
import { FeatureBlock } from "../landing/demo/FeatureBlock";
import ModernCard from "../landing/demo/ModernCard";
import {
  LANDING_PEACH,
  LANDING_TEAL,
  LANDING_BLUE,
} from "../../data/landingTheme";
import { landingFeatures } from "../../data/landingFeatures";
import {
  landingFutureCategories,
  futureDisclaimer,
  gameMilestone,
  futureVisionBlurb,
} from "../../data/landingFuture";
import { landingAvailability } from "../../data/landingAvailability";
import { landingPrivacy } from "../../data/landingPrivacy";
import { usePageMeta } from "../../hooks/usePageMeta";

// Only load the starfield in dark mode.
const StarryBackground = React.lazy(
  () => import("@/components/shared/common/StarryBackground"),
);

// Structured data for search engines (static, outside component)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NPC Finder",
  description:
    "A private media clubhouse for trusted friends to collect, share, and revisit what they love.",
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
  title: "Private Media Clubhouse",
  description:
    "Archive and share movies, shows, books, games, and music with your trusted circle.",
  ogImage: "/og-image.png",
  canonical: "https://npcfinder.com/",
};

/**
 * Public landing page for NPC Finder
 */
const DemoLanding: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const futureCards = landingFutureCategories.flatMap(
    (category) => category.features,
  );
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-800 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {resolvedTheme === "dark" && !prefersReducedMotion && (
        <React.Suspense fallback={null}>
          <StarryBackground />
        </React.Suspense>
      )}

      {/* Header */}
      <header
        className="relative z-10 border-b border-white/5 backdrop-blur-md"
        aria-label="Site header"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Question
              className="w-9 h-9"
              style={{ color: LANDING_PEACH }}
              weight="duotone"
            />
            <h1 className="text-2xl font-bold tracking-tight">NPC Finder</h1>
          </div>
          <LandingButton
            href="#availability"
            variant="ghost"
            icon={<Lock className="w-4 h-4" weight="duotone" />}
            className="text-sm"
          >
            <span className="hidden sm:inline">Get Access</span>
          </LandingButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10" id="main-content" role="main">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left column - constellation (desktop only) */}
            <div className="hidden lg:flex items-center justify-center pointer-events-auto">
              <HeroConstellation
                width={620}
                height={560}
                nodeCount={50}
                animationSpeed={0.8}
                className="opacity-60"
              />
            </div>

            {/* Right column - text */}
            <div className="relative z-10 pointer-events-auto lg:pl-4">
              <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-bold mb-6 leading-[1.12] tracking-tight">
                A Quiet Corner of the Internet
                <br />
                <span
                  className="block mt-1.5 text-[1.35rem] sm:text-[1.6rem] lg:text-[1.75rem] font-normal leading-[1.2] bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${LANDING_PEACH}, ${LANDING_PEACH}, ${LANDING_PEACH})`,
                  }}
                >
                  For the People Who Actually Text Back
                </span>
              </h2>

              <p className="text-base sm:text-lg text-neutral-300 mb-8 max-w-xl leading-relaxed font-light">
                I got tired of social media feeling like a performance. I wanted
                somewhere to honestly track what I&apos;m watching, reading, and
                playing - and share it with the people I actually talk to. So I
                built this. In my free time, by myself. No pitch deck, no ad
                revenue, no growth targets. If it turns out to be useful to even
                one other person, that&apos;s more than enough.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
                <LandingButton href="#availability" variant="primary">
                  Request Invite
                </LandingButton>
                <LandingButton
                  href="https://github.com/aftongauntlett/npcfinder"
                  variant="ghost"
                  icon={<GithubLogo className="w-5 h-5" weight="duotone" />}
                >
                  View Source
                </LandingButton>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="max-w-7xl mx-auto px-6 py-32"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-16">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              What I&apos;ve Built So Far
            </h3>
            <p className="text-gray-400 max-w-2xl">
              This is what actually works right now - media tracking, shared
              collections, and the first stage of an interactive game. No fluff.
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

        {/* What's Next */}
        <motion.section
          id="roadmap"
          className="max-w-7xl mx-auto px-6 py-32"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-6 tracking-tight">
              Things I&apos;d Love to Build
            </h3>

            <div
              className="relative p-5 rounded-lg mb-8"
              style={{
                background: `linear-gradient(135deg, ${LANDING_PEACH}12, transparent)`,
                border: `1px solid ${LANDING_PEACH}30`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-white font-semibold text-base leading-snug">
                  {gameMilestone.title}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: LANDING_PEACH }}
                  >
                    Milestone
                  </p>
                  <span
                    className="block w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: LANDING_PEACH }}
                  />
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {gameMilestone.description}
              </p>
            </div>

            <div className="mb-3 flex items-end justify-between gap-4">
              <h4 className="text-2xl font-semibold text-white tracking-tight">
                {futureVisionBlurb.title}
              </h4>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Updated {futureVisionBlurb.updatedAt}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <ModernCard
                iconColor={LANDING_PEACH}
                title="The Dream"
                description={futureVisionBlurb.content}
                className="h-full"
              />
              <ModernCard
                iconColor={LANDING_TEAL}
                title="Reality Check"
                description={futureVisionBlurb.realityCheck}
                className="h-full"
              />
              <ModernCard
                iconColor={LANDING_BLUE}
                title="Non-Negotiables"
                description={futureVisionBlurb.values}
                className="h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {futureCards.map((feature) => (
              <ModernCard
                key={feature.title}
                iconColor={feature.color}
                title={feature.title}
                description={feature.description}
                className="h-full"
              />
            ))}
            <ModernCard
              iconColor={LANDING_BLUE}
              title="Want to Collaborate?"
              description="If this goes live and you'd like to shape where it goes, reach out. Suggestions and feature requests are welcome, especially from people who'd actually use this with friends."
              className="h-full"
            />
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mt-8">
            <span className="font-medium" style={{ color: LANDING_TEAL }}>
              Note:
            </span>{" "}
            {futureDisclaimer}
          </p>
        </motion.section>

        {/* Access & Availability Section */}
        <motion.section
          id="availability"
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
          </div>

          {/* Availability Points - Modern 2025 hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {landingAvailability.points.map((point, index) => (
              <ModernCard
                key={index}
                icon={point.icon}
                iconColor={point.iconColor}
                title={point.title}
                description={point.description}
                className="h-full"
              />
            ))}
          </div>

          {/* Demo Video Coming Soon - Distinct callout style */}
          <div
            className="relative bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-transparent rounded-xl p-8 mb-12 text-center"
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: `${LANDING_PEACH}20`,
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${LANDING_PEACH}10`,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: `${LANDING_PEACH}30`,
                }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: LANDING_PEACH }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Demo Video Coming Soon
                </h4>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  {landingAvailability.demoNote}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 border-t border-white/5 backdrop-blur-md"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              © 2025 NPC Finder • Built by{" "}
              <a
                href="https://aftongauntlett.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-dark hover:text-primary underline transition-colors"
              >
                Afton Gauntlett
              </a>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/aftongauntlett"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
                aria-label="View GitHub profile"
              >
                <GithubLogo className="w-4 h-4" weight="duotone" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/afton-gauntlett/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
                aria-label="Connect on LinkedIn"
              >
                <LinkedinLogo className="w-4 h-4" weight="duotone" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4" weight="duotone" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoLanding;
