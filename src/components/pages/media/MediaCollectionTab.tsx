import { useEffect, useMemo, useState } from "react";
import { Library, Plus, Share2, Trash2 } from "lucide-react";
import { Button, ConfirmationModal, EmptyState } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDeleteMediaList,
  useMediaList,
  useMediaListItems,
  useMyMediaListRole,
  useRemoveMediaListItem,
} from "@/hooks/useMediaListsQueries";
import MediaListItem from "@/components/media/MediaListItem";
import ShareMediaListModal from "@/components/media/ShareMediaListModal";
import AddItemToCollectionModal from "@/components/media/AddItemToCollectionModal";

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

  const { data: collection, isLoading: isCollectionLoading } =
    useMediaList(collectionId);
  const { data: items = [], isLoading: itemsLoading } =
    useMediaListItems(collectionId);
  const { data: myRole } = useMyMediaListRole(collectionId);

  useEffect(() => {
    if (collection?.title) onTitle(collection.title);
  }, [collection?.title, onTitle]);

  const isOwner =
    !!user?.id && !!collection?.owner_id && user.id === collection.owner_id;
  const canEditItems = isOwner || myRole === "editor";
  const canManageMembers = canEditItems;

  // Remove mutation needs a domain for legacy invalidation.
  const removeItem = useRemoveMediaListItem(
    collection?.media_domain || "mixed",
  );
  const deleteList = useDeleteMediaList(collection?.media_domain || "mixed");

  const existingKeys = useMemo(
    () =>
      items.map((i) => ({
        external_id: i.external_id,
        media_type: i.media_type,
      })),
    [items],
  );

  const handleRemove = async (itemId: string) => {
    await removeItem.mutateAsync({ listId: collectionId, itemId });
  };

  const handleDelete = async () => {
    await deleteList.mutateAsync(collectionId);
    setShowDeleteConfirm(false);
    onDeleted();
  };

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
    </div>
  );
}
