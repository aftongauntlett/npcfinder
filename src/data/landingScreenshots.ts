import {
  UploadSimpleIcon as UploadSimple,
  MagnifyingGlassIcon as MagnifyingGlass,
  ListChecksIcon as ListChecks,
  GridFourIcon as GridFour,
  StarIcon as Star,
  PencilSimpleIcon as PencilSimple,
  type Icon,
} from "@phosphor-icons/react";
import {
  LANDING_BLUE,
  LANDING_TEAL,
  LANDING_PEACH,
  LANDING_PURPLE,
} from "./landingTheme";

export interface ScreenshotData {
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  icon: Icon;
  iconColor: string;
  title: string;
  description: string;
}

export const landingScreenshots: ScreenshotData[] = [
  {
    image: "/demo-screenshots/import-library-steam.webp",
    imageWidth: 1800,
    imageHeight: 973,
    alt: "Import Your Library screen showing Steam profile import with step-by-step instructions",
    icon: UploadSimple,
    iconColor: LANDING_BLUE,
    title: "Bring What You Already Have",
    description:
      "Import existing history from Goodreads, Letterboxd, IMDb, Spotify, or Steam instead of starting from a blank tracker.",
  },
  {
    image: "/demo-screenshots/add-to-tracker-search.webp",
    imageWidth: 1800,
    imageHeight: 972,
    alt: "Add Movies To Tracker modal with API search results for Spirited Away",
    icon: MagnifyingGlass,
    iconColor: LANDING_TEAL,
    title: "Search and Add in Seconds",
    description:
      "API-powered search pulls in the title, artwork, and description automatically, or you can add a custom entry by hand.",
  },
  {
    image: "/demo-screenshots/tracker-movies-list.webp",
    imageWidth: 1800,
    imageHeight: 973,
    alt: "Movies tracker in list view showing completed titles with ratings and descriptions",
    icon: ListChecks,
    iconColor: LANDING_PEACH,
    title: "See Everything at a Glance",
    description:
      "To-Do and Complete lists keep watched, read, and played titles organized, with quick search and toggles to update status.",
  },
  {
    image: "/demo-screenshots/tracker-movies-grid.webp",
    imageWidth: 1800,
    imageHeight: 975,
    alt: "Movies tracker in grid view showing poster artwork for completed titles",
    icon: GridFour,
    iconColor: LANDING_PURPLE,
    title: "Browse It Your Way",
    description:
      "Switch between list and grid views on the fly, so your tracker reads like a checklist or a shelf of cover art.",
  },
  {
    image: "/demo-screenshots/item-detail-rating-notes.webp",
    imageWidth: 1800,
    imageHeight: 973,
    alt: "Detail view for Warriors of the Wind with a 10 star rating and personal note field",
    icon: Star,
    iconColor: LANDING_BLUE,
    title: "Rate It, Note It, Remember It",
    description:
      "Every title gets a 10-star rating, a date watched, and a private note, so future-you remembers why it mattered.",
  },
  {
    image: "/demo-screenshots/edit-item-metadata.webp",
    imageWidth: 1800,
    imageHeight: 982,
    alt: "Edit metadata form for correcting a title's name, year, poster, and description",
    icon: PencilSimple,
    iconColor: LANDING_TEAL,
    title: "Fix Anything That's Off",
    description:
      "API data isn't always perfect. Edit the title, poster, genres, or description on any entry to keep your library accurate.",
  },
];
