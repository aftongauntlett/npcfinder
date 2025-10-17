export type Card = {
  title: string;
  description: string;
  gradient: string;
  id: number;
  cardId: string; // Unique identifier for user preferences
  route: string;
};

export const cards: Card[] = [
  {
    title: "Movies & TV",
    description:
      "Track films and series, rate favorites, and discover new content",
    gradient: "from-slate-500/10 to-gray-500/10",
    id: 1,
    cardId: "movies-tv",
    route: "/app/movies-tv",
  },
  {
    title: "Music",
    description: "Your personal soundtrack library and discovery zone",
    gradient: "from-blue-500/10 to-slate-500/10",
    id: 2,
    cardId: "music",
    route: "/app/music",
  },
];
