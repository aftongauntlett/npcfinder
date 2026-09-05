import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { QuestionIcon as Question, HouseIcon as House } from "@phosphor-icons/react";
import HeroConstellation from "../effects/HeroConstellation";
import LandingButton from "../landing/LandingButton";
import { LANDING_PEACH, LANDING_PURPLE } from "../../data/landingTheme";
import { usePageMeta } from "../../hooks/usePageMeta";

const pageMetaOptions = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  noIndex: true,
};

/**
 * 404 page for unmatched routes, styled to match the public landing page.
 */
const NotFoundPage: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Full-bleed constellation background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className={`absolute inset-0 -z-10 ${
            prefersReducedMotion ? "" : "animate-breathe-glow"
          }`}
          style={{
            background: `radial-gradient(circle at 50% 40%, ${LANDING_PEACH}22 0%, ${LANDING_PURPLE}1a 45%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
        <HeroConstellation
          responsive
          nodeCount={80}
          animationSpeed={0.7}
          className="w-full h-full opacity-60"
        />
      </div>

      {/* Header (matches landing page branding) */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <Question
              className="w-9 h-9"
              style={{ color: LANDING_PEACH }}
              weight="duotone"
            />
            <span className="text-2xl font-bold tracking-tight">
              NPC Finder
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-24 text-center">
        <div className="max-w-xl">
          <p
            className="text-7xl sm:text-8xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${LANDING_PEACH}, ${LANDING_PURPLE})`,
            }}
          >
            404
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
            This page doesn't exist
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-300 leading-relaxed">
            We couldn't find{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-800/60 text-sm text-neutral-200">
              {location.pathname}
            </code>
            . It may have been moved or never existed.
          </p>

          <div className="mt-10 flex justify-center">
            <LandingButton
              href="/"
              variant="primary"
              icon={<House className="w-4 h-4" weight="duotone" />}
            >
              Back to Home
            </LandingButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
