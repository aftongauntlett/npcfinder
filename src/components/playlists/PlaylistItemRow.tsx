import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Disc3,
  Film,
  Gamepad2,
  ListMusic,
  Music2,
  Star,
  Trash2,
  Tv,
} from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/components/shared";
import type { PlaylistItem } from "@/services/playlistsService";

interface PlaylistItemRowProps {
  item: PlaylistItem;
  index: number;
  canEdit: boolean;
  ownerRating: number | null;
  onRemove: () => void;
}

function getTypeChip(mediaType?: string | null) {
  const normalized = (mediaType || "").toLowerCase();

  if (normalized === "movie") {
    return {
      label: "Movie",
      Icon: Film,
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };
  }

  if (normalized === "tv") {
    return {
      label: "TV",
      Icon: Tv,
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    };
  }

  if (normalized === "game") {
    return {
      label: "Game",
      Icon: Gamepad2,
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  }

  if (normalized === "book") {
    return {
      label: "Book",
      Icon: BookOpen,
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    };
  }

  if (normalized === "album") {
    return {
      label: "Album",
      Icon: Disc3,
      className:
        "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    };
  }

  if (normalized === "song") {
    return {
      label: "Song",
      Icon: Music2,
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    };
  }

  if (normalized === "playlist") {
    return {
      label: "Playlist",
      Icon: ListMusic,
      className:
        "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    };
  }

  return {
    label: "Media",
    Icon: ListMusic,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
}

function getRatingColorClass(rating: number | null): string {
  if (rating === null) {
    return "text-gray-500 dark:text-gray-400";
  }

  if (rating <= 3) {
    return "text-red-600 dark:text-red-400";
  }

  if (rating <= 6) {
    return "text-orange-500 dark:text-orange-400";
  }

  return "text-green-600 dark:text-green-400";
}

export default function PlaylistItemRow({
  item,
  index,
  canEdit,
  ownerRating,
  onRemove,
}: PlaylistItemRowProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      disabled: !canEdit,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const media = item.media;
  const comment = item.note?.trim() ?? "";
  const description = media?.description?.trim() ?? "";
  const {
    Icon: TypeIcon,
    className: typeClassName,
    label: typeLabel,
  } = getTypeChip(media?.media_type);
  const numericRating = typeof ownerRating === "number" ? ownerRating : null;
  const ratingColorClass = getRatingColorClass(numericRating);

  useEffect(() => {
    if (!description) {
      setIsDescriptionTruncated(false);
      return;
    }

    const descriptionElement = descriptionRef.current;
    if (!descriptionElement) {
      return;
    }

    const measureTruncation = () => {
      if (isDescriptionExpanded) {
        return;
      }

      const isOverflowing =
        descriptionElement.scrollHeight > descriptionElement.clientHeight + 1;
      setIsDescriptionTruncated(isOverflowing);
    };

    // Wait for clamp styles/layout to settle before checking overflow.
    const frame = window.requestAnimationFrame(measureTruncation);
    const resizeObserver = new ResizeObserver(measureTruncation);
    resizeObserver.observe(descriptionElement);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [description, isDescriptionExpanded]);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-colors hover:border-primary/40 dark:hover:border-primary-light/40"
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="pt-1">
            {canEdit ? (
              <button
                type="button"
                aria-label="Drag to reorder"
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-500 dark:text-gray-300 tabular-nums cursor-grab hover:text-gray-700 dark:hover:text-gray-100"
                {...attributes}
                {...listeners}
              >
                {index + 1}
              </button>
            ) : (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-500 dark:text-gray-300 tabular-nums">
                {index + 1}
              </span>
            )}
          </div>

          <div className="w-12 h-16 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
            {media?.poster_url ? (
              <img
                src={media.poster_url}
                alt={`${media?.title ?? "Media"} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <TypeIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {media?.title ?? "Untitled"}
                  </p>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${typeClassName}`}
                  >
                    <TypeIcon className="w-3 h-3" />
                    {typeLabel}
                  </span>

                  {numericRating !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${ratingColorClass}`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {numericRating}/10
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <Button
                  variant="subtle"
                  size="icon"
                  aria-label="Remove from playlist"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={onRemove}
                />
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {description ? (
                <div className="space-y-0.5">
                  <p
                    ref={descriptionRef}
                    className={`leading-relaxed ${
                      isDescriptionExpanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {description}
                  </p>
                  {isDescriptionTruncated && (
                    <button
                      type="button"
                      className="text-xs text-primary dark:text-primary-light hover:underline"
                      onClick={() =>
                        setIsDescriptionExpanded((current) => !current)
                      }
                    >
                      {isDescriptionExpanded ? "See less" : "See more"}
                    </button>
                  )}
                </div>
              ) : (
                "No description"
              )}
            </div>

            {comment && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Comment:
                </span>{" "}
                {comment}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
