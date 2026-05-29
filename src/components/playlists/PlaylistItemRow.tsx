import { Fragment } from "react";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/shared";
import type { PlaylistItem } from "@/services/playlistsService";
import type { TrackerItem } from "@/services/trackerService";

interface PlaylistItemRowProps {
  item: PlaylistItem;
  index: number;
  canEdit: boolean;
  ownerRating: number | null;
  viewerRating: number | null;
  viewerTrackerItem: TrackerItem | null;
  isOwner: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}

function formatEditedFieldLabel(fieldKey: string): string {
  return fieldKey
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PlaylistItemRow({
  item,
  index,
  canEdit,
  ownerRating,
  viewerRating,
  viewerTrackerItem,
  isOwner,
  isExpanded,
  onToggleExpand,
  onRemove,
}: PlaylistItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      disabled: !canEdit,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const media = item.media;
  const comment = item.note?.trim() ?? "";

  const ownerTrackerNote = item.owner_tracker_note?.trim() ?? "";
  const viewerTrackerNote = viewerTrackerItem?.note?.trim() ?? "";
  const ownerEditedFieldLabels = (item.owner_media_edited_fields ?? []).map(
    formatEditedFieldLabel,
  );

  return (
    <Fragment>
      <tr
        ref={setNodeRef}
        style={style}
        className="group border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
        onClick={onToggleExpand}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggleExpand();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Toggle details for ${media?.title ?? "item"}`}
      >
        <td className="w-10 pl-3 pr-2 py-2 text-center">
          {canEdit ? (
            <button
              type="button"
              aria-label="Drag to reorder"
              className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={(event) => event.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {index + 1}
            </span>
          )}
        </td>

        <td className="py-2 pr-3 max-w-[16rem]">
          <div className="flex items-center gap-2 min-w-0">
            <p className="flex-1 min-w-0 font-medium text-sm text-gray-900 dark:text-white truncate">
              {media?.title ?? "Untitled"}
            </p>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </td>

        <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 capitalize whitespace-nowrap">
          {media?.media_type ?? "—"}
        </td>

        <td className="py-2 pr-3 text-xs text-gray-700 dark:text-gray-300 tabular-nums whitespace-nowrap">
          {ownerRating ?? "—"}
        </td>

        <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 max-w-[20rem] truncate">
          {comment || "—"}
        </td>

        {canEdit && (
          <td
            className="py-2 pr-3 text-right"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="danger"
              size="icon"
              aria-label="Remove from playlist"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            />
          </td>
        )}
      </tr>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/30"
          >
            <td colSpan={canEdit ? 6 : 5} className="px-4 py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 py-3">
                  {media?.subtitle && (
                    <p>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        Subtitle:
                      </span>{" "}
                      {media.subtitle}
                    </p>
                  )}

                  {media?.description && (
                    <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                      {media.description}
                    </p>
                  )}

                  {ownerTrackerNote && (
                    <p>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        Owner Note:
                      </span>{" "}
                      {ownerTrackerNote}
                    </p>
                  )}

                  {!isOwner && (viewerRating !== null || viewerTrackerNote) && (
                    <div className="space-y-1">
                      {viewerRating !== null && (
                        <p>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Your Rating:
                          </span>{" "}
                          {viewerRating}
                        </p>
                      )}
                      {viewerTrackerNote && (
                        <p>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Your Note:
                          </span>{" "}
                          {viewerTrackerNote}
                        </p>
                      )}
                    </div>
                  )}

                  {ownerEditedFieldLabels.length > 0 && (
                    <p>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        Owner Edited Fields:
                      </span>{" "}
                      {ownerEditedFieldLabels.join(", ")}
                    </p>
                  )}
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
