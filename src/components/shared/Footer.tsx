import React from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          {/* Copyright & Creator */}
          <p className="text-gray-500 dark:text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} NPC Finder · Built by{" "}
            <a
              href="https://aftongauntlett.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-dark hover:text-primary underline transition-colors"
            >
              Afton Gauntlett
            </a>
          </p>

          {/* Action Links */}
          <nav
            className="flex items-center gap-4"
            aria-label="Footer navigation"
          >
            <button
              onClick={() => void navigate("/app/suggestions")}
              className="inline-flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              aria-label="Submit a suggestion"
            >
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
              Suggestions
            </button>

            <a
              href="https://github.com/aftongauntlett"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
