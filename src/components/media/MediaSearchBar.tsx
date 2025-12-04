import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/shared";

interface MediaSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const MediaSearchBar: React.FC<MediaSearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        leftIcon={
          <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
        }
        aria-label="Search media"
      />
      {query && (
        <Button
          type="button"
          onClick={handleClear}
          variant="subtle"
          size="icon"
          icon={<X className="w-5 h-5" />}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        />
      )}
    </form>
  );
};

export default MediaSearchBar;
