import { useState } from "react";
import { getGenreColor } from "../../utils/genreColors";

interface GenreChipsProps {
  genres: string[] | string;
  maxVisible?: number;
  size?: "sm" | "md";
  variant?: "rounded" | "pill";
  className?: string;
}

export default function GenreChips({
  genres,
  maxVisible,
  size = "md",
  variant = "pill",
  className = "",
}: GenreChipsProps) {
  const [showAll, setShowAll] = useState(false);

  // Parse genres if string is passed (comma-separated)
  const genreArray = Array.isArray(genres)
    ? genres
    : typeof genres === "string"
    ? genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
    : [];

  if (genreArray.length === 0) {
    return null;
  }

  const visibleGenres =
    maxVisible && !showAll ? genreArray.slice(0, maxVisible) : genreArray;
  const remainingCount =
    maxVisible && !showAll ? genreArray.length - maxVisible : 0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1.5 text-xs",
  };

  const roundedClass = variant === "pill" ? "rounded-full" : "rounded";

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="list"
      aria-label="Genres"
    >
      {visibleGenres.map((genre, index) => (
        <span
          key={`${genre}-${index}`}
          role="listitem"
          className={`font-medium ${
            sizeClasses[size]
          } ${roundedClass} ${getGenreColor(
            genre
          )} hover:opacity-80 transition-opacity duration-200 cursor-default`}
        >
          {genre}
        </span>
      ))}

      {remainingCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          title={`Show ${remainingCount} more genre${
            remainingCount !== 1 ? "s" : ""
          }: ${genreArray.slice(maxVisible || 0).join(", ")}`}
          className="px-3 py-1 text-xs font-medium rounded-full
                     bg-purple-100 dark:bg-purple-900/30
                     text-purple-700 dark:text-purple-300
                     border border-purple-200 dark:border-purple-800
                     hover:bg-purple-200 dark:hover:bg-purple-900/50
                     transition-colors duration-200"
          aria-label={`Show ${remainingCount} more genres`}
        >
          +{remainingCount} more
        </button>
      )}

      {showAll && maxVisible && genreArray.length > maxVisible && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={`font-medium ${sizeClasses[size]} ${roundedClass} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer`}
          aria-label="Show less"
        >
          Show less
        </button>
      )}
    </div>
  );
}
