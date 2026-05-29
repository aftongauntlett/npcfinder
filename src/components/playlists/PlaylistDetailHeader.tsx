import { Globe, Lock, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/shared";
import type { PlaylistWithMeta } from "@/services/playlistsService";
import { getPlaylistIcon } from "./PlaylistIconPicker";

interface PlaylistDetailHeaderProps {
  playlist: PlaylistWithMeta;
  isOwner: boolean;
  onShare: () => void;
  onAddItems: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * PlaylistDetailHeader — icon, title, description, tags, meta, and action buttons.
 */
export default function PlaylistDetailHeader({
  playlist,
  isOwner,
  onShare,
  onAddItems,
  onEdit,
  onDelete,
}: PlaylistDetailHeaderProps) {
  const Icon = getPlaylistIcon(playlist.icon);
  const visibleTags = playlist.tags.slice(0, 6);
  const extraCount = playlist.tags.length - visibleTags.length;

  return (
    <div className="flex items-start gap-4">
      {/* Icon badge */}
      <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary-light/10">
        <Icon className="w-6 h-6 text-primary dark:text-primary-light" />
      </div>

      {/* Info + actions */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {playlist.name}
        </h1>

        {/* Description */}
        {playlist.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {playlist.description}
          </p>
        )}

        {/* Tags */}
        {playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary dark:text-primary-light"
              >
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {playlist.item_count} {playlist.item_count === 1 ? "item" : "items"}
          </span>
          <span className="inline-flex items-center gap-1">
            {playlist.is_private ? (
              <>
                <Lock className="w-3 h-3" />
                Private
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" />
                Public
              </>
            )}
          </span>
          {!isOwner && playlist.owner_display_name && (
            <span>by {playlist.owner_display_name}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            icon={<Share2 className="w-4 h-4" />}
            onClick={onShare}
          >
            Share
          </Button>

          {isOwner && (
            <>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAddItems}
              >
                Add Items
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Pencil className="w-4 h-4" />}
                onClick={onEdit}
              >
                Edit Details
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={onDelete}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
