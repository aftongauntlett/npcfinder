import { Plus } from "lucide-react";
import { Button } from "@/components/shared";
import type { PlaylistWithMeta } from "@/services/playlistsService";
import { getPlaylistIcon } from "./PlaylistIconPicker";

interface PlaylistDetailHeaderProps {
  playlist: PlaylistWithMeta;
  isOwner: boolean;
  canEdit: boolean;
  onRequestAddItems: () => void;
}

export default function PlaylistDetailHeader({
  playlist,
  isOwner,
  canEdit,
  onRequestAddItems,
}: PlaylistDetailHeaderProps) {
  const PlaylistSummaryIcon = getPlaylistIcon(playlist.icon);

  const visibleTags = playlist.tags.slice(0, 6);
  const extraCount = playlist.tags.length - visibleTags.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-4 md:gap-5">
      <div className="w-20 h-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-primary/5 dark:bg-primary-light/10 overflow-hidden flex items-center justify-center shrink-0">
        {playlist.icon_image_url ? (
          <img
            src={playlist.icon_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <PlaylistSummaryIcon className="w-9 h-9 text-primary dark:text-primary-light" />
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed min-h-[1.25rem]">
          {playlist.description || "No description yet."}
        </p>

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

        {!isOwner && playlist.owner_display_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            by {playlist.owner_display_name}
          </p>
        )}
      </div>

      <div className="flex items-start justify-end">
        {canEdit && (
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={onRequestAddItems}
          >
            Add Items
          </Button>
        )}
      </div>
    </div>
  );
}
