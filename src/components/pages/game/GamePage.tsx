import React, { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import Button from "@/components/shared/ui/Button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useGameLaunch } from "@/hooks/useGameLaunch";

const pageMetaOptions = {
  title: "Game",
  description: "Play NPC Finder game in an immersive in-app view",
  noIndex: true,
};

const GamePage: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { getLaunchUrl, loading, error } = useGameLaunch();

  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isOpeningNewTab, setIsOpeningNewTab] = useState(false);

  const previousCollapsedStateRef = useRef<boolean | null>(null);
  const initialCollapsedStateRef = useRef<boolean>(isCollapsed);

  useEffect(() => {
    previousCollapsedStateRef.current = initialCollapsedStateRef.current;
    setIsCollapsed(true);

    return () => {
      if (previousCollapsedStateRef.current !== null) {
        setIsCollapsed(previousCollapsedStateRef.current);
      }
    };
  }, [setIsCollapsed]);

  useEffect(() => {
    let isMounted = true;

    const launchForEmbed = async () => {
      const launchUrl = await getLaunchUrl("embed");
      if (isMounted && launchUrl) {
        setEmbedUrl(launchUrl);
      }
    };

    void launchForEmbed();

    return () => {
      isMounted = false;
    };
  }, [getLaunchUrl]);

  const handleOpenInNewTab = useCallback(async () => {
    setIsOpeningNewTab(true);
    const launchUrl = await getLaunchUrl("new_tab");
    if (launchUrl) {
      window.open(launchUrl, "_blank", "noopener,noreferrer");
    }
    setIsOpeningNewTab(false);
  }, [getLaunchUrl]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="h-screen w-full flex flex-col"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            onClick={() => void navigate("/app")}
            aria-label="Back to app"
          >
            Back
          </Button>
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white font-heading">
            NPC Finder Game
          </h1>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<ExternalLink className="w-4 h-4" aria-hidden="true" />}
          onClick={() => void handleOpenInNewTab()}
          aria-label="Open game in new tab"
          loading={isOpeningNewTab}
          disabled={loading}
        >
          Open in new tab
        </Button>
      </header>

      <section className="flex-1 min-h-0 bg-black/5 dark:bg-black/20">
        {embedUrl ? (
          <iframe
            title="NPC Finder Game"
            src={embedUrl}
            className="w-full h-full border-0"
            allow="fullscreen; autoplay"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-700 dark:text-gray-300">
            Preparing game session...
          </div>
        )}
      </section>

      {error && (
        <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 border-t border-amber-300/40 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-950/20">
          Secure game launch token is unavailable right now. Falling back to
          direct launch URL.
        </div>
      )}
    </main>
  );
};

export default GamePage;
