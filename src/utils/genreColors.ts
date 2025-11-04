/**
 * Consistent genre color mapping across all media types (Movies, TV, Games, Music, Books)
 * Ensures the same genre has the same color regardless of media type
 */
export function getGenreColor(genre: string): string {
  const genreColors: Record<string, string> = {
    // Shared genres across media types
    horror: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    action:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    adventure:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    comedy:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    drama:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    thriller:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    mystery:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    fantasy:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "sci-fi":
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "science fiction":
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    romance: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",

    // Music genres
    pop: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    rock: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    jazz: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    classical:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    electronic:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "hip-hop":
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    rap: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    country:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    blues: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    metal: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    indie: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    alternative:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    soul: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "r&b":
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    funk: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    reggae:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    folk: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    punk: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",

    // Game genres
    rpg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    shooter: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    platformer:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    strategy:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    puzzle: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    racing:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    sports:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    simulation: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    mmo: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    mmorpg:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    fighting: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    survival:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    sandbox:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    stealth:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    arcade: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    casual: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    card: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    board:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",

    // Book categories
    fiction: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "non-fiction":
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    nonfiction:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    biography:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    history:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    science:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",

    // Movie/TV specific genres
    documentary:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    animation:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    crime: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    war: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    western:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    family:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    music: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",

    // TV-specific
    "tv movie": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

    // Default
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const normalizedGenre = genre.toLowerCase().trim();
  return genreColors[normalizedGenre] || genreColors.default;
}

/**
 * Parse genres string (comma-separated) and return first N genres
 */
export function parseGenres(
  genresString: string | null | undefined,
  limit = 2
): string[] {
  if (!genresString) return [];

  return genresString
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g.length > 0)
    .slice(0, limit);
}
