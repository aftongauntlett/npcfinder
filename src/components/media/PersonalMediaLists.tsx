import React, { useMemo, useState } from "react";
import { ExternalLink, List, Plus } from "lucide-react";
import {
  AccordionListCard,
  ConfirmationModal,
  EmptyStateAddCard,
  MediaPageToolbar,
} from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateMediaList,
  useDeleteMediaList,
  useMediaLists,
  useMediaListItems,
  useUpdateMediaList,
} from "@/hooks/useMediaListsQueries";
import type {
  MediaDomain,
  MediaListWithCounts,
} from "@/services/mediaListsService.types";
import CreateMediaListModal from "./CreateMediaListModal";
import EditMediaListModal from "./EditMediaListModal";
import {
  getIconsForMediaType,
  MEDIA_DOMAIN_DEFAULT_ICON,
} from "@/utils/mediaIcons";

interface PersonalMediaListsProps {
  domain: MediaDomain;
  onOpenList: (list: Pick<MediaListWithCounts, "id" | "title">) => void;
}

const PersonalMediaLists: React.FC<PersonalMediaListsProps> = ({
  domain,
  onOpenList,
}) => {
  const { user } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MediaListWithCounts | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<MediaListWithCounts | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated_desc" | "title" | "items_desc">(
    "updated_desc"
  );

  const { data: lists = [], isLoading: listsLoading } = useMediaLists(domain);
  const createList = useCreateMediaList(domain);
  const updateList = useUpdateMediaList(domain);
  const deleteList = useDeleteMediaList(domain);

  const iconOptions = useMemo(() => getIconsForMediaType(domain), [domain]);
  const iconByName = useMemo(() => {
    return new Map(iconOptions.map((o) => [o.name, o.icon] as const));
  }, [iconOptions]);

  const handleCreateList = async (params: {
    title: string;
    description?: string | null;
    icon?: string | null;
    icon_color?: string | null;
    is_public: boolean;
  }) => {
    await createList.mutateAsync(params);
  };

  const hasLists = lists.length > 0;

  const visibleLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? lists.filter((l) => {
          const haystack = [l.title, l.description, l.owner_display_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : lists;

    const sorted = [...filtered];

    if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      return sorted;
    }

    if (sortBy === "items_desc") {
      sorted.sort((a, b) => (b.item_count || 0) - (a.item_count || 0));
      return sorted;
    }

    // updated_desc is already the service default; keep stable
    return sorted;
  }, [lists, searchQuery, sortBy]);

  const ListDetails: React.FC<{ list: MediaListWithCounts }> = ({ list }) => {
    const { data: items = [], isLoading } = useMediaListItems(list.id);

    const preview = items.slice(0, 6);
    const remaining = Math.max(0, items.length - preview.length);

    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading items...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No items yet.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Items
            </div>
            <ul className="space-y-1">
              {preview.map((i) => (
                <li
                  key={i.id}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="font-medium">{i.title}</span>
                  {i.subtitle ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}
                      · {i.subtitle}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{remaining} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="space-y-4 sm:space-y-6">
        {hasLists && (
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: [
                {
                  id: "sort",
                  title: "Sort By",
                  options: [
                    { id: "updated_desc", label: "Recently Updated" },
                    { id: "title", label: "Title (A–Z)" },
                    { id: "items_desc", label: "Most Items" },
                  ],
                },
              ],
              activeFilters: { sort: sortBy },
              onFilterChange: (sectionId, value) => {
                if (sectionId === "sort") setSortBy(value as typeof sortBy);
              },
            }}
            searchConfig={{
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Search Lists...",
            }}
            onAddClick={() => setShowCreateModal(true)}
            addLabel="Create"
            addIcon={<Plus size={18} />}
          />
        )}

        {listsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading lists...
          </div>
        ) : lists.length === 0 ? (
          <EmptyStateAddCard
            icon={List}
            title="No lists yet"
            description="Create a list to start collecting favorites and sharing with friends."
            onClick={() => setShowCreateModal(true)}
            ariaLabel="Create your first list"
          />
        ) : (
          <div className="space-y-3">
            {visibleLists.map((list) => {
              const owned = !!user?.id && list.owner_id === user.id;
              return (
                <AccordionListCard
                  key={list.id}
                  isExpanded={expandedListId === list.id}
                  onExpandChange={(isExpanded) =>
                    setExpandedListId(isExpanded ? list.id : null)
                  }
                  expandedContent={<ListDetails list={list} />}
                  onEdit={
                    owned
                      ? () => {
                          setEditTarget(list);
                        }
                      : undefined
                  }
                  onDelete={
                    owned
                      ? () => {
                          setDeleteTarget(list);
                        }
                      : undefined
                  }
                  customActions={[
                    {
                      icon: <ExternalLink className="w-4 h-4" />,
                      onClick: () =>
                        onOpenList({ id: list.id, title: list.title }),
                      variant: "subtle",
                      ariaLabel: "Open",
                    },
                  ]}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon =
                          (list.icon ? iconByName.get(list.icon) : null) ??
                          MEDIA_DOMAIN_DEFAULT_ICON[domain];
                        return (
                          <Icon
                            className={
                              list.icon_color
                                ? "w-4 h-4"
                                : "w-4 h-4 text-gray-400"
                            }
                            style={
                              list.icon_color
                                ? { color: list.icon_color }
                                : undefined
                            }
                            weight="regular"
                          />
                        );
                      })()}
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {list.title}
                      </h3>
                    </div>
                    <div className="mt-1 text-muted">
                      {owned ? "By you" : `By ${list.owner_display_name}`}
                      {list.is_public ? " • Visible to friends" : " • Private"}
                    </div>
                    {list.description && (
                      <div className="mt-2 text-muted line-clamp-2">
                        {list.description}
                      </div>
                    )}
                  </div>
                </AccordionListCard>
              );
            })}
          </div>
        )}
      </div>

      <CreateMediaListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        domain={domain}
        onCreate={handleCreateList}
      />

      {editTarget && (
        <EditMediaListModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          domain={domain}
          initialValues={{
            title: editTarget.title,
            description: editTarget.description,
            icon: editTarget.icon ?? null,
            icon_color: editTarget.icon_color ?? null,
            is_public: editTarget.is_public,
          }}
          onSave={async (updates) => {
            await updateList.mutateAsync({ listId: editTarget.id, updates });
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            void deleteList.mutateAsync(deleteTarget.id).finally(() => {
              setDeleteTarget(null);
            });
          }}
          title="Delete List"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteList.isPending}
        />
      )}
    </div>
  );
};

export default PersonalMediaLists;
