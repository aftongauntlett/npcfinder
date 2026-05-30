import { useMemo } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared";
import PlaylistItemRow from "./PlaylistItemRow";
import type { PlaylistItem } from "@/services/playlistsService";
import type { TrackerItem } from "@/services/trackerService";

interface PlaylistItemsTableProps {
  items: PlaylistItem[];
  isOwner: boolean;
  canEdit: boolean;
  trackerItemByMediaId: Map<string, TrackerItem>;
  trackerRatingByMediaId: Map<string, number | null>;
  onReorder: (reordered: PlaylistItem[]) => Promise<void>;
  onRemove: (item: PlaylistItem) => void;
  onAddItems: () => void;
}

export default function PlaylistItemsTable({
  items,
  canEdit,
  onReorder,
  onRemove,
  onAddItems,
}: PlaylistItemsTableProps) {
  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return (a.created_at || "").localeCompare(b.created_at || "");
      }),
    [items],
  );

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(orderedItems, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        position: index,
      }),
    );

    await onReorder(reordered);
  };

  if (orderedItems.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No items yet"
        description={
          canEdit
            ? "Add items from your tracker to start curating this playlist."
            : "The owner has not added any items yet."
        }
        action={
          canEdit
            ? { label: "Add From Tracker", onClick: onAddItems }
            : undefined
        }
      />
    );
  }

  const list = (
    <div className="space-y-2 sm:space-y-3">
      {orderedItems.map((item, index) => {
        return (
          <PlaylistItemRow
            key={item.id}
            item={item}
            index={index}
            canEdit={canEdit}
            ownerRating={item.owner_tracker_rating}
            onRemove={() => onRemove(item)}
          />
        );
      })}
    </div>
  );

  if (!canEdit) {
    return list;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <SortableContext
        items={orderedItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {list}
      </SortableContext>
    </DndContext>
  );
}
