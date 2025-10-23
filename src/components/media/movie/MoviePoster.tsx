import { Film, Tv } from "lucide-react";

interface MoviePosterProps {
  posterUrl: string | null;
  title: string;
  mediaType: "movie" | "tv";
}

export function MoviePoster({ posterUrl, title, mediaType }: MoviePosterProps) {
  const MediaIcon = mediaType === "tv" ? Tv : Film;

  if (posterUrl) {
    return (
      <img
        src={posterUrl.replace("w200", "w500")}
        alt={title}
        className="w-full sm:w-56 h-auto rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 cursor-pointer"
      />
    );
  }

  return (
    <div className="w-full sm:w-56 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-xl">
      <MediaIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
    </div>
  );
}
