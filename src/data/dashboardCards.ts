export type Card = {
  title: string;
  description: string;
  gradient: string;
  id: number;
  route: string;
};

export const cards: Card[] = [
  {
    title: "Movies & TV",
    description:
      "Track films and series, rate favorites, and discover new content",
    gradient: "from-slate-500/10 to-gray-500/10",
    id: 1,
    route: "/app/movies-tv",
  },
  {
    title: "Music",
    description: "Your personal soundtrack library and discovery zone",
    gradient: "from-blue-500/10 to-slate-500/10",
    id: 2,
    route: "/app/music",
  },
  {
    title: "Games",
    description: "Gaming backlog, reviews, and achievement tracking",
    gradient: "from-gray-500/10 to-blue-500/10",
    id: 3,
    route: "/app/games",
  },
  {
    title: "Fitness",
    description: "Track workouts, meals, weight, and body measurements",
    gradient: "from-green-500/10 to-emerald-500/10",
    id: 4,
    route: "/app/fitness",
  },
  {
    title: "Food & Places",
    description: "Restaurant reviews, travel spots, and culinary adventures",
    gradient: "from-blue-600/10 to-slate-600/10",
    id: 5,
    route: "/app/food-places",
  },
  {
    title: "Journal",
    description: "Daily thoughts, memories, and creative expressions",
    gradient: "from-gray-600/10 to-blue-600/10",
    id: 6,
    route: "/app/journal",
  },
  {
    title: "News",
    description: "Stay informed with curated articles and trending stories",
    gradient: "from-red-500/10 to-orange-500/10",
    id: 7,
    route: "/app/news",
  },
  {
    title: "Bookmarks",
    description: "Save and organize your favorite links and resources",
    gradient: "from-purple-500/10 to-pink-500/10",
    id: 8,
    route: "/app/bookmarks",
  },
  {
    title: "Vault",
    description: "Secure storage for private notes and important documents",
    gradient: "from-indigo-500/10 to-purple-500/10",
    id: 9,
    route: "/app/vault",
  },
];
