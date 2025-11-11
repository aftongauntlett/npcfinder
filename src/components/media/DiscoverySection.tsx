import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { SimilarMoviesCarousel } from "./SimilarMoviesCarousel";
import type { SimilarMediaItem } from "../../utils/tmdbDetails";

interface DiscoverySectionProps {
  id: string;
  label: string;
  icon: LucideIcon;
  count: number | string;
  data: SimilarMediaItem[];
  isExpanded: boolean;
  isLoading: boolean;
  themeColor: string;
  existingIds: string[];
  onToggle: () => void;
  onAddToWatchlist: (movie: SimilarMediaItem) => void;
}

/**
 * Collapsible discovery section with expand/load states
 * Used in MovieDiscoveryCard for trending, popular, and personalized sections
 */
const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  id,
  label,
  icon: Icon,
  count,
  data,
  isExpanded,
  isLoading,
  themeColor,
  existingIds,
  onToggle,
  onAddToWatchlist,
}) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/30 hover:border-primary/30 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <motion.button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-expanded={isExpanded}
        aria-controls={`discovery-section-${id}`}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${themeColor}20`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: themeColor }} />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {count} movies
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </motion.button>

      {isExpanded && (
        <div
          id={`discovery-section-${id}`}
          className="border-t border-gray-200 dark:border-gray-700 p-4"
        >
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : data.length > 0 ? (
            <SimilarMoviesCarousel
              movies={data}
              onAddToWatchlist={onAddToWatchlist}
              existingIds={existingIds}
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recommendations available
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DiscoverySection;
