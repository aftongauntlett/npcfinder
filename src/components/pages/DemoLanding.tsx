import React from "react";
import {
  GithubLogo,
  ArrowSquareOut,
  Lock,
  Question,
  ShieldCheck,
} from "@phosphor-icons/react";
import StarryBackground from "../shared/StarryBackground";
import LandingButton from "../landing/LandingButton";
import HeroConstellation from "../effects/HeroConstellation";
import { FeatureBlock } from "../landing/demo/FeatureBlock";
import { ArchitectureCard } from "../landing/demo/ArchitectureCard";
import { FutureFeatureCard } from "../landing/demo/FutureFeatureCard";
import AudienceCard from "../landing/demo/AudienceCard";
import AvailabilityPoint from "../landing/demo/AvailabilityPoint";
import IdentityBadge from "../landing/demo/IdentityBadge";
import Accordion from "../landing/demo/Accordion";
import { landingFeatures } from "../../data/landingFeatures";
import { landingArchitecture } from "../../data/landingArchitecture";
import {
  landingFutureFeatures,
  futureDisclaimer,
} from "../../data/landingFuture";
import { landingAvailability } from "../../data/landingAvailability";
import { landingAudiences } from "../../data/landingAudiences";
import { landingPrivacy } from "../../data/landingPrivacy";
import { landingIdentity } from "../../data/landingIdentity";

/**
 * Public demo landing page for portfolio showcase
 * Modern design with clean layouts and custom typography
 */
const DemoLanding: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Question className="w-9 h-9 text-[#FFB088]" weight="duotone" />
            <h1 className="text-2xl font-bold tracking-tight">NPC Finder</h1>
          </div>
          <LandingButton
            href="/app"
            variant="secondary"
            icon={<Lock className="w-4 h-4" weight="duotone" />}
            className="text-sm"
          >
            <span className="hidden sm:inline">Login</span>
          </LandingButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 relative">
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
            <h2 className="text-[2.25rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold mb-4 leading-[1.12] tracking-tight">
              Your Private Life Hub
              <br />
              <span className="block mt-1.5 text-[1.75rem] sm:text-[2.15rem] lg:text-[2.65rem] leading-[1.15] bg-gradient-to-r from-[#FF8E53] via-[#FFB088] to-[#FFC9A5] bg-clip-text text-transparent">
                Organized, Connected, and Fully Yours
              </span>
            </h2>

            {/* Identity Badges */}
            <div className="flex flex-wrap gap-2.5 mb-7">
              {landingIdentity.badges.map((badge, index) => (
                <IdentityBadge
                  key={index}
                  label={badge.label}
                  icon={badge.icon}
                  color={badge.color}
                />
              ))}
            </div>

            <p className="text-base sm:text-lg text-neutral-300 mb-10 max-w-xl leading-relaxed font-light">
              A modular dashboard for your daily life. Track media, manage
              tasks, organize recipes, and share with your trusted friends.
              Private, customizable, and built for small groups who value
              privacy over algorithms.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <LandingButton
                href="https://github.com/aftongauntlett/npcfinder"
                variant="primary"
                icon={<GithubLogo className="w-5 h-5" weight="duotone" />}
              >
                View Source
              </LandingButton>
              <LandingButton
                onClick={() => {
                  const section = document.getElementById("what-is-npc-finder");
                  section?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                variant="ghost"
                icon={<Question className="w-4 h-4" weight="duotone" />}
              >
                Learn More
              </LandingButton>
            </div>
          </div>
        </section>

        {/* What Is NPC Finder Today Section */}
        <section
          id="what-is-npc-finder"
          className="max-w-5xl mx-auto px-6 py-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingIdentity.title}
            </h3>
            <p className="text-xl text-[#FFB088]/80 mb-6 font-normal">
              {landingIdentity.tagline}
            </p>
            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
              {landingIdentity.description}
            </p>
          </div>

          {/* Key Points */}
          <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8">
            <ul className="space-y-4">
              {landingIdentity.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <span
                    className="font-bold flex-shrink-0"
                    style={{
                      color:
                        index % 3 === 0
                          ? "#5DCCCC"
                          : index % 3 === 1
                          ? "#A78BDD"
                          : "#FFB088",
                    }}
                  >
                    -
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-16">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              What You Can Do Today
            </h3>
            <p className="text-gray-400 max-w-2xl">
              NPC Finder currently provides media tracking and recommendations
              as the first module in a broader private dashboard.
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
        </section>

        {/* Why Privacy Matters Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingPrivacy.title}
            </h3>
            <p className="text-gray-400 max-w-2xl">
              {landingPrivacy.description}
            </p>
          </div>

          {/* Privacy Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {landingPrivacy.points.map((point, index) => (
              <AvailabilityPoint
                key={index}
                icon={point.icon}
                iconColor={point.iconColor}
                title={point.title}
                description={point.description}
              />
            ))}
          </div>

          {/* Disclaimer Box - Toned Down */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8">
            <p className="text-gray-400 leading-relaxed mb-4">
              <strong className="text-gray-300">What's NOT private:</strong>{" "}
              This is not end-to-end encrypted like Signal or WhatsApp. The
              database admin (whoever runs the Supabase instance) can
              technically access the data. This is the same privacy model as
              Netflix, Spotify, or most web apps. If you need Signal-level
              privacy, this app isn't designed for that use case. See the
              Privacy Reality Check documentation for full details.
            </p>
            <div className="flex justify-center">
              <LandingButton
                href={landingPrivacy.privacyDocsLink.href}
                variant="secondary"
              >
                {landingPrivacy.privacyDocsLink.label}
              </LandingButton>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section
          id="technical-details"
          className="max-w-7xl mx-auto px-6 py-16"
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

          {/* Architecture Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {landingArchitecture.map((arch) => (
              <ArchitectureCard
                key={arch.title}
                icon={arch.icon}
                iconColor={arch.iconColor}
                title={arch.title}
                items={arch.items}
              />
            ))}
          </div>
        </section>

        {/* What's Next */}
        <section id="roadmap" className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              Roadmap: Future Vision
            </h3>

            {/* Prominent Disclaimer */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm leading-relaxed">
                <strong>Note:</strong> {futureDisclaimer}
              </p>
            </div>

            <p className="text-gray-400 max-w-2xl">
              Ideas being explored as the project evolves - none of these exist
              yet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landingFutureFeatures.map((feature) => (
              <FutureFeatureCard
                key={feature.title}
                title={feature.title}
                badge={feature.badge}
                badgeColor={feature.badgeColor}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        {/* Access & Availability Section */}
        <section id="availability" className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingAvailability.title}
            </h3>
            <p className="text-gray-400 max-w-2xl">
              {landingAvailability.description}
            </p>
          </div>

          {/* Availability Points - Text Only with Hover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {landingAvailability.points.map((point, index) => (
              <div
                key={index}
                className="bg-slate-800/40 border-l-4 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-300"
                style={{ borderLeftColor: point.iconColor }}
              >
                <h5 className="text-lg font-semibold text-white mb-3">
                  {point.title}
                </h5>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>

          {/* Demo Note */}
          <div className="bg-slate-800/40 border border-white/10 rounded-xl p-6 mb-12 text-center">
            <p className="text-gray-400">{landingAvailability.demoNote}</p>
          </div>

          {/* Documentation Accordions */}
          <div className="space-y-4">
            <Accordion title="Invite System Guide" defaultOpen={false}>
              <p className="mb-3">
                Learn how invite codes work and how to generate them for your
                friend group.
              </p>
              <p className="mb-3">
                Admins can create invite codes tied to specific email addresses.
                Each code expires after 30 days and works only once. When
                someone signs up, their email must match the intended recipient
                - this prevents code sharing and unauthorized access.
              </p>
              <a
                href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/INVITE-SYSTEM-QUICKSTART.md"
                className="text-[#FFB088] hover:text-[#FFC9A5] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View full invite system documentation →
              </a>
            </Accordion>

            <Accordion title="Privacy Reality Check" defaultOpen={false}>
              <p className="mb-3">
                Understand what privacy means in this app (and what it doesn't).
              </p>
              <p className="mb-3">
                NPC Finder uses Row-Level Security to protect your data from
                other users, but it's not end-to-end encrypted like Signal. The
                database admin (whoever runs the Supabase instance) can
                technically access the data. This is the same privacy model as
                Netflix, Spotify, or most web apps.
              </p>
              <a
                href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md"
                className="text-[#FFB088] hover:text-[#FFC9A5] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the full privacy documentation →
              </a>
            </Accordion>

            <Accordion title="Quick Start Guide" defaultOpen={false}>
              <p className="mb-3">Set up your own instance from scratch.</p>
              <p className="mb-3">
                Want to run NPC Finder for your own friend group? This guide
                covers everything: cloning the repo, setting up Supabase,
                configuring API keys, running migrations, and deploying to
                production. Perfect for developers who want full control over
                their data.
              </p>
              <a
                href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/QUICK-START.md"
                className="text-[#FFB088] hover:text-[#FFC9A5] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View setup instructions →
              </a>
            </Accordion>
          </div>
        </section>

        {/* Who This Page Is For Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12 text-center">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              {landingAudiences.sectionTitle}
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {landingAudiences.sectionDescription}
            </p>
          </div>

          {/* Audience Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {landingAudiences.audiences.map((audience, index) => (
              <AudienceCard
                key={index}
                icon={audience.icon}
                iconColor={audience.iconColor}
                title={audience.title}
                description={audience.description}
              />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h3 className="text-4xl font-bold mb-4 tracking-tight">
            For Developers & Recruiters
          </h3>
          <p className="text-xl text-gray-400 mb-2">
            This is a portfolio project and self-hosting guide.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Core features work, but I'm still building and refactoring.
          </p>
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
            <LandingButton
              href="https://aftongauntlett.com"
              variant="secondary"
              icon={<ArrowSquareOut className="w-4 h-4" weight="duotone" />}
            >
              View Portfolio
            </LandingButton>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2025 NPC Finder • Built by Afton Gauntlett</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <ShieldCheck
                  className="w-4 h-4 text-purple-400"
                  weight="duotone"
                />
                Private within your friend group
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoLanding;
