import {
  GithubLogo,
  LinkedinLogo,
  ArrowSquareOut,
  ArrowUp,
} from "@phosphor-icons/react";

/**
 * LandingFooter - Landing page footer
 *
 * Site footer with copyright, social links, and scroll to top button.
 */
const LandingFooter = () => {
  return (
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
  );
};

export default LandingFooter;
