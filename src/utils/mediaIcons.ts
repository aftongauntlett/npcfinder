import {
  MedalIcon,
  BookIcon as Book,
  BookBookmarkIcon as BookBookmark,
  BookOpenIcon as BookOpen,
  CameraIcon as Camera,
  FilmSlateIcon as FilmSlate,
  GameControllerIcon as GameController,
  GuitarIcon as Guitar,
  HeadphonesIcon as Headphones,
  JoystickIcon as Joystick,
  BooksIcon as Books,
  MicrophoneIcon as Microphone,
  MusicNoteIcon as MusicNote,
  NotebookIcon as Notebook,
  PianoKeysIcon as PianoKeys,
  PopcornIcon as Popcorn,
  ShieldIcon as Shield,
  SwordIcon as Sword,
  TelevisionIcon as Television,
  TicketIcon as Ticket,
  TrophyIcon as Trophy,
  type Icon,
} from "@phosphor-icons/react";

import type { MediaDomain } from "../services/mediaListsService.types";
import type { IconOption } from "./taskIcons";

const MOVIES_TV_ICONS: IconOption[] = [
  { name: "FilmSlate", icon: FilmSlate, category: "Movies/TV" },
  { name: "Television", icon: Television, category: "Movies/TV" },
  { name: "Popcorn", icon: Popcorn, category: "Movies/TV" },
  { name: "Ticket", icon: Ticket, category: "Movies/TV" },
  { name: "Medal", icon: MedalIcon, category: "Movies/TV" },
  { name: "Camera", icon: Camera, category: "Movies/TV" },
];

const BOOKS_ICONS: IconOption[] = [
  { name: "Book", icon: Book, category: "Books" },
  { name: "BookOpen", icon: BookOpen, category: "Books" },
  { name: "BookBookmark", icon: BookBookmark, category: "Books" },
  { name: "Notebook", icon: Notebook, category: "Books" },
  { name: "Books", icon: Books, category: "Books" },
];

const GAMES_ICONS: IconOption[] = [
  { name: "GameController", icon: GameController, category: "Games" },
  { name: "Joystick", icon: Joystick, category: "Games" },
  { name: "Trophy", icon: Trophy, category: "Games" },
  { name: "Sword", icon: Sword, category: "Games" },
  { name: "Shield", icon: Shield, category: "Games" },
];

const MUSIC_ICONS: IconOption[] = [
  { name: "MusicNote", icon: MusicNote, category: "Music" },
  { name: "Headphones", icon: Headphones, category: "Music" },
  { name: "Microphone", icon: Microphone, category: "Music" },
  { name: "Guitar", icon: Guitar, category: "Music" },
  { name: "PianoKeys", icon: PianoKeys, category: "Music" },
];

export function getIconsForMediaType(domain: MediaDomain): IconOption[] {
  if (domain === "movies-tv") return MOVIES_TV_ICONS;
  if (domain === "books") return BOOKS_ICONS;
  if (domain === "games") return GAMES_ICONS;
  return MUSIC_ICONS;
}

export const MEDIA_DOMAIN_DEFAULT_ICON: Record<MediaDomain, Icon> = {
  "movies-tv": FilmSlate,
  books: Book,
  games: GameController,
  music: MusicNote,
};
