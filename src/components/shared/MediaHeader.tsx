import GenreChips from "./GenreChips";
import MetadataRow, { MetadataItem } from "./MetadataRow";

interface MediaHeaderProps {
  title: string;
  metadata?: MetadataItem[];
  genres?: string[] | string;
  className?: string;
}

export default function MediaHeader({
  title,
  metadata = [],
  genres,
  className = "",
}: MediaHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
        {title}
      </h2>

      {/* Metadata (Year, Runtime, etc.) */}
      {metadata.length > 0 && <MetadataRow items={metadata} />}

      {/* Genres */}
      {genres && <GenreChips genres={genres} maxVisible={6} />}
    </div>
  );
}
