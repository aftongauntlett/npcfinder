import React from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Lock, HelpCircle, Shield } from "lucide-react";
import StarryBackground from "../shared/StarryBackground";
import LandingButton from "../landing/LandingButton";
import HeroConstellation from "../effects/HeroConstellation";
import { FeatureBlock } from "../landing/demo/FeatureBlock";
import { ArchitectureCard } from "../landing/demo/ArchitectureCard";
import { FutureFeatureCard } from "../landing/demo/FutureFeatureCard";
import { landingFeatures } from "../../data/landingFeatures";
import { landingArchitecture } from "../../data/landingArchitecture";
import {
  landingFutureFeatures,
  landingBigDream,
} from "../../data/landingFuture";

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
            <HelpCircle className="w-9 h-9 text-[#FFB088] stroke-[2.5]" />
            <h1 className="text-2xl font-bold tracking-tight">NPC Finder</h1>
          </div>
          <LandingButton
            href="/app"
            variant="ghost"
            icon={<Lock className="w-4 h-4" />}
            className="text-sm"
          >
            <span className="hidden sm:inline">Login</span>
          </LandingButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="max-w-3xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] tracking-tight">
                Your Friend Group's
                <br />
                <span className="bg-gradient-to-r from-[#FF8E53] via-[#FFB088] to-[#FFC9A5] bg-clip-text text-transparent">
                  Private Hub
                </span>
              </h2>
              {/* Active Development badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 bg-teal-500/10 border border-teal-400/30 rounded-md">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-teal-300">
                  Active Development
                </span>
              </div>

              <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
                Track what you watch and read, share recommendations with
                friends, and keep everything organized in one private space.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <LandingButton
                  href="https://github.com/aftongauntlett/npcfinder"
                  variant="secondary"
                  icon={<Github className="w-5 h-5" />}
                >
                  View Source
                </LandingButton>

                {/* Request Demo - Coming Soon */}
                <div className="group relative">
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-60"
                  >
                    Request Demo
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                    Not ready yet, check back soon!
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Constellation Visual */}
            <div className="hidden lg:flex items-center justify-center">
              <HeroConstellation
                width={600}
                height={600}
                nodeCount={50}
                animationSpeed={0.8}
                className="opacity-60"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-16">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              Core Features
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Everything you need to track media and stay connected with
              friends.
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

        {/* Technical Details */}
        <section className="max-w-7xl mx-auto px-6 py-16">
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
                <motion.span
                  key={tech}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700/60 hover:border-white/20 hover:text-white transition-all duration-200 text-center"
                >
                  {tech}
                </motion.span>
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
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-3 tracking-tight">
              What's Next
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Ideas I'm thinking about as the project grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          {/* Big Dream */}
          <FutureFeatureCard
            title={landingBigDream.title}
            badge={landingBigDream.badge}
            badgeColor={landingBigDream.badgeColor}
            description={landingBigDream.description}
            descriptionExtra={landingBigDream.descriptionExtra}
            isBigDream
          />
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h3 className="text-4xl font-bold mb-4 tracking-tight">
            Want to See the Code?
          </h3>
          <p className="text-xl text-gray-400 mb-2">
            Check out the implementation on GitHub.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            This is a live project. Core features work, but I'm still building
            and refactoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LandingButton
              href="https://github.com/aftongauntlett/npcfinder"
              variant="secondary"
              icon={<Github className="w-4 h-4" />}
            >
              View Source Code
            </LandingButton>
            <a
              href="https://aftongauntlett.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              View Portfolio
            </a>
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
                <Shield className="w-4 h-4 text-purple-400" />
                Secure & Private
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                Invite-Only
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoLanding;
