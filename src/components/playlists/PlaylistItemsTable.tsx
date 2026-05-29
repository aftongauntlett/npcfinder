import { useMemo, useState } from "react";
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
  isOwner,
  canEdit,
  trackerItemByMediaId,
  trackerRatingByMediaId,
  onReorder,
  onRemove,
  onAddItems,
}: PlaylistItemsTableProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const stickyHeaderClass =
    "sticky top-0 z-[1] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700";

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

  const table = (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>
          <th className={`w-10 pl-3 pr-2 py-2 ${stickyHeaderClass}`} />
          <th
            className={`py-2 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${stickyHeaderClass}`}
          >
            Title
          </th>
          <th
            className={`py-2 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${stickyHeaderClass}`}
          >
            Type
          </th>
          <th
            className={`py-2 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${stickyHeaderClass}`}
          >
            Rating
          </th>
          <th
            className={`py-2 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${stickyHeaderClass}`}
          >
            Comment
          </th>
          {canEdit && <th className={`py-2 pr-3 w-10 ${stickyHeaderClass}`} />}
        </tr>
      </thead>
      <tbody>
        {orderedItems.map((item, index) => {
          const isExpanded = expandedItemId === item.id;

          return (
            <PlaylistItemRow
              key={item.id}
              item={item}
              index={index}
              canEdit={canEdit}
              isOwner={isOwner}
              ownerRating={item.owner_tracker_rating}
              viewerRating={trackerRatingByMediaId.get(item.media_id) ?? null}
              viewerTrackerItem={
                trackerItemByMediaId.get(item.media_id) ?? null
              }
              isExpanded={isExpanded}
              onToggleExpand={() =>
                setExpandedItemId((current) =>
                  current === item.id ? null : item.id,
                )
              }
              onRemove={() => onRemove(item)}
            />
          );
        })}
      </tbody>
    </table>
  );

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">{table}</div>
      </div>
    );
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
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="overflow-x-auto">{table}</div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
