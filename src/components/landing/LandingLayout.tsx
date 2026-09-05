import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import {
  LockIcon as Lock,
  QuestionIcon as Question,
  ArrowUpIcon as ArrowUp,
  ArrowSquareOutIcon as ExternalLink,
  EnvelopeSimpleIcon as Envelope,
} from "@phosphor-icons/react";
import { useTheme } from "@/hooks/useTheme";
import { LANDING_PEACH } from "../../data/landingTheme";

// Only load the starfield in dark mode.
const StarryBackground = React.lazy(
  () => import("@/components/shared/common/StarryBackground"),
);

interface LandingLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared chrome (header, starfield, footer) for the public marketing pages
 * (landing, privacy, terms) so they read as one site instead of switching
 * styles between pages.
 */
const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const statusHref = isHome ? "#status" : "/#status";

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  const navLinkClassName = (path: string) =>
    location.pathname === path
      ? "text-teal-300 font-medium"
      : "hover:text-teal-300 transition-colors";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
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
          <Link to="/" className="flex items-center gap-3">
            <Question
              className="w-9 h-9"
              style={{ color: LANDING_PEACH }}
              weight="duotone"
            />
            <h1 className="text-2xl font-bold tracking-tight">NPC Finder</h1>
          </Link>
          <a
            href={statusHref}
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
        {children}
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 backdrop-blur-md border-t border-white/5"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-white/5">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Question
                  className="w-6 h-6"
                  style={{ color: LANDING_PEACH }}
                  weight="duotone"
                />
                <span className="text-lg font-bold tracking-tight text-white">
                  NPC Finder
                </span>
              </div>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                A private media tracker for notes, ratings, and timelines,
                with shared playlists for a small circle of friends.
              </p>
            </div>

            {/* Section links */}
            <nav aria-label="Page sections">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Explore
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/" className={navLinkClassName("/")}>
                    Home
                  </Link>
                </li>
                <li>
                  <a
                    href={isHome ? "#features" : "/#features"}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href={isHome ? "#demo" : "/#demo"}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Screenshots
                  </a>
                </li>
                <li>
                  <a
                    href={statusHref}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Project Status
                  </a>
                </li>
              </ul>
            </nav>

            {/* Legal + source links */}
            <nav aria-label="Legal and source links">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                More
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/privacy" className={navLinkClassName("/privacy")}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={navLinkClassName("/terms")}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/aftongauntlett/npcfinder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:text-teal-300 transition-colors"
                  >
                    View Source
                    <ExternalLink
                      className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      weight="duotone"
                    />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@aftongauntlett.com"
                    className="group inline-flex items-center gap-1.5 hover:text-teal-300 transition-colors"
                  >
                    Contact
                    <Envelope
                      className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      weight="duotone"
                    />
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()} Afton Gauntlett. Built with React,
              TypeScript, and Supabase.
            </p>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
              aria-label="Scroll to top"
            >
              Back to top
              <ArrowUp className="w-3.5 h-3.5" weight="duotone" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
