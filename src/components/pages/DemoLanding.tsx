import React from "react";
import { motion } from "framer-motion";
import {
  Film,
  Users,
  TrendingUp,
  Shield,
  Database,
  Zap,
  Github,
  ExternalLink,
  Lock,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import StarryBackground from "../shared/StarryBackground";
import LandingButton from "../landing/LandingButton";

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
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 bg-teal-500/10 border border-teal-400/30 rounded-full">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-teal-300">
                In Active Development
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Your Friend Group's
              <br />
              <span className="bg-gradient-to-r from-[#FF8E53] via-[#FFB088] to-[#FFC9A5] bg-clip-text text-transparent">
                Private Hub
              </span>
            </h2>

            <p className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
              Track what you watch and read, share recommendations with friends,
              and keep everything organized in one private space.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
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

            {/* Security badges below buttons */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-white/10 rounded-lg">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Invite-Only</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-white/10 rounded-lg">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Row-Level Security</span>
              </div>
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
            {/* Media Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative"
            >
              <div className="flex gap-12 items-start justify-between">
                {/* Content column */}
                <div className="flex-1 max-w-3xl">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF6B6B]/5 rounded-xl flex items-center justify-center border border-[#FF6B6B]/20 flex-shrink-0">
                      <Film className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white group-hover:text-[#FF6B6B] transition-colors duration-300">
                      Media Tracking & Recommendations
                    </h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#FF6B6B]/40 via-[#FF6B6B]/10 to-transparent group-hover:from-[#FF6B6B]/60 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-3 pl-16">
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF6B6B] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Keep personal libraries for movies, TV shows, music,
                        books, and games
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF6B6B] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Rate what you watch and read, then share recommendations
                        with friends
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF6B6B] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        See what friends loved or hated and mark suggestions as
                        hits or misses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Large decorative icon */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FF6B6B]/10 to-[#FF6B6B]/5 border border-[#FF6B6B]/20 flex items-center justify-center group-hover:border-[#FF6B6B]/40 group-hover:shadow-2xl group-hover:shadow-[#FF6B6B]/20 group-hover:scale-105 transition-all duration-700">
                    <Film
                      className="w-16 h-16 text-[#FF6B6B]/40 group-hover:text-[#FF6B6B] group-hover:rotate-3 transition-all duration-700"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative"
            >
              <div className="flex gap-12 items-start justify-between">
                {/* Content column */}
                <div className="flex-1 max-w-3xl">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl flex items-center justify-center border border-purple-400/20 flex-shrink-0">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
                      Privacy-First
                    </h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-400/40 via-purple-400/10 to-transparent group-hover:from-purple-400/60 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-3 pl-16">
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-purple-400 mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Invite-only access means only people you trust can join
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-purple-400 mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Row-Level Security protects your data at the database
                        level
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-purple-400 mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Your library and recommendations stay between you and
                        your friend group
                      </p>
                    </div>
                  </div>
                </div>

                {/* Large decorative icon */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-400/20 flex items-center justify-center group-hover:border-purple-400/40 group-hover:shadow-2xl group-hover:shadow-purple-500/20 group-hover:scale-105 transition-all duration-700">
                    <Shield
                      className="w-16 h-16 text-purple-400/40 group-hover:text-purple-400 group-hover:-rotate-3 transition-all duration-700"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Friend Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative"
            >
              <div className="flex gap-12 items-start justify-between">
                {/* Content column */}
                <div className="flex-1 max-w-3xl">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFB088]/20 to-[#FFB088]/5 rounded-xl flex items-center justify-center border border-[#FFB088]/20 flex-shrink-0">
                      <Users className="w-6 h-6 text-[#FFB088]" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white group-hover:text-[#FFB088] transition-colors duration-300">
                      Friend Network
                    </h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#FFB088]/40 via-[#FFB088]/10 to-transparent group-hover:from-[#FFB088]/60 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-3 pl-16">
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FFB088] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Connect with your real friends and see their media
                        libraries
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FFB088] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        View their ratings and recommendations side by side
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FFB088] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Find out what resonates with the people who know you
                        best
                      </p>
                    </div>
                  </div>
                </div>

                {/* Large decorative icon */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FFB088]/10 to-[#FFB088]/5 border border-[#FFB088]/20 flex items-center justify-center group-hover:border-[#FFB088]/40 group-hover:shadow-2xl group-hover:shadow-[#FFB088]/20 group-hover:scale-105 transition-all duration-700">
                    <Users
                      className="w-16 h-16 text-[#FFB088]/40 group-hover:text-[#FFB088] group-hover:rotate-3 transition-all duration-700"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Suggestions & Voting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative"
            >
              <div className="flex gap-12 items-start justify-between">
                {/* Content column */}
                <div className="flex-1 max-w-3xl">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF8E53]/20 to-[#FF8E53]/5 rounded-xl flex items-center justify-center border border-[#FF8E53]/20 flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-[#FF8E53]" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white group-hover:text-[#FF8E53] transition-colors duration-300">
                      Suggestions & Voting
                    </h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#FF8E53]/40 via-[#FF8E53]/10 to-transparent group-hover:from-[#FF8E53]/60 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-3 pl-16">
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF8E53] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Create suggestions for anything—where to eat, what to
                        watch, weekend activities
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF8E53] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Friends can upvote or downvote to make group decisions
                        easy
                      </p>
                    </div>
                    <div className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-[#FF8E53] mt-1 flex-shrink-0">
                        —
                      </span>
                      <p className="text-gray-300 leading-relaxed group-hover/item:text-white transition-colors duration-200">
                        Democratic voting keeps everyone's voice heard
                      </p>
                    </div>
                  </div>
                </div>

                {/* Large decorative icon */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FF8E53]/10 to-[#FF8E53]/5 border border-[#FF8E53]/20 flex items-center justify-center group-hover:border-[#FF8E53]/40 group-hover:shadow-2xl group-hover:shadow-[#FF8E53]/20 group-hover:scale-105 transition-all duration-700">
                    <TrendingUp
                      className="w-16 h-16 text-[#FF8E53]/40 group-hover:text-[#FF8E53] group-hover:-rotate-3 transition-all duration-700"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
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
              ].map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700/60 hover:border-white/20 hover:text-white transition-all duration-200 text-center"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Architecture Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Database */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="group space-y-4 bg-slate-800/40 border border-white/10 rounded-2xl p-8 hover:border-blue-400/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors duration-300"
                >
                  <Database className="w-7 h-7 text-blue-400" />
                </motion.div>
                <h4 className="text-xl font-semibold">Database Architecture</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>PostgreSQL with Supabase</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Row-Level Security (RLS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Optimized indexes & queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Real-time subscriptions</span>
                </li>
              </ul>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="group space-y-4 bg-slate-800/40 border border-white/10 rounded-2xl p-8 hover:border-green-400/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors duration-300"
                >
                  <Shield className="w-7 h-7 text-green-400" />
                </motion.div>
                <h4 className="text-xl font-semibold">Security Features</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Invite-code authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>JWT session management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Admin role-based access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Database-level RLS policies</span>
                </li>
              </ul>
            </motion.div>

            {/* Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="group space-y-4 bg-slate-800/40 border border-white/10 rounded-2xl p-8 hover:border-yellow-400/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors duration-300"
                >
                  <Zap className="w-7 h-7 text-yellow-400" />
                </motion.div>
                <h4 className="text-xl font-semibold">Performance</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>React Query caching</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Code splitting & lazy loading</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Optimistic UI updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Production build optimization</span>
                </li>
              </ul>
            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="group cursor-default bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:border-[#FF8E53]/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <h4 className="text-lg font-semibold mb-2 group-hover:text-[#FFB088] transition-colors">
                End-to-End Encryption
              </h4>
              <span className="inline-block px-2.5 py-1 bg-[#FF6B6B]/10 text-[#FF8E53] text-xs font-semibold rounded-md border border-[#FF6B6B]/20 mb-3">
                ENCRYPTION
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">
                Private messaging and journaling with full E2E encryption.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="group cursor-default bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:border-cyan-400/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <h4 className="text-lg font-semibold mb-2 group-hover:text-cyan-300 transition-colors">
                Task Tracker
              </h4>
              <span className="inline-block px-2.5 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-semibold rounded-md border border-cyan-400/20 mb-3">
                PRODUCTIVITY
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">
                Flexible tracking for fitness routines, job applications, or
                personal goals.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="group cursor-default bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:border-teal-400/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <h4 className="text-lg font-semibold mb-2 group-hover:text-teal-300 transition-colors">
                Interactive To-Do Lists
              </h4>
              <span className="inline-block px-2.5 py-1 bg-teal-500/10 text-teal-300 text-xs font-semibold rounded-md border border-teal-400/20 mb-3">
                COLLABORATION
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">
                Task management with drag-and-drop, priorities, and shared
                lists.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="group cursor-default bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:border-[#FFB088]/30 hover:bg-slate-800/60 transition-all duration-300"
            >
              <h4 className="text-lg font-semibold mb-2 group-hover:text-[#FFB088] transition-colors">
                Custom Profiles
              </h4>
              <span className="inline-block px-2.5 py-1 bg-[#FFB088]/10 text-[#FFB088] text-xs font-semibold rounded-md border border-[#FFB088]/20 mb-3">
                SOCIAL
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">
                Customizable profiles with personality, inspired by the old days
                of MySpace.
              </p>
            </motion.div>
          </div>

          {/* Big Dream */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="border border-teal-400/20 rounded-2xl p-8 bg-slate-800/40 hover:border-teal-400/40 hover:bg-slate-800/60 transition-all duration-300 cursor-default"
          >
            <h4 className="text-xl font-semibold mb-2">
              In-Browser Social Game
            </h4>
            <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-300 text-xs font-semibold rounded-md border border-teal-400/20 mb-4">
              THE BIG DREAM
            </span>
            <p className="text-gray-300 leading-relaxed mb-3">
              A cozy social game built into the dashboard. Keep pets, tend to
              gardens, decorate your house, and visit your friends. Something
              designed to encourage healthy habits without pressure.
            </p>
            <p className="text-sm text-gray-400 italic">
              A relaxing space that fits naturally into your friend network.
            </p>
          </motion.div>
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
