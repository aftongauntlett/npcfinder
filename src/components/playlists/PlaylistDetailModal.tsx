import { useEffect, useRef, useState } from "react";
import { Globe, Lock, Pencil, Share2 } from "lucide-react";
import { Button, Modal } from "@/components/shared";
import PlaylistDetailHeader from "@/components/playlists/PlaylistDetailHeader";
import PlaylistItemsTable from "@/components/playlists/PlaylistItemsTable";
import { useUpdatePlaylist } from "@/hooks/usePlaylistsQueries";
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
  onRequestAddItems: () => void;
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
  onRequestAddItems,
  onRequestDelete,
}: PlaylistDetailModalProps) {
  const [activePanel, setActivePanel] = useState<"none" | "share" | "edit">(
    "none",
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const updatePlaylist = useUpdatePlaylist();
  const isPanelOpen = activePanel !== "none";
  const isShareOpen = activePanel === "share";
  const isEditOpen = activePanel === "edit";
  const modalTitle = playlist?.name ?? "Playlist";

  const handleToggleVisibility = async () => {
    if (!playlist || !canEdit || updatePlaylist.isPending) return;

    await updatePlaylist.mutateAsync({
      playlistId: playlist.id,
      updates: {
        is_private: !playlist.is_private,
      },
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setActivePanel("none");
    }
  }, [isOpen]);

  useEffect(() => {
    if (activePanel === "none") return;
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activePanel]);

  const modalHeaderActions = playlist ? (
    <>
      <button
        type="button"
        onClick={() => void handleToggleVisibility()}
        disabled={!canEdit || updatePlaylist.isPending || isPanelOpen}
        aria-label={`Set playlist visibility to ${playlist.is_private ? "public" : "private"}`}
        aria-pressed={!playlist.is_private}
        className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          playlist.is_private
            ? "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60"
            : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
        }`}
      >
        {playlist.is_private ? (
          <Lock className="w-5 h-5" />
        ) : (
          <Globe className="w-5 h-5" />
        )}
      </button>
      <Button
        variant="subtle"
        size="icon"
        aria-label="Share playlist"
        icon={<Share2 className="w-5 h-5" />}
        onClick={() =>
          setActivePanel((current) => (current === "share" ? "none" : "share"))
        }
        aria-pressed={activePanel === "share"}
        className={
          isShareOpen ? "bg-gray-100/70 dark:bg-gray-700/40 shadow-sm" : ""
        }
        disabled={isEditOpen}
      />
      {isOwner && (
        <Button
          variant="subtle"
          size="icon"
          aria-label="Edit playlist"
          icon={<Pencil className="w-5 h-5" />}
          onClick={() =>
            setActivePanel((current) => (current === "edit" ? "none" : "edit"))
          }
          aria-pressed={activePanel === "edit"}
          className={
            isEditOpen ? "bg-gray-100/70 dark:bg-gray-700/40 shadow-sm" : ""
          }
          disabled={isShareOpen}
        />
      )}
    </>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      headerActions={modalHeaderActions}
      disableClose={isPanelOpen}
      maxWidth="5xl"
    >
      <div ref={scrollContainerRef} className="max-h-[78vh] overflow-y-auto">
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
            <div
              className={`px-6 py-3 ${
                activePanel !== "none"
                  ? "border-b border-gray-200 dark:border-gray-700"
                  : ""
              }`}
            >
              <PlaylistDetailHeader
                playlist={playlist}
                isOwner={isOwner}
                canEdit={canEdit}
                onDelete={onRequestDelete}
                onRequestAddItems={onRequestAddItems}
                disableAddAction={isPanelOpen}
                activePanel={activePanel}
                onClosePanel={() => setActivePanel("none")}
              />
            </div>

            <div className="relative">
              {isPanelOpen && (
                <div className="absolute inset-0 z-10 bg-gray-900/10 dark:bg-black/25 backdrop-blur-[1px] pointer-events-none" />
              )}

              <div
                className={`p-6 pt-4 space-y-3 transition-opacity ${
                  isPanelOpen
                    ? "opacity-60 pointer-events-none select-none"
                    : ""
                }`}
              >
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
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
