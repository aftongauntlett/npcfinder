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
import {
  AlertTriangle,
  GripVertical,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
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
import type { TrackerItem } from "@/services/trackerService";
import {
  Button,
  ConfirmationModal,
  EmptyState,
  Input,
  MediaPoster,
  Modal,
  StarRating,
  Textarea,
  ViewModeToggle,
} from "@/components/shared";

const pageMetaOptions = {
  title: "Playlists",
  description: "Curated thematic collections across all media",
  noIndex: true,
};

function SortablePlaylistItemRow(props: {
  item: PlaylistItem;
  canEdit: boolean;
  ownerRating: number | null;
  onOpen: () => void;
  onUpdateNote: (note: string | null) => void;
  onRemove: () => void;
}) {
  const { item, canEdit, ownerRating, onOpen, onUpdateNote, onRemove } = props;
  const isUserCreated = item.media?.is_user_created === true;
  const isOwnerEdited = item.owner_media_is_edited;
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
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 cursor-pointer hover:border-primary/50 dark:hover:border-primary-light/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className={`mt-1 ${canEdit ? "cursor-grab text-gray-400" : "text-gray-300"}`}
          onClick={(event) => event.stopPropagation()}
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

          {isUserCreated && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/50 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-100">
              <AlertTriangle className="w-3.5 h-3.5" />
              User-created entry
            </div>
          )}

          {isOwnerEdited && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-300/50 dark:border-sky-500/40 bg-sky-50/80 dark:bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-800 dark:text-sky-100">
              <Pencil className="w-3.5 h-3.5" />
              Owner edited metadata
            </div>
          )}

          <textarea
            rows={2}
            defaultValue={item.note || ""}
            onBlur={(event) => onUpdateNote(event.target.value.trim() || null)}
            onClick={(event) => event.stopPropagation()}
            disabled={!canEdit}
            placeholder={canEdit ? "Optional curation note" : "Curation note"}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />

          {isUserCreated && (
            <p className="text-xs text-amber-700 dark:text-amber-200">
              This item was added manually by a user and is not API-verified.
              Metadata may be incomplete or inaccurate.
            </p>
          )}

          {canEdit && (
            <div className="pt-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Your Tracker Rating
              </p>
              <StarRating
                rating={ownerRating}
                onRatingChange={() => {
                  // Rating edits happen in Tracker item details.
                }}
                maxRating={10}
                size="xs"
                readonly
                showClearButton={false}
                className="!gap-1"
              />
            </div>
          )}
        </div>

        {canEdit && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function formatTrackerDate(value: string | null | undefined): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatEditedFieldLabel(fieldKey: string): string {
  return fieldKey
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ratingTextClassName(rating: number): string {
  if (rating <= 3) {
    return "text-rose-700 dark:text-rose-300";
  }

  if (rating <= 7) {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function PlaylistItemDetailsModal(props: {
  item: PlaylistItem | null;
  isOwner: boolean;
  viewerTrackerItem: TrackerItem | null;
  onClose: () => void;
}) {
  const { item, isOwner, viewerTrackerItem, onClose } = props;

  if (!item) {
    return null;
  }

  const ownerTrackerNote = item.owner_tracker_note?.trim() || "";
  const ownerTrackerCompletedAt = formatTrackerDate(
    item.owner_tracker_completed_at,
  );
  const ownerTrackerRating = item.owner_tracker_rating ?? null;
  const viewerTrackerNote = viewerTrackerItem?.note?.trim() || "";
  const viewerTrackerCompletedAt = formatTrackerDate(
    viewerTrackerItem?.completed_at,
  );
  const viewerTrackerRating = viewerTrackerItem?.rating ?? null;
  const ownerEditedFieldLabels = (item.owner_media_edited_fields || []).map(
    formatEditedFieldLabel,
  );
  const hasOwnerEditedMetadata =
    item.owner_media_is_edited || ownerEditedFieldLabels.length > 0;
  const hasOwnerTrackerContext =
    ownerTrackerNote.length > 0 ||
    ownerTrackerCompletedAt.length > 0 ||
    typeof ownerTrackerRating === "number";
  const hasViewerTrackerContext =
    viewerTrackerNote.length > 0 ||
    viewerTrackerCompletedAt.length > 0 ||
    typeof viewerTrackerRating === "number";
  const showCompareView =
    !isOwner && hasOwnerTrackerContext && hasViewerTrackerContext;
  const curationNote = item.note?.trim() || "";

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title={item.media?.title || "Playlist Item"}
      maxWidth="4xl"
    >
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0">
            <MediaPoster
              src={item.media?.poster_url}
              alt={item.media?.title || "Untitled"}
              size="md"
              aspectRatio="2/3"
              showOverlay={false}
              className="w-36"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {item.media?.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.media.subtitle}
              </p>
            )}

            {item.media?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.media.description}
              </p>
            )}
          </div>
        </div>

        {curationNote && (
          <section className="space-y-1 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
            <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
              Playlist Note
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {curationNote}
            </p>
          </section>
        )}

        {hasOwnerTrackerContext && (
          <section className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
            <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
              {isOwner ? "Your Tracker Context" : "Owner Tracker Context"}
            </h4>

            {ownerTrackerCompletedAt && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Completed: {ownerTrackerCompletedAt}
              </p>
            )}

            {typeof ownerTrackerRating === "number" && (
              <p
                className={`text-sm ${ratingTextClassName(ownerTrackerRating)}`}
              >
                Rating: {ownerTrackerRating}/10
              </p>
            )}

            {ownerTrackerNote && (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ownerTrackerNote}
              </p>
            )}
          </section>
        )}

        {hasOwnerEditedMetadata && (
          <section className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
            <h4 className="text-sm font-semibold text-primary dark:text-primary-light inline-flex items-center gap-1.5">
              <Pencil className="w-4 h-4" />
              {isOwner ? "Metadata Edited By You" : "Metadata Edited By Owner"}
            </h4>

            {ownerEditedFieldLabels.length > 0 && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Changed fields: {ownerEditedFieldLabels.join(", ")}
              </p>
            )}
          </section>
        )}

        {showCompareView && (
          <section className="space-y-3 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
            <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
              Compare Tracker Context
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Owner
                </p>
                {ownerTrackerCompletedAt && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Completed: {ownerTrackerCompletedAt}
                  </p>
                )}
                {typeof ownerTrackerRating === "number" && (
                  <p
                    className={`text-sm ${ratingTextClassName(ownerTrackerRating)}`}
                  >
                    Rating: {ownerTrackerRating}/10
                  </p>
                )}
                {ownerTrackerNote && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {ownerTrackerNote}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  You
                </p>
                {viewerTrackerCompletedAt && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Completed: {viewerTrackerCompletedAt}
                  </p>
                )}
                {typeof viewerTrackerRating === "number" && (
                  <p
                    className={`text-sm ${ratingTextClassName(viewerTrackerRating)}`}
                  >
                    Rating: {viewerTrackerRating}/10
                  </p>
                )}
                {viewerTrackerNote && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {viewerTrackerNote}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </Modal>
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
  const [itemsViewMode, setItemsViewMode] = useState<"list" | "grid">("list");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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

  useEffect(() => {
    setSelectedItemId(null);
  }, [selectedPlaylistId]);

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

  const trackerRatingByMediaId = useMemo(() => {
    const latestByMediaId = new Map<
      string,
      {
        rating: number | null;
        sortKey: string;
      }
    >();

    for (const trackerItem of trackerMediaItems) {
      const mediaId = trackerItem.media_id;
      if (!mediaId) {
        continue;
      }

      const sortKey = trackerItem.updated_at || trackerItem.created_at || "";
      const existing = latestByMediaId.get(mediaId);

      if (!existing || sortKey > existing.sortKey) {
        latestByMediaId.set(mediaId, {
          rating: trackerItem.rating ?? null,
          sortKey,
        });
      }
    }

    return new Map(
      Array.from(latestByMediaId.entries()).map(([mediaId, entry]) => [
        mediaId,
        entry.rating,
      ]),
    );
  }, [trackerMediaItems]);

  const latestTrackerItemByMediaId = useMemo(() => {
    const latestByMediaId = new Map<
      string,
      {
        item: TrackerItem;
        sortKey: string;
      }
    >();

    for (const trackerItem of trackerMediaItems) {
      const mediaId = trackerItem.media_id;
      if (!mediaId) {
        continue;
      }

      const sortKey = trackerItem.updated_at || trackerItem.created_at || "";
      const existing = latestByMediaId.get(mediaId);

      if (!existing || sortKey > existing.sortKey) {
        latestByMediaId.set(mediaId, {
          item: trackerItem,
          sortKey,
        });
      }
    }

    return new Map(
      Array.from(latestByMediaId.entries()).map(([mediaId, entry]) => [
        mediaId,
        entry.item,
      ]),
    );
  }, [trackerMediaItems]);

  const selectedPlaylistItem = useMemo(
    () => localItems.find((item) => item.id === selectedItemId) || null,
    [localItems, selectedItemId],
  );

  const selectedViewerTrackerItem = useMemo(
    () =>
      selectedPlaylistItem
        ? (latestTrackerItemByMediaId.get(selectedPlaylistItem.media_id) ??
          null)
        : null,
    [latestTrackerItemByMediaId, selectedPlaylistItem],
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

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {localItems.length} item{localItems.length === 1 ? "" : "s"}
                </p>
                <ViewModeToggle
                  value={itemsViewMode}
                  onChange={setItemsViewMode}
                  optionsLabel="Playlist items view mode"
                />
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
                <>
                  {itemsViewMode === "list" ? (
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
                              ownerRating={
                                canEdit
                                  ? (trackerRatingByMediaId.get(
                                      item.media_id,
                                    ) ?? null)
                                  : null
                              }
                              onOpen={() => setSelectedItemId(item.id)}
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
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {localItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className="text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-primary/50 dark:hover:border-primary-light/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <MediaPoster
                              src={item.media?.poster_url}
                              alt={item.media?.title || "Untitled"}
                              size="sm"
                              aspectRatio="2/3"
                              showOverlay={false}
                              className="w-16"
                            />

                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {item.media?.title || "Untitled"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.media?.media_type || "unknown"}
                                {item.media?.subtitle
                                  ? ` • ${item.media.subtitle}`
                                  : ""}
                              </p>

                              {item.owner_media_is_edited && (
                                <p className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100">
                                  <Pencil className="w-3 h-3" />
                                  Owner edited metadata
                                </p>
                              )}

                              {item.note && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
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

      <PlaylistItemDetailsModal
        item={selectedPlaylistItem}
        isOwner={canEdit}
        viewerTrackerItem={selectedViewerTrackerItem}
        onClose={() => setSelectedItemId(null)}
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
