import { Search } from "lucide-react";
import type { MediaItem } from "./SendMediaModal";

interface SendMediaModalSearchStepProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: MediaItem[];
  searching: boolean;
  onItemSelect: (item: MediaItem) => void;
  searchPlaceholder: string;
}

export default function SendMediaModalSearchStep({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  onItemSelect,
  searchPlaceholder,
}: SendMediaModalSearchStepProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          autoFocus
        />
      </div>

      {searching && <p className="text-center text-gray-500">Searching...</p>}

      {!searching && searchQuery && searchResults.length === 0 && (
        <p className="text-center text-gray-500">No results found</p>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((item) => (
            <button
              key={item.external_id}
              onClick={() => onItemSelect(item)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              {item.poster_url && (
                <img
                  src={item.poster_url}
                  alt={item.title}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
