import React, { useMemo, useState } from "react";
import { List, Plus, Users } from "lucide-react";
import { logger } from "@/lib/logger";
import {
  Button,
  EmptyState,
  EmptyStateAddCard,
  MediaPageToolbar,
  SearchBookModal,
  SearchGameModal,
  SearchMovieModal,
  SearchMusicModal,
} from "@/components/shared";
import type { MediaItem } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAddMediaListItem,
  useMediaList,
  useMediaListItems,
  useMyMediaListRole,
  useRemoveMediaListItem,
} from "@/hooks/useMediaListsQueries";
import type { MediaDomain } from "@/services/mediaListsService.types";
import MediaListItem from "./MediaListItem";
import ShareMediaListModal from "./ShareMediaListModal";

type SortBy = "custom" | "title" | "year_desc" | "added_desc";

interface MediaListDetailProps {
  domain: MediaDomain;
  listId: string;
}

function canRenderSearchModal(domain: MediaDomain) {
  return domain === "movies-tv" || domain === "books" || domain === "games" || domain === "music";
}

function getSortedItems<T extends { title: string; year: number | null; created_at: string }>(
  items: T[],
  sortBy: SortBy
): T[] {
  if (sortBy === "custom") return items;

  const copy = [...items];

  if (sortBy === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }

  if (sortBy === "year_desc") {
    copy.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
    return copy;
  }

  if (sortBy === "added_desc") {
    copy.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    return copy;
  }

  return items;
}

const MediaListDetail: React.FC<MediaListDetailProps> = ({ domain, listId }) => {
  const { user } = useAuth();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("custom");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: selectedList } = useMediaList(listId);
  const { data: items = [], isLoading: itemsLoading } = useMediaListItems(listId);
  const { data: myRole } = useMyMediaListRole(listId);

  const addItem = useAddMediaListItem(domain);
  const removeItem = useRemoveMediaListItem(domain);

  const isOwner = !!user?.id && !!selectedList?.owner_id && user.id === selectedList.owner_id;
  const canEditItems = isOwner || myRole === "editor";

  const existingExternalIds = useMemo(() => items.map((i) => i.external_id), [items]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const haystack = [
        i.title,
        i.subtitle,
        i.genres,
        i.authors,
        i.artist,
        i.album,
        i.platforms,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, searchQuery]);

  const sortedItems = useMemo(() => getSortedItems(visibleItems, sortBy), [visibleItems, sortBy]);

  const handleAddItem = async (item: MediaItem) => {
    try {
      await addItem.mutateAsync({ listId, item });
    } catch (error) {
      logger.error("Failed to add list item", { error, domain, listId });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync({ listId, itemId });
    } catch (error) {
      logger.error("Failed to remove list item", { error, domain, listId, itemId });
    }
  };

  if (!canRenderSearchModal(domain)) {
    return null;
  }

  const showAddButton = canEditItems && !itemsLoading && items.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="space-y-4 sm:space-y-6">
        {items.length > 0 && (
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: [
                {
                  id: "sort",
                  title: "Sort By",
                  options: [
                    { id: "custom", label: "Custom" },
                    { id: "title", label: "Title (A–Z)" },
                    { id: "year_desc", label: "Year (Newest)" },
                    { id: "added_desc", label: "Added (Newest)" },
                  ],
                },
              ],
              activeFilters: { sort: sortBy },
              onFilterChange: (sectionId, value) => {
                if (sectionId === "sort") setSortBy(value as SortBy);
              },
            }}
            searchConfig={{
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Search this list...",
            }}
            onAddClick={() => setShowAddItemModal(true)}
            addLabel="Add"
            addIcon={<Plus size={18} />}
            hideAddButton={!showAddButton}
            rightActions={
              isOwner && selectedList ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowInviteModal(true)}
                  icon={<Users className="w-4 h-4" />}
                  hideTextOnMobile
                  aria-label="Invite"
                >
                  Invite
                </Button>
              ) : null
            }
          />
        )}

        {itemsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading items...</div>
        ) : sortedItems.length === 0 ? (
          canEditItems ? (
            <EmptyStateAddCard
              icon={Plus}
              title="No items yet"
              description="Add items to start building this list."
              onClick={() => setShowAddItemModal(true)}
              ariaLabel="Add item to list"
            />
          ) : (
            <EmptyState
              icon={List}
              title="No items yet"
              description="No items have been added to this list yet."
            />
          )
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <MediaListItem
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle || undefined}
                posterUrl={item.poster_url || undefined}
                year={item.year || undefined}
                description={item.description || undefined}
                genres={item.genres || undefined}
                mediaType={item.media_type}
                externalId={item.external_id}
                releaseDate={item.release_date || undefined}
                authors={item.authors || undefined}
                artist={item.artist || undefined}
                album={item.album || undefined}
                trackDuration={item.track_duration || undefined}
                trackCount={item.track_count || undefined}
                previewUrl={item.preview_url || undefined}
                platforms={item.platforms || undefined}
                metacritic={item.metacritic || undefined}
                playtime={item.playtime || undefined}
                isbn={item.isbn || undefined}
                pageCount={item.page_count || undefined}
                publisher={item.publisher || undefined}
                onRemove={canEditItems ? () => void handleRemoveItem(item.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {isOwner && selectedList && (
        <ShareMediaListModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          listId={listId}
          listName={selectedList.title}
          domain={domain}
        />
      )}

      {/* Add Item Modals */}
      {domain === "movies-tv" && (
        <SearchMovieModal
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onAdd={(item) => {
            void handleAddItem(item);
            setShowAddItemModal(false);
          }}
          existingIds={existingExternalIds}
        />
      )}

      {showAddItemModal && domain === "books" && (
        <SearchBookModal
          onClose={() => setShowAddItemModal(false)}
          onSelect={(item) => {
            void handleAddItem(item);
            setShowAddItemModal(false);
          }}
          existingIds={existingExternalIds}
        />
      )}

      {showAddItemModal && domain === "games" && (
        <SearchGameModal
          onClose={() => setShowAddItemModal(false)}
          onSelect={(item) => {
            void handleAddItem(item);
            setShowAddItemModal(false);
          }}
          existingIds={existingExternalIds}
        />
      )}

      {showAddItemModal && domain === "music" && (
        <SearchMusicModal
          onClose={() => setShowAddItemModal(false)}
          onSelect={(item) => {
            void handleAddItem(item);
            setShowAddItemModal(false);
          }}
          existingIds={existingExternalIds}
        />
      )}
    </div>
  );
};

export default MediaListDetail;
