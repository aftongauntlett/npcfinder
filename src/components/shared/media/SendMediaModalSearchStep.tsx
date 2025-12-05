import { Search } from "lucide-react";
import { Input } from "@/components/shared";
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
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={searchPlaceholder}
        leftIcon={<Search className="w-5 h-5" />}
        autoFocus
      />

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
