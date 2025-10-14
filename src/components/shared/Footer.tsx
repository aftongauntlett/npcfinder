import React from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, ExternalLink } from "lucide-react";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          {/* Creator info */}
          <div className="text-center md:text-left">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Built with ✨ by{" "}
              <a
                href="https://aftongauntlett.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-dark hover:text-primary underline transition-colors duration-200 inline-flex items-center gap-1"
              >
                Afton Gauntlett
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </p>
          </div>

          {/* Action links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
            aria-label="Footer navigation"
          >
            <button
              onClick={() => void navigate("/suggestions")}
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
            >
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
              Have a suggestion?
            </button>

            <a
              href="https://github.com/aftongauntlett"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              GitHub
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} NPC Finder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
