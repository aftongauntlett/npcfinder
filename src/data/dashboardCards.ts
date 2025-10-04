export type Card = {
  title: string;
  description: string;
  gradient: string;
  id: number;
};

export const cards: Card[] = [
  {
    title: "Movies",
    description:
      "Track what you've watched, rate favorites, and discover new films",
    gradient: "from-red-500/20 to-pink-500/20",
    id: 1,
  },
  {
    title: "Music",
    description: "Your personal soundtrack library and discovery zone",
    gradient: "from-green-500/20 to-emerald-500/20",
    id: 2,
  },
  {
    title: "Games",
    description: "Gaming backlog, reviews, and achievement tracking",
    gradient: "from-blue-500/20 to-cyan-500/20",
    id: 3,
  },
  {
    title: "TV Shows",
    description: "Binge lists, episode tracking, and series discoveries",
    gradient: "from-yellow-500/20 to-orange-500/20",
    id: 4,
  },
  {
    title: "Food & Places",
    description: "Restaurant reviews, travel spots, and culinary adventures",
    gradient: "from-purple-500/20 to-indigo-500/20",
    id: 5,
  },
  {
    title: "Journal",
    description: "Daily thoughts, memories, and creative expressions",
    gradient: "from-pink-500/20 to-rose-500/20",
    id: 6,
  },
];
