import React from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Github } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="py-4">
      <div className="container mx-auto px-4 border-t border-gray-200/60 dark:border-white/5 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 text-xs">
          <nav
            className="flex items-center justify-center sm:justify-start gap-4"
            aria-label="Footer legal links"
          >
            <Link
              to="/privacy"
              className="text-gray-500 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-gray-500 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
            >
              Terms
            </Link>
          </nav>

          <p className="text-gray-500 dark:text-gray-500 text-center">
            © {new Date().getFullYear()} NPC Finder
          </p>

          <div className="flex items-center justify-center sm:justify-end gap-4">
            <a
              href="https://github.com/aftongauntlett/npcfinder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              <span>View Source</span>
            </a>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center text-gray-500 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
