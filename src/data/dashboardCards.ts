export type Card = {
  title: string;
  description: string;
  gradient: string;
  id: number;
};

export const cards: Card[] = [
  {
    title: "Movies & TV",
    description:
      "Track films and series, rate favorites, and discover new content",
    gradient: "from-slate-500/10 to-gray-500/10",
    id: 1,
  },
  {
    title: "Music",
    description: "Your personal soundtrack library and discovery zone",
    gradient: "from-blue-500/10 to-slate-500/10",
    id: 2,
  },
  {
    title: "Games",
    description: "Gaming backlog, reviews, and achievement tracking",
    gradient: "from-gray-500/10 to-blue-500/10",
    id: 3,
  },
  {
    title: "Fitness",
    description: "Track workouts, meals, weight, and body measurements",
    gradient: "from-green-500/10 to-emerald-500/10",
    id: 4,
  },
  {
    title: "Food & Places",
    description: "Restaurant reviews, travel spots, and culinary adventures",
    gradient: "from-blue-600/10 to-slate-600/10",
    id: 5,
  },
  {
    title: "Journal",
    description: "Daily thoughts, memories, and creative expressions",
    gradient: "from-gray-600/10 to-blue-600/10",
    id: 6,
  },
  {
    title: "News",
    description: "Stay informed with curated articles and trending stories",
    gradient: "from-red-500/10 to-orange-500/10",
    id: 7,
  },
  {
    title: "Bookmarks",
    description: "Save and organize your favorite links and resources",
    gradient: "from-purple-500/10 to-pink-500/10",
    id: 8,
  },
  {
    title: "Vault",
    description: "Secure storage for private notes and important documents",
    gradient: "from-indigo-500/10 to-purple-500/10",
    id: 9,
  },
];
