import React from "react";
import { Lightbulb } from "lucide-react";

interface BooksSuggestionsProps {
  embedded?: boolean;
}

/**
 * Placeholder for Books recommendations/suggestions tab
 * Will be implemented similar to MoviesSuggestions
 */
const BooksSuggestions: React.FC<BooksSuggestionsProps> = ({
  embedded: _embedded = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Lightbulb className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Book Recommendations Coming Soon
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        Share book recommendations with friends and see what they're suggesting
        for you.
      </p>
    </div>
  );
};

export default BooksSuggestions;
