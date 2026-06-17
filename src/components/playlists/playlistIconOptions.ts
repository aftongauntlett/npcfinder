import {
  BookOpen,
  Coffee,
  Film,
  Flame,
  Ghost,
  Globe,
  Headphones,
  Heart,
  ListMusic,
  Moon,
  Music,
  Popcorn,
  Rocket,
  Skull,
  Smile,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlaylistIconDef {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const PLAYLIST_ICONS: PlaylistIconDef[] = [
  { id: "list-music", label: "Playlist", Icon: ListMusic },
  { id: "star", label: "Favorites", Icon: Star },
  { id: "heart", label: "Romance", Icon: Heart },
  { id: "smile", label: "Comedy", Icon: Smile },
  { id: "skull", label: "Horror", Icon: Skull },
  { id: "ghost", label: "Supernatural", Icon: Ghost },
  { id: "flame", label: "Thriller", Icon: Flame },
  { id: "zap", label: "Action", Icon: Zap },
  { id: "swords", label: "Fantasy", Icon: Swords },
  { id: "rocket", label: "Sci-Fi", Icon: Rocket },
  { id: "sparkles", label: "Magical", Icon: Sparkles },
  { id: "moon", label: "Atmospheric", Icon: Moon },
  { id: "globe", label: "World", Icon: Globe },
  { id: "trophy", label: "Sports", Icon: Trophy },
  { id: "film", label: "Cinema", Icon: Film },
  { id: "popcorn", label: "Fun", Icon: Popcorn },
  { id: "music", label: "Music", Icon: Music },
  { id: "headphones", label: "Audio", Icon: Headphones },
  { id: "book-open", label: "Literature", Icon: BookOpen },
  { id: "coffee", label: "Cozy", Icon: Coffee },
];

const iconMap = new Map(PLAYLIST_ICONS.map(({ id, Icon }) => [id, Icon]));

export function getPlaylistIcon(id: string): LucideIcon {
  return iconMap.get(id) ?? ListMusic;
}
