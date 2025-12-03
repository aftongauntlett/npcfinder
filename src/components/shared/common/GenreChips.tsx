import { getGenreColor } from "../../../utils/genreColors";
import Tooltip from "../ui/Tooltip";
import Chip from "../ui/Chip";

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

  const visibleGenres = maxVisible
    ? genreArray.slice(0, maxVisible)
    : genreArray;
  const remainingGenres = maxVisible ? genreArray.slice(maxVisible) : [];
  const remainingCount = remainingGenres.length;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1.5 text-xs",
  };

  const roundedClass = variant === "pill" ? "rounded-full" : "rounded";

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 ${className}`}
      role="list"
      aria-label="Genres"
    >
      {visibleGenres.map((genre, index) => (
        <span
          key={`${genre}-${index}`}
          role="listitem"
          className={`inline-flex items-center font-medium ${
            sizeClasses[size]
          } ${roundedClass} ${getGenreColor(
            genre
          )} hover:opacity-80 transition-opacity duration-200 cursor-default`}
        >
          {genre}
        </span>
      ))}

      {remainingCount > 0 && (
        <Tooltip
          content={
            <ul className="space-y-1.5">
              {remainingGenres.map((genre, index) => (
                <li
                  key={`tooltip-${genre}-${index}`}
                  className="text-sm font-medium"
                >
                  {genre}
                </li>
              ))}
            </ul>
          }
          position="right"
        >
          <Chip
            variant="primary"
            size={size}
            rounded="full"
            className="cursor-default select-none"
            aria-label={`${remainingCount} more genres: ${remainingGenres.join(
              ", "
            )}`}
          >
            +{remainingCount}
          </Chip>
        </Tooltip>
      )}
    </div>
  );
}
