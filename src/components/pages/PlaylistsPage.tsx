import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Share2, Trash2 } from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import AddTrackerMediaToPlaylistModal from "@/components/playlists/AddTrackerMediaToPlaylistModal";
import SharePlaylistModal from "@/components/playlists/SharePlaylistModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  useAddPlaylistItem,
  useCreatePlaylist,
  useDeletePlaylist,
  usePlaylist,
  usePlaylistItems,
  usePlaylists,
  useReorderPlaylistItems,
  useRemovePlaylistItem,
  useUpdatePlaylistItem,
} from "@/hooks/usePlaylistsQueries";
import { useTrackerItems } from "@/hooks/useTrackerQueries";
import type { PlaylistItem } from "@/services/playlistsService";
import {
  Button,
  ConfirmationModal,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from "@/components/shared";

const pageMetaOptions = {
  title: "Playlists",
  description: "Curated thematic collections across all media",
  noIndex: true,
};

function SortablePlaylistItemRow(props: {
  item: PlaylistItem;
  canEdit: boolean;
  onUpdateNote: (note: string | null) => void;
  onRemove: () => void;
}) {
  const { item, canEdit, onUpdateNote, onRemove } = props;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      disabled: !canEdit,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className={`mt-1 ${canEdit ? "cursor-grab text-gray-400" : "text-gray-300"}`}
          {...attributes}
          {...listeners}
          disabled={!canEdit}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {item.media?.poster_url ? (
          <img
            src={item.media.poster_url}
            alt=""
            className="w-12 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-16 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900" />
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="font-semibold text-gray-900 dark:text-white truncate">
              {item.media?.title || "Untitled"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.media?.media_type || "unknown"}
              {item.media?.subtitle ? ` • ${item.media.subtitle}` : ""}
            </div>
          </div>

          <textarea
            rows={2}
            defaultValue={item.note || ""}
            onBlur={(event) => onUpdateNote(event.target.value.trim() || null)}
            disabled={!canEdit}
            placeholder={canEdit ? "Optional curation note" : "Owner note"}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
        </div>

        {canEdit && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={onRemove}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  usePageMeta(pageMetaOptions);

  const { user } = useAuth();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  const [search, setSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  const { data: playlists = [], isLoading: playlistsLoading } = usePlaylists();
  const { data: selectedPlaylist } = usePlaylist(selectedPlaylistId);
  const { data: playlistItems = [], isLoading: itemsLoading } =
    usePlaylistItems(selectedPlaylistId);
  const { data: activeTrackerItems = [] } = useTrackerItems("active");
  const { data: historyTrackerItems = [] } = useTrackerItems("done");

  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const addPlaylistItem = useAddPlaylistItem();
  const updatePlaylistItem = useUpdatePlaylistItem();
  const removePlaylistItem = useRemovePlaylistItem();
  const reorderPlaylistItems = useReorderPlaylistItems();

  const [localItems, setLocalItems] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    setLocalItems(playlistItems);
  }, [playlistItems]);

  useEffect(() => {
    if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [selectedPlaylistId, playlists]);

  const canEdit =
    !!user?.id && !!selectedPlaylist && selectedPlaylist.owner_id === user.id;

  const filteredPlaylists = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return playlists;

    return playlists.filter((playlist) => {
      const haystack =
        `${playlist.name} ${playlist.description || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [playlists, search]);

  const existingMediaIds = useMemo(
    () => localItems.map((item) => item.media_id),
    [localItems],
  );

  const trackerMediaItems = useMemo(
    () => [...activeTrackerItems, ...historyTrackerItems],
    [activeTrackerItems, historyTrackerItems],
  );

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;

    const created = await createPlaylist.mutateAsync({
      name,
      description: newPlaylistDescription.trim() || null,
      is_private: true,
    });

    if (created?.id) {
      setSelectedPlaylistId(created.id);
    }

    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylistId) return;

    await deletePlaylist.mutateAsync(selectedPlaylistId);

    setShowDeleteConfirm(false);
    setSelectedPlaylistId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(localItems, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        position: index,
      }),
    );

    setLocalItems(reordered);

    if (!selectedPlaylistId) return;

    await reorderPlaylistItems.mutateAsync({
      playlistId: selectedPlaylistId,
      orderedItemIds: reordered.map((item) => item.id),
    });
  };

  return (
    <AppLayout
      title="Playlists"
      description="Build thematic mixed-media collections and share view-only access with invited users."
    >
      <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              id="playlist-search"
              label="Search playlists"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name"
            />
          </div>

          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
            className="w-full"
          >
            New Playlist
          </Button>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {playlistsLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading playlists...
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No playlists found.
              </div>
            ) : (
              filteredPlaylists.map((playlist) => {
                const isActive = playlist.id === selectedPlaylistId;
                const isOwner = playlist.owner_id === user?.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {playlist.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {playlist.item_count} items • {playlist.share_count}{" "}
                      shared
                      {isOwner ? " • owner" : " • shared with you"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="space-y-4">
          {!selectedPlaylistId || !selectedPlaylist ? (
            <EmptyState
              icon={Plus}
              title="Select a playlist"
              description="Pick a playlist to view items and curation notes."
            />
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedPlaylist.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedPlaylist.description || "No description."}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="secondary"
                      icon={<Share2 className="w-4 h-4" />}
                      onClick={() => setShowShareModal(true)}
                    >
                      Share
                    </Button>
                    <Button
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowAddModal(true)}
                    >
                      Add From Tracker
                    </Button>
                    <Button
                      variant="danger"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {itemsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading items...
                </div>
              ) : localItems.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="No items yet"
                  description={
                    canEdit
                      ? "Add items from your tracker to build this playlist."
                      : "The owner has not added items yet."
                  }
                />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => void handleDragEnd(event)}
                >
                  <SortableContext
                    items={localItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localItems.map((item) => (
                        <SortablePlaylistItemRow
                          key={item.id}
                          item={item}
                          canEdit={canEdit}
                          onUpdateNote={(note) =>
                            void updatePlaylistItem.mutateAsync({
                              playlistId: selectedPlaylist.id,
                              playlistItemId: item.id,
                              updates: { note },
                            })
                          }
                          onRemove={() =>
                            void removePlaylistItem.mutateAsync({
                              playlistId: selectedPlaylist.id,
                              playlistItemId: item.id,
                            })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </section>
      </div>

      {selectedPlaylist && (
        <SharePlaylistModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          playlistId={selectedPlaylist.id}
          playlistName={selectedPlaylist.name}
        />
      )}

      <AddTrackerMediaToPlaylistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add From Tracker"
        trackerItems={trackerMediaItems}
        existingMediaIds={existingMediaIds}
        onAdd={async (mediaId) => {
          if (!selectedPlaylist) return;
          await addPlaylistItem.mutateAsync({
            playlistId: selectedPlaylist.id,
            mediaId,
          });
        }}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Playlist"
        maxWidth="xl"
      >
        <div className="p-6 space-y-4">
          <Input
            id="new-playlist-name"
            label="Name"
            value={newPlaylistName}
            onChange={(event) => setNewPlaylistName(event.target.value)}
            placeholder="e.g. Things That Feel Like Rain"
            required
          />

          <Textarea
            id="new-playlist-description"
            label="Description"
            value={newPlaylistDescription}
            onChange={(event) => setNewPlaylistDescription(event.target.value)}
            rows={3}
            placeholder="Optional description"
          />

          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreatePlaylist()}
              disabled={!newPlaylistName.trim() || createPlaylist.isPending}
            >
              {createPlaylist.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => void handleDeletePlaylist()}
        title="Delete playlist?"
        message="This permanently removes the playlist and all of its items."
        confirmText={deletePlaylist.isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        isLoading={deletePlaylist.isPending}
      />
    </AppLayout>
  );
}
