import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  Code,
  ChevronDown,
} from "lucide-react";
import Button from "../shared/Button";
import StarryBackground from "../StarryBackground";

/**
 * Public demo landing page for portfolio showcase
 * Explains the project without granting access
 */
const DemoLanding: React.FC = () => {
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const features = [
    {
      icon: Film,
      title: "Media Recommendations",
      description:
        "Track movies, TV shows, and music with personal ratings. Share recommendations with friends.",
      color: "text-purple-400",
    },
    {
      icon: Users,
      title: "Friend Network",
      description:
        "Connect with friends, see what they recommend, and mark recommendations as hits or misses",
      color: "text-violet-400",
    },
    {
      icon: TrendingUp,
      title: "Suggestions System",
      description:
        "Create and vote on friend suggestions for anything - restaurants, activities, or ideas",
      color: "text-fuchsia-400",
    },
    {
      icon: Shield,
      title: "Privacy-First",
      description:
        "Invite-only system with Row-Level Security. Your data stays between you and your friends.",
      color: "text-emerald-400",
    },
  ];

  const techStack = [
    { name: "React 19", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "Vite", category: "Build Tool" },
    { name: "Supabase", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "TailwindCSS", category: "Styling" },
    { name: "Framer Motion", category: "Animation" },
    { name: "React Router", category: "Routing" },
    { name: "TanStack Query", category: "Data Fetching" },
    { name: "Vitest", category: "Testing" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">NPC Finder</h1>
            <span className="px-2 py-1 text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/50 rounded-full">
              IN DEVELOPMENT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/app">
              <Button
                variant="secondary"
                className="flex items-center gap-2 text-sm"
              >
                <Lock className="w-4 h-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent leading-tight animate-gradient">
            Personal Tracker &
            <br />
            Recommendation Hub
          </h2>
          <style>{`
            @keyframes gradient {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
            .animate-gradient {
              background-size: 200% auto;
              animation: gradient 6s ease infinite;
            }
          `}</style>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Track your favorite media, share recommendations, and stay organized
            with your close friend group. From movies and music to fitness,
            recipes, and to-do lists — all in one secure, private space.
          </p>
          <div className="flex flex-col items-center gap-6 mb-8">
            <a
              href="https://github.com/aftongauntlett/npcfinder"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <button className="flex items-center gap-3 text-lg px-8 py-4 rounded-lg border-2 border-[#CCCCFF]/50 bg-transparent text-white hover:bg-[#CCCCFF]/20 hover:border-[#CCCCFF] transition-all duration-500 ease-out">
                <Github className="w-6 h-6 transition-transform duration-500 ease-out group-hover:rotate-12" />
                View Source Code
              </button>
            </a>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-400" />
              <span>Invite-Only</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Row-Level Security</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-500 ease-out hover:transform hover:scale-[1.02] group"
              >
                <div className="flex flex-col items-center text-center">
                  <feature.icon
                    className={`w-14 h-14 ${feature.color} mb-5 group-hover:scale-110 transition-transform duration-500 ease-out`}
                  />
                  <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-100 transition-colors duration-500 ease-out">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 group-hover:text-gray-200 leading-relaxed transition-colors duration-500 ease-out">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code className="w-6 h-6 text-purple-400" />
              <h3 className="text-3xl font-bold">Tech Stack</h3>
            </div>
            <p className="text-gray-300">
              Modern, production-ready technologies
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center hover:border-purple-400/50 hover:bg-white/10 transition-all duration-500 ease-out group"
              >
                <p className="font-semibold text-white group-hover:text-purple-100 transition-colors duration-500 ease-out">
                  {tech.name}
                </p>
                <p className="text-xs text-gray-400 group-hover:text-gray-300 mt-1 transition-colors duration-500 ease-out">
                  {tech.category}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Highlights */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            Technical Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition-all duration-500 ease-out group">
              <div className="flex flex-col items-center text-center">
                <Database className="w-12 h-12 text-blue-400 mb-5 group-hover:scale-110 transition-transform duration-500 ease-out" />
                <h4 className="text-lg font-semibold mb-4 text-white group-hover:text-blue-100 transition-colors duration-500 ease-out">
                  Database Architecture
                </h4>
                <ul className="text-gray-400 group-hover:text-gray-200 space-y-2 text-sm transition-colors duration-500 ease-out">
                  <li>• PostgreSQL with Supabase</li>
                  <li>• Row-Level Security (RLS)</li>
                  <li>• Optimized indexes & queries</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Secure foreign key relationships</li>
                </ul>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-green-400/50 hover:bg-white/10 transition-all duration-500 ease-out group">
              <div className="flex flex-col items-center text-center">
                <Shield className="w-12 h-12 text-green-400 mb-5 group-hover:scale-110 transition-transform duration-500 ease-out" />
                <h4 className="text-lg font-semibold mb-4 text-white group-hover:text-green-100 transition-colors duration-500 ease-out">
                  Security Features
                </h4>
                <ul className="text-gray-400 group-hover:text-gray-200 space-y-2 text-sm transition-colors duration-500 ease-out">
                  <li>• Invite-code authentication</li>
                  <li>• JWT session management</li>
                  <li>• Admin role-based access</li>
                  <li>• Secure password hashing</li>
                  <li>• XSS & CSRF protection</li>
                </ul>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-yellow-400/50 hover:bg-white/10 transition-all duration-500 ease-out group">
              <div className="flex flex-col items-center text-center">
                <Zap className="w-12 h-12 text-yellow-400 mb-5 group-hover:scale-110 transition-transform duration-500 ease-out" />
                <h4 className="text-lg font-semibold mb-4 text-white group-hover:text-yellow-100 transition-colors duration-500 ease-out">
                  Performance
                </h4>
                <ul className="text-gray-400 group-hover:text-gray-200 space-y-2 text-sm transition-colors duration-500 ease-out">
                  <li>• React Query caching</li>
                  <li>• Code splitting & lazy loading</li>
                  <li>• Optimistic UI updates</li>
                  <li>• Debounced search inputs</li>
                  <li>• Production build optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Future Features */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-4">
            Future Features
          </h3>
          <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
            Big dreams for the future! Here's what's planned for NPC Finder as
            it evolves into a comprehensive social platform.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {/* E2E Encryption */}
            <div className="bg-gradient-to-br from-[#CCCCFF]/10 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-[#CCCCFF]/20 hover:border-[#CCCCFF]/60 hover:from-[#CCCCFF]/20 hover:to-indigo-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-[#CCCCFF] group-hover:text-white flex items-center gap-2 transition-colors duration-500 ease-out">
                <Lock className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                End-to-End Encryption
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                Private messaging and personal journaling with full E2E
                encryption. Your thoughts, truly private.
              </p>
            </div>

            {/* Fitness Tracker */}
            <div className="bg-gradient-to-br from-blue-900/15 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20 hover:border-blue-400/60 hover:from-blue-900/25 hover:to-indigo-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-blue-300 group-hover:text-blue-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <TrendingUp className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                Fitness Tracker
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                Track workouts, set goals, and share fitness achievements with
                friends.
              </p>
            </div>

            {/* Interactive To-Do Lists */}
            <div className="bg-gradient-to-br from-indigo-900/15 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-indigo-400/20 hover:border-indigo-400/60 hover:from-indigo-900/25 hover:to-cyan-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-indigo-300 group-hover:text-indigo-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <Code className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                Interactive To-Do Lists
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                Collaborative task management with drag-and-drop, priorities,
                and shared lists.
              </p>
            </div>

            {/* Custom Profiles */}
            <div className="bg-gradient-to-br from-violet-900/15 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-violet-400/20 hover:border-violet-400/60 hover:from-violet-900/25 hover:to-purple-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-violet-300 group-hover:text-violet-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <Users className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                Custom Profiles
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                AOL/MySpace-inspired customizable profiles with personality and
                flair.
              </p>
            </div>

            {/* Books & Games */}
            <div className="bg-gradient-to-br from-purple-900/15 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/20 hover:border-purple-400/60 hover:from-purple-900/25 hover:to-blue-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-purple-300 group-hover:text-purple-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <Film className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                Books & Games
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                Expand beyond movies and music to track books, video games, and
                more media.
              </p>
            </div>

            {/* Job Tracker */}
            <div className="bg-gradient-to-br from-blue-900/15 to-violet-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20 hover:border-blue-400/60 hover:from-blue-900/25 hover:to-violet-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-lg font-semibold mb-2 text-blue-300 group-hover:text-blue-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <Database className="w-5 h-5 transition-transform duration-500 ease-out group-hover:scale-110" />
                Job Tracker
              </h4>
              <p className="text-gray-400 group-hover:text-gray-200 text-sm transition-colors duration-500 ease-out">
                Manage job applications, track interview progress, and organize
                your career journey.
              </p>
            </div>

            {/* The Big Dream: Stardew Valley Game */}
            <div className="md:col-span-2 bg-gradient-to-br from-cyan-900/15 via-teal-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-8 border border-cyan-400/30 hover:border-cyan-400/70 hover:from-cyan-900/25 hover:via-teal-900/30 hover:to-blue-900/30 transition-all duration-500 ease-out group">
              <h4 className="text-xl font-bold mb-3 text-cyan-300 group-hover:text-cyan-200 flex items-center gap-2 transition-colors duration-500 ease-out">
                <Zap className="w-6 h-6 transition-transform duration-500 ease-out group-hover:scale-110" />
                The Big Dream: In-Browser Social Farm Game
              </h4>
              <p className="text-gray-300 group-hover:text-gray-100 mb-3 transition-colors duration-500 ease-out">
                Long-term vision: A Stardew Valley-inspired online game built
                right into the dashboard. Every user gets their own home and
                farm to tend, decorate, and customize. Visit your friends'
                farms, trade items, and build a cozy virtual community together.
              </p>
              <p className="text-sm text-gray-400 italic">
                Think: Animal Crossing meets Stardew Valley, seamlessly
                integrated into your friend network.
              </p>
            </div>
          </div>
        </section>

        {/* About This App */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            About This App
          </h3>
          <div className="space-y-4">
            {/* Purpose Accordion */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-blue-400/50 hover:bg-white/10 transition-all duration-500 ease-out">
              <button
                onClick={() => toggleAccordion("purpose")}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors duration-500 ease-out group"
              >
                <span className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors duration-500 ease-out">
                  Purpose
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-blue-400 transition-all duration-500 ease-out group-hover:text-blue-300 ${
                    openAccordions.has("purpose") ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.has("purpose") && (
                <div className="px-6 py-5 text-gray-300 leading-relaxed border-t border-white/5">
                  This application was built to solve a real problem — keeping
                  track of media recommendations among a close friend group.
                  It's designed to be private, secure, and intuitive.
                </div>
              )}
            </div>

            {/* Why Invite-Only Accordion */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-green-400/50 hover:bg-white/10 transition-all duration-500 ease-out">
              <button
                onClick={() => toggleAccordion("invite-only")}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors duration-500 ease-out group"
              >
                <span className="text-lg font-semibold text-white group-hover:text-green-100 transition-colors duration-500 ease-out">
                  Why Invite-Only?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-green-400 transition-all duration-500 ease-out group-hover:text-green-300 ${
                    openAccordions.has("invite-only") ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.has("invite-only") && (
                <div className="px-6 py-5 text-gray-300 leading-relaxed border-t border-white/5">
                  This app is intentionally not public. It serves my friends and
                  me, and the invite system ensures only trusted users have
                  access. Security and privacy are paramount.
                </div>
              )}
            </div>

            {/* Open Source Accordion */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-400/50 hover:bg-white/10 transition-all duration-500 ease-out">
              <button
                onClick={() => toggleAccordion("open-source")}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors duration-500 ease-out group"
              >
                <span className="text-lg font-semibold text-white group-hover:text-cyan-100 transition-colors duration-500 ease-out">
                  Open Source
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-cyan-400 transition-all duration-500 ease-out group-hover:text-cyan-300 ${
                    openAccordions.has("open-source") ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.has("open-source") && (
                <div className="px-6 py-5 text-gray-300 leading-relaxed border-t border-white/5">
                  The source code is available on GitHub for those interested in
                  the technical implementation. Feel free to explore the
                  architecture and see how it's built.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h3 className="text-3xl font-bold mb-4">Interested in the Code?</h3>
          <p className="text-xl text-gray-300 mb-2">
            Explore the architecture and implementation on GitHub.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Note: This project is actively being built and refactored. Not all
            features are complete yet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://aftongauntlett.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Portfolio
              </Button>
            </a>
            <a
              href="https://github.com/aftongauntlett/npcfinder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                View Source Code
              </Button>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-gray-400 text-sm">
              © 2025 NPC Finder • Built by Afton Gauntlett
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
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
