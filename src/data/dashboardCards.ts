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
    title: "TV Shows",
    description: "Binge lists, episode tracking, and series discoveries",
    gradient: "from-slate-600/10 to-gray-600/10",
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
];
