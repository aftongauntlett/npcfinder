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
import { LANDING_PEACH } from "../../data/landingTheme";
import { landingFeatures } from "../../data/landingFeatures";
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
  const { resolvedTheme } = useTheme();
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
          <a
            href="#status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-slate-800/40 text-xs font-medium text-gray-200 transition-colors hover:bg-slate-700/50 hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-300/60"
            aria-label="View invite-only and project status section"
          >
            <Lock className="w-4 h-4" weight="duotone" />
            <span>Invite Only</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10" id="main-content" role="main">
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

              <p className="text-base sm:text-lg text-neutral-300 mb-8 max-w-xl leading-relaxed font-light">
                I built NPC Finder to track what I watch, read, play, and listen
                to in one place. Notes and quick ratings help me focus and
                remember why something mattered. The timeline captures when I
                experienced it, and shared playlists let friends exchange
                recommendations and notes.
              </p>

              <div className="ml-auto w-fit flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
                <LandingButton
                  href="https://github.com/aftongauntlett/npcfinder"
                  variant="ghost"
                  size="compact"
                  icon={<GithubLogo className="w-4 h-4" weight="duotone" />}
                >
                  View Source
                </LandingButton>
                <LandingButton href="/login" variant="primary" size="compact">
                  Sign In
                </LandingButton>
              </div>
            </div>

            {/* Right column - constellation (desktop only) */}
            <div className="hidden lg:flex pointer-events-auto lg:order-2 min-h-[420px]">
              <HeroConstellation
                responsive
                nodeCount={50}
                animationSpeed={0.8}
                className="w-full h-full opacity-60"
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
                        ) : undefined
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
