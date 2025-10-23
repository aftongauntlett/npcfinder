/**
 * Returns muted/pastel colors for movie/TV genres
 * Colors are subtle and work well in both light and dark modes
 */
export function getGenreColor(genre: string): string {
  const genreColors: Record<string, string> = {
    // Action & Adventure
    action: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    adventure:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",

    // Scary & Thriller
    horror: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    thriller:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",

    // Drama & Romance
    drama:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    romance: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",

    // Comedy & Family
    comedy:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    family: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",

    // Sci-Fi & Fantasy
    "science fiction":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    fantasy:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",

    // Other genres
    crime: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    mystery:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    animation:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    documentary:
      "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    war: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    western:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    history: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    music: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",

    // TV-specific
    "tv movie": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

    // Default
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const normalizedGenre = genre.toLowerCase().trim();
  return genreColors[normalizedGenre] || genreColors.default;
}
