import React from "react";
import { Music as MusicIcon } from "lucide-react";

interface MusicSuggestionsProps {
  embedded?: boolean;
}

/**
 * MusicSuggestions Component
 * Shows music recommendations from friends
 * Matches pattern from MoviesSuggestions and BooksSuggestions
 */
const MusicSuggestions: React.FC<MusicSuggestionsProps> = ({
  embedded: _embedded = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Placeholder - Use existing Music.tsx recommendations logic */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MusicIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Music Recommendations
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Music recommendations from friends will appear here. This uses the
          existing Music.tsx component logic - we'll integrate it shortly.
        </p>
      </div>
    </div>
  );
};

export default MusicSuggestions;
