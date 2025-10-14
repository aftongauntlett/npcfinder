import React from "react";
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
} from "lucide-react";
import Button from "./shared/Button";
import StarryBackground from "./StarryBackground";

/**
 * Public demo landing page for portfolio showcase
 * Explains the project without granting access
 */
const DemoLanding: React.FC = () => {
  const features = [
    {
      icon: Film,
      title: "Media Tracking",
      description:
        "Track movies, TV shows, games, and books with personal ratings and notes",
      color: "text-purple-400",
    },
    {
      icon: Users,
      title: "Social Features",
      description:
        "Connect with friends, share recommendations, and see what others are enjoying",
      color: "text-blue-400",
    },
    {
      icon: TrendingUp,
      title: "Suggestions System",
      description:
        "Vote on friend suggestions and discover new content through your network",
      color: "text-green-400",
    },
    {
      icon: Shield,
      title: "Privacy-First",
      description:
        "Invite-only system with end-to-end security. Your data stays private.",
      color: "text-yellow-400",
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
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">NPC Finder</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aftongauntlett"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link to="/portal">
              <Button variant="secondary" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/50">
            <span className="text-sm font-medium text-purple-300">
              Portfolio Project • Invite-Only
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Personal Recommendation
            <br />
            Engine for Friends
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            A secure, privacy-focused app for tracking media, sharing
            recommendations, and staying connected with a close friend group.
            Built as a full-stack portfolio project.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Invite-Only Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>End-to-End Security</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105"
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-300">{feature.description}</p>
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
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center hover:border-purple-500/50 transition-all"
              >
                <p className="font-semibold text-white">{tech.name}</p>
                <p className="text-xs text-gray-400 mt-1">{tech.category}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Highlights */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            Technical Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <Database className="w-10 h-10 text-blue-400 mb-4" />
              <h4 className="text-lg font-semibold mb-3">
                Database Architecture
              </h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• PostgreSQL with Supabase</li>
                <li>• Row-Level Security (RLS)</li>
                <li>• Optimized indexes & queries</li>
                <li>• Real-time subscriptions</li>
                <li>• Secure foreign key relationships</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <Shield className="w-10 h-10 text-green-400 mb-4" />
              <h4 className="text-lg font-semibold mb-3">Security Features</h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Invite-code authentication</li>
                <li>• JWT session management</li>
                <li>• Admin role-based access</li>
                <li>• Secure password hashing</li>
                <li>• XSS & CSRF protection</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <Zap className="w-10 h-10 text-yellow-400 mb-4" />
              <h4 className="text-lg font-semibold mb-3">Performance</h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• React Query caching</li>
                <li>• Code splitting & lazy loading</li>
                <li>• Optimistic UI updates</li>
                <li>• Debounced search inputs</li>
                <li>• Production build optimization</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Dev Notes */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ExternalLink className="w-6 h-6 text-purple-400" />
              Developer Notes
            </h3>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-white">Purpose:</strong> This
                application was built as a personal project to solve a real
                problem — keeping track of media recommendations among a close
                friend group. It's designed to be private, secure, and
                intuitive.
              </p>
              <p>
                <strong className="text-white">Why Invite-Only?</strong> This
                app is intentionally not public. It serves my friends and me,
                and the invite system ensures only trusted users have access.
                Security and privacy are paramount.
              </p>
              <p>
                <strong className="text-white">Portfolio Showcase:</strong> This
                demo page exists to demonstrate the technical implementation,
                architecture decisions, and full-stack capabilities for
                potential employers or collaborators.
              </p>
              <p>
                <strong className="text-white">What's Live:</strong> The actual
                app is fully functional and deployed, serving real users. This
                demo is view-only to showcase the project without granting
                access.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h3 className="text-3xl font-bold mb-4">Interested in My Work?</h3>
          <p className="text-xl text-gray-300 mb-8">
            I'm open to full-stack development opportunities and exciting
            projects.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://your-portfolio-url.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Portfolio
              </Button>
            </a>
            <a
              href="https://github.com/aftongauntlett"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub Profile
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
