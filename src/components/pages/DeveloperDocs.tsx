import React from "react";
import { motion } from "framer-motion";
import {
  GithubLogo,
  ArrowSquareOut,
  Lock,
  Question,
  LinkedinLogo,
  ArrowUp,
  ArrowLeft,
  Code,
  Terminal,
  Key,
  CloudArrowUp,
} from "@phosphor-icons/react";
import { StarryBackground } from "@/components/shared";
import LandingButton from "../landing/LandingButton";
import Accordion from "../landing/demo/Accordion";
import {
  LANDING_PEACH,
  LANDING_TEAL,
  LANDING_PURPLE,
} from "../../data/landingTheme";
import { landingArchitecture } from "../../data/landingArchitecture";

/**
 * Developer Documentation Page
 * All technical setup information for self-hosting NPC Finder
 */
const DeveloperDocs: React.FC = () => {
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
        <section className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
          {/* Back to Landing */}
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <div className="max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight tracking-tight">
              Developer Documentation
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Everything you need to self-host NPC Finder for your friend group.
              Full control over your data, complete customization, and privacy
              by design.
            </p>
          </div>
        </section>

        {/* Getting Started Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">
              Getting Started
            </h3>
            <p className="text-gray-400 max-w-2xl mb-6">
              NPC Finder is open source and designed to be self-hosted. Follow
              this guide to set up your own instance.
            </p>

            {/* Development Warning */}
            <div
              className="relative pl-6 pr-4 py-4 rounded-r-lg mb-8"
              style={{
                background: `linear-gradient(to right, ${LANDING_PEACH}0D, transparent)`,
                borderLeft: `2px solid ${LANDING_PEACH}80`,
              }}
            >
              <p className="text-gray-300 text-sm leading-relaxed">
                <span className="font-medium" style={{ color: LANDING_PEACH }}>
                  Note:
                </span>{" "}
                NPC Finder is in active development. We recommend waiting for
                the v1.0 milestone before deploying to production unless you're
                comfortable with frequent updates and potential breaking
                changes.
              </p>
            </div>

            {/* Prerequisites */}
            <div className="bg-slate-800/40 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-4">Prerequisites</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>•</span>
                  <span>Node.js 18+ installed on your system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>•</span>
                  <span>Supabase account (free tier available)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>•</span>
                  <span>Basic knowledge of Git, npm, and PostgreSQL</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Setup Overview Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">
              Setup Overview
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Follow these steps to get NPC Finder running on your own
              infrastructure.
            </p>
          </div>

          <div className="space-y-4">
            <Accordion
              title="Clone & Install"
              defaultOpen={true}
              index={0}
              idPrefix="setup"
              icon={Code}
              iconColor={LANDING_TEAL}
            >
              <div className="space-y-4">
                <p className="text-gray-300">
                  Clone the repository and install dependencies:
                </p>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-300">
                    <div>
                      git clone https://github.com/aftongauntlett/npcfinder.git
                    </div>
                    <div>cd npcfinder</div>
                    <div>npm install</div>
                  </div>
                </div>
                <p className="text-gray-300">Create your environment file:</p>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-300">
                    <div>cp .env.example .env.local</div>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Database Setup"
              defaultOpen={false}
              index={1}
              idPrefix="setup"
              icon={Terminal}
              iconColor={LANDING_PURPLE}
            >
              <div className="space-y-4">
                <p className="text-gray-300">
                  <strong>1. Create a Supabase Project</strong>
                </p>
                <ul className="space-y-2 text-gray-300 ml-4">
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PURPLE }}>•</span>
                    <span>
                      Go to{" "}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: LANDING_PEACH }}
                        className="hover:opacity-80 underline"
                      >
                        supabase.com
                      </a>{" "}
                      and create a new project
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PURPLE }}>•</span>
                    <span>Save your database password securely</span>
                  </li>
                </ul>

                <p className="text-gray-300 mt-4">
                  <strong>2. Run Migrations</strong>
                </p>
                <p className="text-gray-300">
                  In the Supabase dashboard SQL Editor, run the baseline
                  migration:
                </p>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-300">
                    supabase/migrations/20250116000000_baseline_schema.sql
                  </div>
                </div>

                <p className="text-gray-300 mt-4">
                  <strong>3. Configure Environment</strong>
                </p>
                <p className="text-gray-300">
                  Add your Supabase credentials to{" "}
                  <code className="text-sm bg-slate-800 px-1.5 py-0.5 rounded">
                    .env.local
                  </code>
                  :
                </p>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-300">
                    <div>VITE_SUPABASE_URL=your-project-url</div>
                    <div>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
                  </div>
                </div>

                <a
                  href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/DATABASE-MIGRATIONS.md"
                  style={{ color: LANDING_PEACH }}
                  className="hover:opacity-80 underline transition-opacity inline-block mt-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View detailed migration guide →
                </a>
              </div>
            </Accordion>

            <Accordion
              title="API Configuration"
              defaultOpen={false}
              index={2}
              idPrefix="setup"
              icon={Key}
              iconColor={LANDING_PEACH}
            >
              <div className="space-y-4">
                <p className="text-gray-300">
                  NPC Finder integrates with several external APIs for media
                  metadata. All are free tier:
                </p>
                <ul className="space-y-3 text-gray-300 ml-4">
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PEACH }}>•</span>
                    <span>
                      <strong>TMDB</strong> - Movies and TV shows metadata
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PEACH }}>•</span>
                    <span>
                      <strong>Google Books</strong> - Book information and
                      covers
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PEACH }}>•</span>
                    <span>
                      <strong>OMDB</strong> - Additional movie data
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PEACH }}>•</span>
                    <span>
                      <strong>iTunes</strong> - Music and podcast data
                    </span>
                  </li>
                </ul>
                <a
                  href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/API-SETUP.md"
                  style={{ color: LANDING_PEACH }}
                  className="hover:opacity-80 underline transition-opacity inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View complete API setup guide →
                </a>
              </div>
            </Accordion>

            <Accordion
              title="Invite System"
              defaultOpen={false}
              index={3}
              idPrefix="setup"
              icon={Lock}
              iconColor={LANDING_TEAL}
            >
              <div className="space-y-4">
                <p className="text-gray-300">
                  NPC Finder uses an invite-only system for access control.
                </p>

                <p className="text-gray-300">
                  <strong>Creating Your First Admin:</strong>
                </p>
                <ol className="space-y-2 text-gray-300 ml-4 list-decimal">
                  <li>Sign up through the app with any email</li>
                  <li>In Supabase SQL Editor, run:</li>
                </ol>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-300">
                    <div>UPDATE user_profiles</div>
                    <div>SET is_admin = true</div>
                    <div>WHERE email = 'your-email@example.com';</div>
                  </div>
                </div>

                <p className="text-gray-300 mt-4">
                  <strong>Generating Invite Codes:</strong>
                </p>
                <ul className="space-y-2 text-gray-300 ml-4">
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_TEAL }}>•</span>
                    <span>Log in as admin and go to Admin Panel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_TEAL }}>•</span>
                    <span>Create codes tied to specific email addresses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_TEAL }}>•</span>
                    <span>Codes expire after 30 days and work only once</span>
                  </li>
                </ul>

                <a
                  href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/INVITE-SYSTEM-QUICKSTART.md"
                  style={{ color: LANDING_PEACH }}
                  className="hover:opacity-80 underline transition-opacity inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View full invite system documentation →
                </a>
              </div>
            </Accordion>

            <Accordion
              title="Deployment"
              defaultOpen={false}
              index={4}
              idPrefix="setup"
              icon={CloudArrowUp}
              iconColor={LANDING_PURPLE}
            >
              <div className="space-y-4">
                <p className="text-gray-300">
                  NPC Finder is a static site that can be deployed to any
                  hosting platform that supports Vite builds.
                </p>

                <p className="text-gray-300">
                  <strong>Recommended Platforms:</strong>
                </p>
                <ul className="space-y-2 text-gray-300 ml-4">
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PURPLE }}>•</span>
                    <span>
                      <strong>Vercel</strong> - Zero-config deployment,
                      automatic previews
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PURPLE }}>•</span>
                    <span>
                      <strong>Netlify</strong> - Continuous deployment, form
                      handling
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: LANDING_PURPLE }}>•</span>
                    <span>
                      <strong>Cloudflare Pages</strong> - Global CDN, fast
                      builds
                    </span>
                  </li>
                </ul>

                <p className="text-gray-300 mt-4">
                  <strong>Build Command:</strong>
                </p>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-300">npm run build</div>
                </div>

                <p className="text-gray-300 mt-4">
                  <strong>Environment Variables:</strong>
                </p>
                <p className="text-gray-300">
                  Make sure to set all{" "}
                  <code className="text-sm bg-slate-800 px-1.5 py-0.5 rounded">
                    VITE_*
                  </code>{" "}
                  environment variables in your hosting platform's dashboard.
                </p>

                <a
                  href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/DEV-PROD-WORKFLOW.md"
                  style={{ color: LANDING_PEACH }}
                  className="hover:opacity-80 underline transition-opacity inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View dev/prod workflow guide →
                </a>
              </div>
            </Accordion>
          </div>
        </motion.section>

        {/* Architecture Deep Dive Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">
              Architecture Deep Dive
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Understanding NPC Finder's technical architecture and design
              decisions.
            </p>
          </div>

          <div className="space-y-4">
            {landingArchitecture.map((arch, index) => (
              <Accordion
                key={arch.title}
                title={arch.title}
                defaultOpen={index === 0}
                index={index}
                idPrefix="arch"
                icon={arch.icon}
                iconColor={arch.iconColor}
                items={arch.items}
                itemColors={arch.itemColors}
              />
            ))}
          </div>
        </motion.section>

        {/* Privacy & Security Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">
              Privacy & Security
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Understanding the privacy model and security architecture.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-white/10 rounded-xl p-8 mb-8">
            <h4 className="text-xl font-semibold mb-4">Privacy Model</h4>
            <div className="space-y-4 text-gray-300">
              <p>
                NPC Finder uses Row-Level Security (RLS) to protect user data
                from other users. This means:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>✓</span>
                  <span>
                    Users can only see their own data and data explicitly shared
                    with them
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>✓</span>
                  <span>
                    All database queries are automatically filtered by user ID
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: LANDING_TEAL }}>✓</span>
                  <span>
                    Friend connections are opt-in and manually managed
                  </span>
                </li>
              </ul>

              <div
                className="relative pl-6 pr-4 py-4 rounded-r-lg mt-6"
                style={{
                  background: `linear-gradient(to right, ${LANDING_PEACH}0D, transparent)`,
                  borderLeft: `2px solid ${LANDING_PEACH}80`,
                }}
              >
                <p className="text-sm leading-relaxed">
                  <span
                    className="font-medium"
                    style={{ color: LANDING_PEACH }}
                  >
                    Important:
                  </span>{" "}
                  Database administrators have technical access to the
                  underlying data, similar to how Netflix or Spotify
                  administrators can access their platforms. End-to-end
                  encryption for private messaging and journaling (like Signal)
                  is on the future roadmap, but requires significant
                  architectural changes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-white/10 rounded-xl p-8">
            <h4 className="text-xl font-semibold mb-4">Security Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5
                  className="font-medium mb-2"
                  style={{ color: LANDING_PURPLE }}
                >
                  Database Level
                </h5>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Row-Level Security (RLS) policies</li>
                  <li>• PostgreSQL security best practices</li>
                  <li>• Database triggers for admin protection</li>
                  <li>• Prepared statements (SQL injection prevention)</li>
                </ul>
              </div>
              <div>
                <h5
                  className="font-medium mb-2"
                  style={{ color: LANDING_PURPLE }}
                >
                  Application Level
                </h5>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• JWT session management</li>
                  <li>• XSS protection (plain text rendering)</li>
                  <li>• CSP and security headers</li>
                  <li>• Email-validated invite codes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md"
              style={{ color: LANDING_PEACH }}
              className="hover:opacity-80 underline transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Reality Check →
            </a>
            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/SECURITY-REVIEW-2025.md"
              style={{ color: LANDING_PEACH }}
              className="hover:opacity-80 underline transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              Security Review 2025 →
            </a>
            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/SECURITY-CHECKLIST.md"
              style={{ color: LANDING_PEACH }}
              className="hover:opacity-80 underline transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              Security Checklist →
            </a>
          </div>
        </motion.section>

        {/* Additional Resources Section */}
        <motion.section
          className="max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">
              Additional Resources
            </h3>
            <p className="text-gray-400 max-w-2xl">
              Complete documentation and guides for developers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/QUICK-START.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_TEAL }}
              >
                Self-Hosting Guide
              </h4>
              <p className="text-sm text-gray-400">
                Complete setup guide for running your own instance
              </p>
            </a>

            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/API-SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_PURPLE }}
              >
                API Setup
              </h4>
              <p className="text-sm text-gray-400">
                Configure TMDB, Google Books, OMDB, and iTunes APIs
              </p>
            </a>

            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/DATABASE-MIGRATIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_PEACH }}
              >
                Database Migrations
              </h4>
              <p className="text-sm text-gray-400">
                Schema management and migration guide
              </p>
            </a>

            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/TESTING-STRATEGY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_TEAL }}
              >
                Testing Strategy
              </h4>
              <p className="text-sm text-gray-400">
                Writing and running tests for NPC Finder
              </p>
            </a>

            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/DEV-PROD-WORKFLOW.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_PURPLE }}
              >
                Dev/Prod Workflow
              </h4>
              <p className="text-sm text-gray-400">
                Safe database development workflow
              </p>
            </a>

            <a
              href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/RATE-LIMITING-GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/40 border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-colors group"
            >
              <h4
                className="text-lg font-semibold mb-2 group-hover:text-white transition-colors"
                style={{ color: LANDING_PEACH }}
              >
                Rate Limiting Guide
              </h4>
              <p className="text-sm text-gray-400">
                Optional rate limiting implementation
              </p>
            </a>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4">
              <LandingButton
                href="https://github.com/aftongauntlett/npcfinder"
                variant="primary"
                icon={<GithubLogo className="w-4 h-4" weight="duotone" />}
              >
                View on GitHub
              </LandingButton>
              <LandingButton
                href="https://github.com/aftongauntlett/npcfinder/issues"
                variant="ghost"
              >
                Report an Issue
              </LandingButton>
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

export default DeveloperDocs;
