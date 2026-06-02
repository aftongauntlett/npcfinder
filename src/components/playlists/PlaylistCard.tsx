import { Globe, Lock, Pencil, Share2, Trash2, Users } from "lucide-react";
import type { PlaylistWithMeta } from "@/services/playlistsService";
import { getPlaylistIcon } from "./PlaylistIconPicker";

interface PlaylistCardProps {
  playlist: PlaylistWithMeta;
  isOwner: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onToggleVisibility?: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export default function PlaylistCard({
  playlist,
  isOwner,
  onClick,
  onEdit,
  onDelete,
  onShare,
  onToggleVisibility,
}: PlaylistCardProps) {
  const visibleTags = playlist.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraCount = playlist.tags.length - visibleTags.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="group w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2 hover:border-primary/50 dark:hover:border-primary-light/50 transition-colors cursor-pointer"
    >
      {/* Title row: icon + name + shared badge */}
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary-light/10">
          {playlist.icon_image_url ? (
            <img
              src={playlist.icon_image_url}
              alt=""
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            (() => {
              const Icon = getPlaylistIcon(playlist.icon);
              return (
                <Icon className="w-4 h-4 text-primary dark:text-primary-light" />
              );
            })()
          )}
        </div>
        <p className="flex-1 min-w-0 font-semibold text-gray-900 dark:text-white line-clamp-1">
          {playlist.name}
        </p>
        {!isOwner && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100">
            <Users className="w-3 h-3" />
            Shared
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2rem]">
        {playlist.description ||
          (isOwner
            ? "No description yet."
            : `From ${playlist.owner_display_name ?? "someone"}`)}
      </p>

      {/* Tags */}
      {playlist.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Meta row + action buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="rounded-full bg-gray-100 dark:bg-gray-700/70 px-2 py-0.5">
            {playlist.item_count} {playlist.item_count === 1 ? "item" : "items"}
          </span>

          {isOwner && onToggleVisibility ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
                playlist.is_private
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-green-600 dark:text-green-400"
              }`}
              aria-label={`Set to ${playlist.is_private ? "public" : "private"}`}
            >
              {playlist.is_private ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Globe className="w-3 h-3" />
              )}
              {playlist.is_private ? "Private" : "Public"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1">
              {playlist.is_private ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Globe className="w-3 h-3" />
              )}
              {playlist.is_private ? "Private" : "Public"}
            </span>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:text-primary-light dark:hover:bg-primary-light/10 transition-colors"
                aria-label="Share playlist"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Edit playlist"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Delete playlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
