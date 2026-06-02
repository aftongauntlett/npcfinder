import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListMusic, Users } from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import CreatePlaylistModal from "@/components/playlists/CreatePlaylistModal";
import AddTrackerMediaToPlaylistModal from "@/components/playlists/AddTrackerMediaToPlaylistModal";
import PlaylistDetailModal from "@/components/playlists/PlaylistDetailModal";
import EditPlaylistModal from "@/components/playlists/EditPlaylistModal";
import SharePlaylistModal from "@/components/playlists/SharePlaylistModal";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import {
  ConfirmationModal,
  EmptyState,
  MediaPageToolbar,
  type FilterSortSection,
} from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  useAddPlaylistItem,
  useDeletePlaylist,
  usePlaylist,
  usePlaylistItems,
  usePlaylists,
  useRemovePlaylistItem,
  useReorderPlaylistItems,
  useUpdatePlaylist,
} from "@/hooks/usePlaylistsQueries";
import { useTrackerItems } from "@/hooks/useTrackerQueries";
import type { PlaylistItem, PlaylistWithMeta } from "@/services/playlistsService";
import type { TrackerItem } from "@/services/trackerService";

type PlaylistTab = "mine" | "shared";
type VisibilityFilter = "all" | "private" | "public";
type SortMode = "updated" | "title" | "items";

function parseTab(value: string | null): PlaylistTab {
  return value === "shared" ? "shared" : "mine";
}

function parseVisibility(value: string | null): VisibilityFilter {
  if (value === "private" || value === "public") return value;
  return "all";
}

function parseSort(value: string | null): SortMode {
  if (value === "title" || value === "items") return value;
  return "updated";
}

function resolveLatestByMediaId(
  items: TrackerItem[],
): Map<string, TrackerItem> {
  const map = new Map<string, TrackerItem>();

  for (const item of items) {
    if (!item.media_id) continue;
    const existing = map.get(item.media_id);
    const sortKey = item.updated_at ?? item.created_at ?? "";
    const existingSortKey = existing?.updated_at ?? existing?.created_at ?? "";
    if (!existing || sortKey > existingSortKey) {
      map.set(item.media_id, item);
    }
  }

  return map;
}

export default function PlaylistsLibraryPage() {
  usePageMeta({
    title: "Playlists",
    description: "Build and share themed collections across your media.",
    noIndex: true,
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const activeTab = parseTab(searchParams.get("tab"));
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>(
    () => parseVisibility(searchParams.get("visibility")),
  );
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    parseSort(searchParams.get("sort")),
  );
  const [showCreate, setShowCreate] = useState(false);

  // Card-level action modals
  const [cardActionPlaylist, setCardActionPlaylist] =
    useState<PlaylistWithMeta | null>(null);
  const [cardActionType, setCardActionType] = useState<
    "edit" | "share" | "delete" | null
  >(null);

  // Add-items action (triggered from within detail modal)
  const [addItemsSlug, setAddItemsSlug] = useState<string | null>(null);
  const { data: addItemsPlaylist } = usePlaylist(addItemsSlug);
  const { data: addItemsItems = [] } = usePlaylistItems(
    addItemsPlaylist?.id ?? null,
  );

  const { data: allPlaylists = [], isLoading: isPlaylistsLoading } =
    usePlaylists();

  const myCount = useMemo(
    () => allPlaylists.filter((p) => p.owner_id === user?.id).length,
    [allPlaylists, user?.id],
  );
  const sharedCount = useMemo(
    () => allPlaylists.filter((p) => p.owner_id !== user?.id).length,
    [allPlaylists, user?.id],
  );

  const tabPlaylists = useMemo(
    () =>
      allPlaylists.filter((p) =>
        activeTab === "mine"
          ? p.owner_id === user?.id
          : p.owner_id !== user?.id,
      ),
    [activeTab, allPlaylists, user?.id],
  );

  const filteredPlaylists = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let list = tabPlaylists;

    if (visibilityFilter !== "all") {
      list = list.filter((playlist) =>
        visibilityFilter === "private"
          ? playlist.is_private
          : !playlist.is_private,
      );
    }

    if (normalizedSearch) {
      list = list.filter((playlist) => {
        const haystack = [
          playlist.name,
          playlist.description ?? "",
          playlist.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    const sorted = [...list];

    sorted.sort((a, b) => {
      if (sortMode === "title") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "items") {
        if (b.item_count !== a.item_count) {
          return b.item_count - a.item_count;
        }
        return (b.updated_at || "").localeCompare(a.updated_at || "");
      }

      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });

    return sorted;
  }, [search, sortMode, tabPlaylists, visibilityFilter]);

  const detailSlug = slug ?? null;
  const { data: detailPlaylist, isLoading: isDetailPlaylistLoading } =
    usePlaylist(detailSlug);
  const detailPlaylistId = detailPlaylist?.id ?? null;
  const { data: detailItems = [], isLoading: isDetailItemsLoading } =
    usePlaylistItems(detailPlaylistId);

  const { data: activeTrackerItems = [] } = useTrackerItems("active");
  const { data: historyTrackerItems = [] } = useTrackerItems("done");

  const trackerItems = useMemo(
    () => [...activeTrackerItems, ...historyTrackerItems],
    [activeTrackerItems, historyTrackerItems],
  );

  const trackerItemByMediaId = useMemo(
    () => resolveLatestByMediaId(trackerItems),
    [trackerItems],
  );

  const trackerRatingByMediaId = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const [mediaId, trackerItem] of trackerItemByMediaId.entries()) {
      map.set(mediaId, trackerItem.rating ?? null);
    }
    return map;
  }, [trackerItemByMediaId]);

  const reorderPlaylistItems = useReorderPlaylistItems();
  const removePlaylistItem = useRemovePlaylistItem();
  const addPlaylistItem = useAddPlaylistItem();
  const deletePlaylist = useDeletePlaylist();
  const updatePlaylist = useUpdatePlaylist();

  const tabs = useMemo(
    () => [
      { id: "mine", label: "My Playlists", badge: myCount },
      { id: "shared", label: "Shared With Me", badge: sharedCount },
    ],
    [myCount, sharedCount],
  );

  const filterSections = useMemo<FilterSortSection[]>(
    () => [
      {
        id: "visibility",
        title: "Visibility",
        options: [
          { id: "all", label: "All" },
          { id: "private", label: "Private" },
          { id: "public", label: "Public" },
        ],
      },
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "updated", label: "Last Updated" },
          { id: "title", label: "Title (A-Z)" },
          { id: "items", label: "Item Count" },
        ],
      },
    ],
    [],
  );

  const setTab = (tab: PlaylistTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);
    else params.delete("visibility");
    if (sortMode !== "updated") params.set("sort", sortMode);
    else params.delete("sort");
    void navigate(`/app/playlists?${params.toString()}`);
  };

  const openPlaylist = (playlistSlug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", activeTab);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);
    else params.delete("visibility");
    if (sortMode !== "updated") params.set("sort", sortMode);
    else params.delete("sort");
    void navigate(`/app/playlists/${playlistSlug}?${params.toString()}`);
  };

  const closeDetail = () => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", activeTab);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);
    else params.delete("visibility");
    if (sortMode !== "updated") params.set("sort", sortMode);
    else params.delete("sort");
    void navigate(`/app/playlists?${params.toString()}`);
  };

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    setVisibilityFilter(parseVisibility(searchParams.get("visibility")));
    setSortMode(parseSort(searchParams.get("sort")));
  }, [searchParams]);

  const updateListQuery = (
    next: Partial<{
      tab: PlaylistTab;
      q: string;
      visibility: VisibilityFilter;
      sort: SortMode;
    }>,
    replace = true,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next.tab ?? activeTab);

    const nextSearch = next.q ?? search;
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    else params.delete("q");

    const nextVisibility = next.visibility ?? visibilityFilter;
    if (nextVisibility !== "all") params.set("visibility", nextVisibility);
    else params.delete("visibility");

    const nextSort = next.sort ?? sortMode;
    if (nextSort !== "updated") params.set("sort", nextSort);
    else params.delete("sort");

    const basePath = detailSlug
      ? `/app/playlists/${detailSlug}`
      : "/app/playlists";

    void navigate(`${basePath}?${params.toString()}`, { replace });
  };

  const openAddItemsFromDetail = () => {
    if (!detailSlug) return;
    setAddItemsSlug(detailSlug);
    closeDetail();
  };

  const closeAddItemsModal = () => {
    setAddItemsSlug(null);
  };

  const closeCardAction = () => {
    setCardActionPlaylist(null);
    setCardActionType(null);
  };

  const handleDetailReorder = async (reordered: PlaylistItem[]) => {
    if (!detailPlaylistId) return;
    await reorderPlaylistItems.mutateAsync({
      playlistId: detailPlaylistId,
      orderedItemIds: reordered.map((item) => item.id),
    });
  };

  const handleDetailRemove = (item: PlaylistItem) => {
    if (!detailPlaylistId) return;
    void removePlaylistItem.mutateAsync({
      playlistId: detailPlaylistId,
      playlistItemId: item.id,
    });
  };

  const handleDeleteCardPlaylist = async () => {
    if (!cardActionPlaylist) return;
    await deletePlaylist.mutateAsync(cardActionPlaylist.id);
    closeCardAction();
  };

  const handleToggleVisibility = (playlist: PlaylistWithMeta) => {
    void updatePlaylist.mutateAsync({
      playlistId: playlist.id,
      updates: { is_private: !playlist.is_private },
    });
  };

  const existingAddItemsMediaIds = useMemo(
    () => addItemsItems.map((item) => item.media_id),
    [addItemsItems],
  );

  const isOwnerTab = activeTab === "mine";

  return (
    <AppLayout
      title="Playlists"
      description="Build, browse, and share your themed media collections."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setTab(tabId as PlaylistTab)}
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-4 pb-8">
        <MediaPageToolbar
          filterConfig={{
            type: "menu",
            sections: filterSections,
            activeFilters: {
              visibility: visibilityFilter,
              sort: sortMode,
            },
            onFilterChange: (sectionId, optionId) => {
              if (sectionId === "visibility") {
                const nextVisibility = optionId as VisibilityFilter;
                setVisibilityFilter(nextVisibility);
                updateListQuery({ visibility: nextVisibility });
              }
              if (sectionId === "sort") {
                const nextSort = optionId as SortMode;
                setSortMode(nextSort);
                updateListQuery({ sort: nextSort });
              }
            },
          }}
          searchConfig={{
            value: search,
            onChange: (nextSearch) => {
              setSearch(nextSearch);
              updateListQuery({ q: nextSearch });
            },
            placeholder: "Search playlists...",
          }}
          onAddClick={() => setShowCreate(true)}
          addLabel="New Playlist"
          hideAddButton={!isOwnerTab}
        />

        {isPlaylistsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading playlists...
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <EmptyState
            icon={isOwnerTab ? ListMusic : Users}
            title={
              search || visibilityFilter !== "all"
                ? "No playlists match your filters"
                : isOwnerTab
                  ? "No playlists yet"
                  : "Nothing shared with you yet"
            }
            description={
              search || visibilityFilter !== "all"
                ? "Try adjusting search text or filters."
                : isOwnerTab
                  ? "Create your first playlist to start curating collections."
                  : "Shared playlists from your connections will appear here."
            }
            action={
              isOwnerTab && !search && visibilityFilter === "all"
                ? { label: "New Playlist", onClick: () => setShowCreate(true) }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPlaylists.map((playlist) => {
              const isOwner = playlist.owner_id === user?.id;
              return (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  isOwner={isOwner}
                  onClick={() => openPlaylist(playlist.slug)}
                  onEdit={
                    isOwner
                      ? () => {
                          setCardActionPlaylist(playlist);
                          setCardActionType("edit");
                        }
                      : undefined
                  }
                  onDelete={
                    isOwner
                      ? () => {
                          setCardActionPlaylist(playlist);
                          setCardActionType("delete");
                        }
                      : undefined
                  }
                  onShare={
                    isOwner
                      ? () => {
                          setCardActionPlaylist(playlist);
                          setCardActionType("share");
                        }
                      : undefined
                  }
                  onToggleVisibility={
                    isOwner
                      ? () => handleToggleVisibility(playlist)
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <PlaylistDetailModal
        isOpen={Boolean(detailSlug)}
        onClose={closeDetail}
        playlist={detailPlaylist ?? null}
        isLoadingPlaylist={isDetailPlaylistLoading}
        items={detailItems}
        isLoadingItems={isDetailItemsLoading}
        isOwner={detailPlaylist?.owner_id === user?.id}
        canEdit={detailPlaylist?.owner_id === user?.id}
        trackerItemByMediaId={trackerItemByMediaId}
        trackerRatingByMediaId={trackerRatingByMediaId}
        onReorder={handleDetailReorder}
        onRemove={handleDetailRemove}
        onRequestAddItems={openAddItemsFromDetail}
      />

      <CreatePlaylistModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(playlistSlug) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", activeTab);
          if (search.trim()) params.set("q", search.trim());
          else params.delete("q");
          if (visibilityFilter !== "all")
            params.set("visibility", visibilityFilter);
          else params.delete("visibility");
          if (sortMode !== "updated") params.set("sort", sortMode);
          else params.delete("sort");
          void navigate(`/app/playlists/${playlistSlug}?${params.toString()}`);
        }}
      />

      <AddTrackerMediaToPlaylistModal
        isOpen={Boolean(addItemsSlug) && Boolean(addItemsPlaylist?.id)}
        onClose={closeAddItemsModal}
        title="Add From Tracker"
        trackerItems={trackerItems}
        existingMediaIds={existingAddItemsMediaIds}
        onAdd={async (mediaId) => {
          if (!addItemsPlaylist?.id) return;
          await addPlaylistItem.mutateAsync({
            playlistId: addItemsPlaylist.id,
            mediaId,
          });
        }}
      />

      {cardActionPlaylist && cardActionType === "edit" && (
        <EditPlaylistModal
          isOpen
          playlist={cardActionPlaylist}
          onClose={closeCardAction}
        />
      )}

      {cardActionPlaylist && cardActionType === "share" && (
        <SharePlaylistModal
          isOpen
          onClose={closeCardAction}
          playlistId={cardActionPlaylist.id}
          playlistName={cardActionPlaylist.name}
          playlistSlug={cardActionPlaylist.slug}
        />
      )}

      <ConfirmationModal
        isOpen={cardActionType === "delete" && Boolean(cardActionPlaylist)}
        onClose={closeCardAction}
        onConfirm={() => void handleDeleteCardPlaylist()}
        title="Delete playlist?"
        message={`This permanently removes "${cardActionPlaylist?.name ?? "this playlist"}" and all of its items.`}
        confirmText={deletePlaylist.isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        isLoading={deletePlaylist.isPending}
      />
    </AppLayout>
  );
}
