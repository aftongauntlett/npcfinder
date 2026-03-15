import { useMemo, useState } from "react";
import { Library, Plus } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  EmptyStateAddCard,
  MediaPageToolbar,
  Modal,
  Select,
  Input,
  Textarea,
} from "@/components/shared";
import {
  useAllAccessibleCollections,
  useCreateCollection,
} from "@/hooks/useCollectionsQueries";

type SortId = "recent" | "name";

export default function MediaCollectionsTab(props: {
  onOpenCollection: (params: { collectionId: string; title?: string }) => void;
}) {
  const {
    data: collections = [],
    isLoading,
    isError,
  } = useAllAccessibleCollections();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortId>("recent");

  const create = useCreateCollection("mixed");

  const closeCreate = () => {
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setVisibility("private");
  };

  const submitCreate = async () => {
    const t = title.trim();
    if (!t) return;

    const created = await create.mutateAsync({
      title: t,
      description: description.trim() || null,
      is_public: visibility === "public",
    });

    closeCreate();

    if (created?.id) {
      props.onOpenCollection({
        collectionId: created.id,
        title: created.title,
      });
    }
  };

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = !q
      ? collections
      : collections.filter((c) => {
          const hay =
            `${c.title} ${c.description ?? ""} ${c.owner_display_name ?? ""}`.toLowerCase();
          return hay.includes(q);
        });

    const sorted = [...filtered];

    if (sort === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => {
        const ad = a.updated_at || a.created_at;
        const bd = b.updated_at || b.created_at;
        return bd.localeCompare(ad);
      });
    }

    return sorted;
  }, [collections, search, sort]);

  const hasCollections = collections.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {hasCollections && (
        <div className="mb-4">
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: [
                {
                  id: "sort",
                  title: "Sort",
                  options: [
                    { id: "recent", label: "Recent" },
                    { id: "name", label: "Name" },
                  ],
                },
              ],
              activeFilters: { sort },
              onFilterChange: (sectionId, filterId) => {
                if (sectionId !== "sort") return;
                if (typeof filterId !== "string") return;
                setSort(filterId as SortId);
              },
            }}
            searchConfig={{
              value: search,
              onChange: setSearch,
              placeholder: "Search collections...",
            }}
            onAddClick={() => setShowCreate(true)}
            addLabel="New Collection"
            addIcon={<Plus className="w-4 h-4" />}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading collections...
        </div>
      ) : isError ? (
        <div className="text-sm text-red-600 dark:text-red-400">
          Failed to load collections.
        </div>
      ) : !hasCollections ? (
        <EmptyStateAddCard
          icon={Library}
          title="Add Your First Collection"
          description="Create a collection to start organizing your media."
          onClick={() => setShowCreate(true)}
          ariaLabel="Add your first collection"
          actionLabel="New Collection"
        />
      ) : filteredSorted.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No matches"
          description="Try a different search."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSorted.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                props.onOpenCollection({ collectionId: c.id, title: c.title })
              }
            >
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {c.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {c.owner_display_name} • {c.item_count} items
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    {c.media_domain}
                    {c.is_public ? " • public" : ""}
                  </span>
                </div>
                {c.description ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {c.description}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={closeCreate}
        title="New Collection"
        maxWidth="xl"
      >
        <div className="p-6 space-y-4">
          <Input
            id="collection-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cozy Favorites"
            required
          />

          <Textarea
            id="collection-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            rows={3}
          />

          <Select
            id="collection-visibility"
            label="Visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "private" | "public")
            }
            options={[
              { value: "private", label: "Private (owner + members)" },
              {
                value: "public",
                label: "Public (any logged-in user can view)",
              },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="subtle" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitCreate()}
              disabled={!title.trim() || create.isPending}
            >
              {create.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
