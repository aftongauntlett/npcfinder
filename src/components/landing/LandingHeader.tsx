import { Question, Lock } from "@phosphor-icons/react";
import LandingButton from "./LandingButton";
import { LANDING_PEACH } from "../../data/landingTheme";

/**
 * LandingHeader - Landing page header
 *
 * Site header with logo and login button.
 */
const LandingHeader = () => {
  return (
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
  );
};

export default LandingHeader;
