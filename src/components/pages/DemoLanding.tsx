import React from "react";
import { motion } from "framer-motion";
import {
  GithubLogo,
  ArrowSquareOut,
  Lock,
  Question,
  LinkedinLogo,
  ArrowUp,
} from "@phosphor-icons/react";
import { StarryBackground } from "@/components/shared";
import LandingButton from "../landing/LandingButton";
import HeroConstellation from "../effects/HeroConstellation";
import { FeatureBlock } from "../landing/demo/FeatureBlock";
import ModernCard from "../landing/demo/ModernCard";
import Accordion from "../landing/demo/Accordion";
import { LANDING_PEACH, LANDING_TEAL } from "../../data/landingTheme";
import { landingFeatures } from "../../data/landingFeatures";
import { landingArchitecture } from "../../data/landingArchitecture";
import {
  landingFutureCategories,
  futureDisclaimer,
  type FutureCategory,
  type FutureFeature,
} from "../../data/landingFuture";
import { landingAvailability } from "../../data/landingAvailability";
import { landingPrivacy } from "../../data/landingPrivacy";

/**
 * Public landing page for NPC Finder
 * Real product in development - open source and self-hostable
 */
const DemoLanding: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-800 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <StarryBackground />

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
            href="/app"
            variant="ghost"
            icon={<Lock className="w-4 h-4" weight="duotone" />}
            className="text-sm"
          >
            <span className="hidden sm:inline">Login</span>
          </LandingButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10" id="main-content" role="main">
        {/* Hero Section */}
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
              Track media, manage tasks, organize recipes, and share with your
              trusted friends. Private, customizable, and built for small
              groups.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
        </section>

        {/* Features Section */}
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
              NPC Finder provides media tracking, task management, recipe
              organization, and friend recommendations - all in one private
              dashboard.
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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

        {/* Technical Details */}
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

        {/* What's Next */}
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

        {/* Access & Availability Section */}
        <motion.section
          id="availability"
          className="max-w-7xl mx-auto px-6 py-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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

          {/* Developer Documentation Link */}
          <div className="mt-8">
            <p className="text-gray-400">
              For detailed setup instructions and developer documentation, visit
              our{" "}
              <a
                href="/docs"
                style={{ color: LANDING_PEACH }}
                className="hover:opacity-80 underline transition-opacity"
              >
                Developer Guide
              </a>
              .
            </p>
          </div>
        </motion.section>

        {/* Open Source & Self-Hostable Section */}
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
            NPC Finder is open source and designed to be self-hosted. Run your
            own instance with full control over your data, or follow development
            as we build toward a public release.
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
            <LandingButton href="/docs" variant="primary">
              Developer Setup Guide
            </LandingButton>
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
            <p>© 2025 NPC Finder • Built by Afton Gauntlett</p>
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
              <a
                href="https://aftongauntlett.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
                aria-label="View portfolio"
              >
                <ArrowSquareOut className="w-4 h-4" weight="duotone" />
                <span className="hidden sm:inline">View Portfolio</span>
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
