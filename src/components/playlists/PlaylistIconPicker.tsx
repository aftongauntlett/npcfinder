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

/** Resolve a stored icon id to a LucideIcon component, falling back to ListMusic. */
export function getPlaylistIcon(id: string): LucideIcon {
  return iconMap.get(id) ?? ListMusic;
}

interface PlaylistIconPickerProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function PlaylistIconPicker({
  value,
  onChange,
  disabled,
}: PlaylistIconPickerProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {PLAYLIST_ICONS.map(({ id, label, Icon }) => {
        const isSelected = value === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={[
              "flex items-center justify-center rounded-lg p-2 transition-colors",
              isSelected
                ? "bg-primary/15 dark:bg-primary-light/15 text-primary dark:text-primary-light ring-1 ring-primary/40 dark:ring-primary-light/40"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
