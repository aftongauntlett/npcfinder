import GenreChips from "../common/GenreChips";
import MetadataRow, { MetadataItem } from "../common/MetadataRow";

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
    <div className={`space-y-2.5 ${className}`}>
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
        {title}
      </h2>

      {/* Metadata (Year, Runtime, etc.) */}
      {metadata.length > 0 && <MetadataRow items={metadata} size="sm" />}

      {/* Genres */}
      {genres && <GenreChips genres={genres} maxVisible={6} size="sm" />}
    </div>
  );
}
