import { useCallback, useState } from "react";

type DraggableEntity = { id: string | number };

export function useDraggableList<T extends DraggableEntity>(
  items: T[],
  onReorder: (reordered: T[]) => void,
) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, item: T) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(item.id));
    setDraggedItem(item);

    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      window.setTimeout(() => {
        dragElement.style.opacity = "0.5";
      }, 0);
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      dragElement.style.opacity = "1";
    }

    setDraggedItem(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetItem?: T) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (!draggedItem) {
        return;
      }

      if (!targetItem) {
        setDragOverId("__top__");
        return;
      }

      if (draggedItem.id !== targetItem.id) {
        setDragOverId(String(targetItem.id));
      }
    },
    [draggedItem],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetItem?: T) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);

      if (!draggedItem) {
        return;
      }

      const reordered = [...items];
      const draggedIndex = reordered.findIndex(
        (item) => item.id === draggedItem.id,
      );

      if (draggedIndex === -1) {
        setDraggedItem(null);
        return;
      }

      reordered.splice(draggedIndex, 1);

      if (!targetItem) {
        reordered.unshift(draggedItem);
        onReorder(reordered);
        setDraggedItem(null);
        return;
      }

      if (draggedItem.id === targetItem.id) {
        setDraggedItem(null);
        return;
      }

      const targetIndex = reordered.findIndex(
        (item) => item.id === targetItem.id,
      );
      if (targetIndex === -1) {
        setDraggedItem(null);
        return;
      }

      // targetIndex is computed after splice, so no offset required.
      const insertIndex = targetIndex;
      reordered.splice(insertIndex, 0, draggedItem);

      onReorder(reordered);
      setDraggedItem(null);
    },
    [draggedItem, items, onReorder],
  );

  return {
    draggedItem,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
