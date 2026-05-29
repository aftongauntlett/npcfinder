import { Modal } from "@/components/shared";
import PlaylistDetailHeader from "@/components/playlists/PlaylistDetailHeader";
import PlaylistItemsTable from "@/components/playlists/PlaylistItemsTable";
import type {
  PlaylistItem,
  PlaylistWithMeta,
} from "@/services/playlistsService";
import type { TrackerItem } from "@/services/trackerService";

interface PlaylistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistWithMeta | null;
  isLoadingPlaylist: boolean;
  items: PlaylistItem[];
  isLoadingItems: boolean;
  isOwner: boolean;
  canEdit: boolean;
  trackerItemByMediaId: Map<string, TrackerItem>;
  trackerRatingByMediaId: Map<string, number | null>;
  onReorder: (reordered: PlaylistItem[]) => Promise<void>;
  onRemove: (item: PlaylistItem) => void;
  onRequestShare: () => void;
  onRequestAddItems: () => void;
  onRequestEdit: () => void;
  onRequestDelete: () => void;
}

export default function PlaylistDetailModal({
  isOpen,
  onClose,
  playlist,
  isLoadingPlaylist,
  items,
  isLoadingItems,
  isOwner,
  canEdit,
  trackerItemByMediaId,
  trackerRatingByMediaId,
  onReorder,
  onRemove,
  onRequestShare,
  onRequestAddItems,
  onRequestEdit,
  onRequestDelete,
}: PlaylistDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={playlist?.name ?? "Playlist"}
      maxWidth="5xl"
    >
      <div className="max-h-[78vh] overflow-y-auto">
        {isLoadingPlaylist ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Loading playlist...
          </div>
        ) : !playlist ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Playlist not found or you do not have access.
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 px-6 py-5 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700">
              <PlaylistDetailHeader
                playlist={playlist}
                isOwner={isOwner}
                onShare={onRequestShare}
                onAddItems={onRequestAddItems}
                onEdit={onRequestEdit}
                onDelete={onRequestDelete}
              />
            </div>

            <div className="p-6 pt-4">
              {isLoadingItems ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading items...
                </div>
              ) : (
                <PlaylistItemsTable
                  items={items}
                  isOwner={isOwner}
                  canEdit={canEdit}
                  trackerItemByMediaId={trackerItemByMediaId}
                  trackerRatingByMediaId={trackerRatingByMediaId}
                  onReorder={onReorder}
                  onRemove={onRemove}
                  onAddItems={onRequestAddItems}
                />
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
