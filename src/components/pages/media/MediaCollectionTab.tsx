import { useEffect, useMemo, useState } from "react";
import { Library, Plus, Share2, Trash2 } from "lucide-react";
import { Button, ConfirmationModal, EmptyState } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDeleteCollection,
  useCollection,
  useCollectionItems,
  useMyCollectionRole,
  useRemoveCollectionItem,
} from "@/hooks/useCollectionsQueries";
import MediaListItem from "@/components/media/MediaListItem";
import ShareMediaListModal from "@/components/media/ShareMediaListModal";
import AddItemToCollectionModal from "@/components/media/AddItemToCollectionModal";
import SendMediaModal from "@/components/shared/media/SendMediaModal";
import {
  searchMoviesAndTV,
  searchGames,
  searchMusic,
} from "@/utils/mediaSearchAdapters";
import { searchBooks } from "@/utils/bookSearchAdapters";
import type { CollectionItem } from "@/services/collectionsServiceTypes";

export default function MediaCollectionTab(props: {
  collectionId: string;
  onTitle: (title: string) => void;
  onDeleted: () => void;
}) {
  const { collectionId, onTitle, onDeleted } = props;
  const { user } = useAuth();

  const [showShare, setShowShare] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recommendItem, setRecommendItem] = useState<CollectionItem | null>(
    null,
  );

  const { data: collection, isLoading: isCollectionLoading } =
    useCollection(collectionId);
  const { data: items = [], isLoading: itemsLoading } =
    useCollectionItems(collectionId);
  const { data: myRole } = useMyCollectionRole(collectionId);

  useEffect(() => {
    if (collection?.title) onTitle(collection.title);
  }, [collection?.title, onTitle]);

  const isOwner =
    !!user?.id && !!collection?.owner_id && user.id === collection.owner_id;
  const canEditItems = isOwner || myRole === "editor";
  const canManageMembers = canEditItems;
  const canRecommendItems = !!user?.id;

  // Remove mutation needs a domain for legacy invalidation.
  const removeItem = useRemoveCollectionItem(
    collection?.media_domain || "mixed",
  );
  const deleteList = useDeleteCollection(collection?.media_domain || "mixed");

  const existingKeys = useMemo(
    () =>
      items.map((i) => ({
        external_id: i.external_id,
        media_type: i.media_type,
      })),
    [items],
  );

  const handleRemove = async (itemId: string) => {
    await removeItem.mutateAsync({ collectionId, itemId });
  };

  const handleDelete = async () => {
    await deleteList.mutateAsync(collectionId);
    setShowDeleteConfirm(false);
    onDeleted();
  };

  const recommendationConfig = useMemo(() => {
    if (!recommendItem) return null;

    if (
      recommendItem.media_type === "movie" ||
      recommendItem.media_type === "tv"
    ) {
      return {
        mediaType: "movies" as const,
        tableName: "movie_recommendations",
        searchPlaceholder: "Search for movies or TV shows...",
        searchFunction: searchMoviesAndTV,
        recommendationTypes: [
          { value: "watch", label: "Watch" },
          { value: "rewatch", label: "Rewatch" },
        ],
        defaultRecommendationType: "watch",
      };
    }

    if (recommendItem.media_type === "book") {
      return {
        mediaType: "books" as const,
        tableName: "book_recommendations",
        searchPlaceholder: "Search for books...",
        searchFunction: searchBooks,
        recommendationTypes: [{ value: "read", label: "Read" }],
        defaultRecommendationType: "read",
      };
    }

    if (recommendItem.media_type === "game") {
      return {
        mediaType: "games" as const,
        tableName: "game_recommendations",
        searchPlaceholder: "Search for games...",
        searchFunction: searchGames,
        recommendationTypes: [{ value: "play", label: "Play" }],
        defaultRecommendationType: "play",
      };
    }

    return {
      mediaType: "music" as const,
      tableName: "music_recommendations",
      searchPlaceholder: "Search for songs, albums, or playlists...",
      searchFunction: searchMusic,
      recommendationTypes: [
        { value: "listen", label: "Listen" },
        { value: "relisten", label: "Relisten" },
      ],
      defaultRecommendationType: "listen",
    };
  }, [recommendItem]);

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-end gap-2 mb-6">
        {collection && canManageMembers && (
          <Button
            variant="secondary"
            icon={<Share2 className="w-4 h-4" />}
            onClick={() => setShowShare(true)}
          >
            Share
          </Button>
        )}

        {collection && canEditItems && (
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAdd(true)}
          >
            Add Item
          </Button>
        )}

        {collection && isOwner && (
          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        )}
      </div>

      {isCollectionLoading || itemsLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : !collection ? (
        <EmptyState
          icon={Library}
          title="Collection not found"
          description="You may not have access to this collection."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No items yet"
          description={
            canEditItems
              ? "Add items to start building this collection."
              : "No items have been added yet."
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
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
              onRecommend={
                canRecommendItems
                  ? () => {
                      setRecommendItem(item);
                    }
                  : undefined
              }
              onRemove={
                canEditItems ? () => void handleRemove(item.id) : undefined
              }
            />
          ))}
        </div>
      )}

      {collection && canManageMembers && (
        <ShareMediaListModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          listId={collection.id}
          listName={collection.title}
          domain={collection.media_domain}
        />
      )}

      {collection && canEditItems && (
        <AddItemToCollectionModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          collectionId={collection.id}
          mediaDomain={collection.media_domain}
          existingItems={existingKeys}
        />
      )}

      {collection && isOwner && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => void handleDelete()}
          title="Delete collection?"
          message="This will permanently delete the collection and all of its items."
          confirmText={deleteList.isPending ? "Deleting..." : "Delete"}
          variant="danger"
          isLoading={deleteList.isPending}
        />
      )}

      {recommendItem && recommendationConfig && (
        <SendMediaModal
          isOpen={!!recommendItem}
          onClose={() => setRecommendItem(null)}
          onSent={() => setRecommendItem(null)}
          mediaType={recommendationConfig.mediaType}
          tableName={recommendationConfig.tableName}
          searchPlaceholder={recommendationConfig.searchPlaceholder}
          searchFunction={recommendationConfig.searchFunction}
          recommendationTypes={recommendationConfig.recommendationTypes}
          defaultRecommendationType={
            recommendationConfig.defaultRecommendationType
          }
          preselectedItem={{
            external_id: recommendItem.external_id,
            title: recommendItem.title,
            subtitle: recommendItem.subtitle || undefined,
            authors: recommendItem.authors || undefined,
            artist: recommendItem.artist || undefined,
            album: recommendItem.album || undefined,
            poster_url: recommendItem.poster_url,
            release_date: recommendItem.release_date,
            description: recommendItem.description,
            media_type: recommendItem.media_type,
            page_count: recommendItem.page_count ?? undefined,
            isbn: recommendItem.isbn ?? undefined,
            categories: recommendItem.genres ?? undefined,
            genres: recommendItem.genres ?? undefined,
            metacritic: recommendItem.metacritic ?? undefined,
            playtime: recommendItem.playtime ?? undefined,
            platforms: recommendItem.platforms ?? undefined,
            preview_url: recommendItem.preview_url ?? undefined,
          }}
        />
      )}
    </div>
  );
}
