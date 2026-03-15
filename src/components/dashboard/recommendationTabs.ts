import { BookOpen, Clapperboard, Gamepad2, Music } from "lucide-react";

export type RecommendationMediaTab = "movies-tv" | "books" | "games" | "music";

export const TAB_CONFIG: Array<{
  id: RecommendationMediaTab;
  label: string;
  icon: typeof Clapperboard;
  emptySubMessage: string;
  consumedStatus: string;
}> = [
  {
    id: "movies-tv",
    label: "Movies & TV",
    icon: Clapperboard,
    emptySubMessage:
      "When friends recommend movies or TV shows, they'll show up here",
    consumedStatus: "watched",
  },
  {
    id: "books",
    label: "Books",
    icon: BookOpen,
    emptySubMessage: "When friends recommend books, they'll show up here",
    consumedStatus: "read",
  },
  {
    id: "games",
    label: "Games",
    icon: Gamepad2,
    emptySubMessage: "When friends recommend games, they'll show up here",
    consumedStatus: "played",
  },
  {
    id: "music",
    label: "Music",
    icon: Music,
    emptySubMessage:
      "When friends recommend songs or albums, they'll show up here",
    consumedStatus: "consumed",
  },
];
