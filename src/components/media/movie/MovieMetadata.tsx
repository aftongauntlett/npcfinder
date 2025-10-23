import { Calendar, Clock, Film, Tv } from "lucide-react";

interface MovieMetadataProps {
  releaseYear: number | null;
  runtime?: number | null;
  mediaType: "movie" | "tv";
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function MovieMetadata({
  releaseYear,
  runtime,
  mediaType,
}: MovieMetadataProps) {
  const MediaIcon = mediaType === "tv" ? Tv : Film;

  const metadata = [
    releaseYear && {
      icon: Calendar,
      value: releaseYear.toString(),
    },
    runtime && {
      icon: Clock,
      value: formatRuntime(runtime),
    },
    {
      icon: MediaIcon,
      value: mediaType,
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
      {metadata.map((item, index) => {
        if (!item) return null;
        const Icon = item.icon;
        return (
          <div key={index} className="flex items-center gap-1">
            <Icon className="w-4 h-4" />
            <span className="capitalize">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
