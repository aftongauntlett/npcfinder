/**
 * Grocery List View
 *
 * Displays grocery items grouped by category with quick add/toggle functionality
 * Similar to AnyList - simple, focused on groceries
 */

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Share2, Check } from "lucide-react";
import Button from "../../shared/ui/Button";
import Chip from "../../shared/ui/Chip";
import { EmptyStateAddCard } from "../../shared";
import ShareBoardModal from "../ShareBoardModal";
import FilterSortMenu from "../../shared/common/FilterSortMenu";
import type { FilterSortSection } from "../../shared/common/FilterSortMenu";
import GroceryItemCard from "../GroceryItemCard";
import GroceryItemModal from "../GroceryItemModal";
import {
  GROCERY_CATEGORIES,
  CATEGORY_COLORS,
} from "../../../utils/taskConstants";
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
  useBoardShares,
} from "../../../hooks/useTasksQueries";
import { useGroceryListFiltering } from "../../../hooks/useGroceryListFiltering";
import type {
  BoardWithStats,
  Task,
} from "../../../services/tasksService.types";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

interface GroceryListViewProps {
  board: BoardWithStats;
  onEditTask?: (taskId: string) => void;
  isReadOnly?: boolean;
}

const GroceryListView: React.FC<GroceryListViewProps> = ({
  board,
  onEditTask: _onEditTask,
  isReadOnly = false,
}) => {
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Task | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load persisted filter state
  const persistenceKey = "tasks-grocery-filters";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    categoryFilters: ["all"],
    sortBy: "category",
  });

  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    persistedFilters.categoryFilters as string[]
  );
  const [sortBy, setSortBy] = useState<"category" | "name">(
    persistedFilters.sortBy as "category" | "name"
  );

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, {
      categoryFilters,
      sortBy,
    });
  }, [categoryFilters, sortBy]);

  const { data: tasks = [] } = useTasks(board.id);
  const { data: shares = [] } = useBoardShares(board.id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Extract filtering/grouping logic into dedicated hook
  const { itemsByCategory, needToBuy, purchased } = useGroceryListFiltering(
    tasks,
    { categoryFilters, sortBy }
  );

  const handleAddItem = async (data: {
    title: string;
    item_data: {
      item_name: string;
      category: string;
      quantity: string;
      notes?: string;
    };
  }) => {
    if (isReadOnly) return;

    await createTask.mutateAsync({
      board_id: board.id,
      title: data.item_data.item_name,
      item_data: data.item_data,
      status: "todo",
    });
    setShowItemModal(false);
  };

  const handleEditItem = async (data: {
    title: string;
    item_data: {
      item_name: string;
      category: string;
      quantity: string;
      notes?: string;
    };
  }) => {
    if (isReadOnly || !editingItem) return;

    await updateTask.mutateAsync({
      taskId: editingItem.id,
      updates: {
        title: data.title,
        item_data: data.item_data,
      },
    });
    setEditingItem(null);
    setShowItemModal(false);
  };

  const handleTogglePurchased = async (taskId: string) => {
    if (isReadOnly) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isPurchased = task.status === "done";
    await updateTask.mutateAsync({
      taskId: task.id,
      updates: {
        status: isPurchased ? "todo" : "done",
        completed_at: isPurchased ? null : new Date().toISOString(),
      },
    });
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingItem(task);
      setShowItemModal(true);
    }
  };

  const handleDeleteItem = async (taskId: string) => {
    if (isReadOnly) return;

    await deleteTask.mutateAsync(taskId);
  };

  // Filter/Sort sections for FilterSortMenu
  const filterSortSections: FilterSortSection[] = useMemo(() => {
    const categoryOptions = [
      { id: "all", label: "All Categories" },
      ...GROCERY_CATEGORIES.map((category) => ({
        id: category,
        label: category,
      })),
    ];

    return [
      {
        id: "category",
        title: "Category",
        multiSelect: true,
        options: categoryOptions,
      },
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "category", label: "By Category" },
          { id: "name", label: "By Name (A-Z)" },
        ],
        multiSelect: false,
      },
    ];
  }, []);

  const handleFilterChange = (sectionId: string, value: string | string[]) => {
    if (sectionId === "category") {
      const categories = Array.isArray(value) ? value : [value];
      setCategoryFilters(categories);
    } else if (sectionId === "sort") {
      setSortBy(value as "category" | "name");
    }
  };

  const hasItems = tasks.length > 0;

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {/* Empty State */}
      {!hasItems && (
        <EmptyStateAddCard
          icon={Plus}
          title="No items yet"
          description="Add your first grocery item to get started"
          onClick={() => setShowItemModal(true)}
          ariaLabel="Add your first grocery item"
        />
      )}

      {hasItems && (
        <>
          {/* Toolbar */}
          <div className="flex flex-nowrap items-center justify-between gap-3">
            <FilterSortMenu
              sections={filterSortSections}
              activeFilters={{
                category: categoryFilters,
                sort: sortBy,
              }}
              onFilterChange={handleFilterChange}
              label="Sort & Filter"
            />
            <div className="flex items-center gap-2">
              {/* Share Button */}
              {!isReadOnly && (
                <Button
                  variant="action"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  icon={<Share2 className="w-4 h-4" />}
                  className="!border-primary/40 !bg-primary/10 !text-primary hover:!border-primary/60 hover:!bg-primary/20"
                >
                  {shares.length > 0 ? `${shares.length}` : "Share"}
                </Button>
              )}

              {/* Add Button */}
              {!isReadOnly && (
                <Button
                  variant="action"
                  size="sm"
                  onClick={() => setShowItemModal(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Need to Buy Section */}
          {needToBuy.length > 0 && (
            <div className="space-y-4">
              {sortBy === "category" ? (
                // Group by category
                GROCERY_CATEGORIES.map((category) => {
                  const categoryItems = Array.from(
                    itemsByCategory.get(category) || []
                  ).filter((item) => item.status !== "done");

                  if (categoryItems.length === 0) return null;

                  const colors =
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

                  return (
                    <div key={category} className="space-y-3">
                      {/* Category Header */}
                      <div className="flex items-center gap-2">
                        <Chip
                          variant="default"
                          size="md"
                          className={`${colors.bg} ${colors.text} ${colors.border} border font-semibold`}
                        >
                          {category}
                        </Chip>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {categoryItems.length}{" "}
                          {categoryItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      {/* Category Items */}
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <GroceryItemCard
                            key={item.id}
                            task={item}
                            onTogglePurchased={handleTogglePurchased}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteItem}
                            isReadOnly={isReadOnly}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Sort by name (no categories)
                <div className="space-y-2">
                  {needToBuy.map((item) => (
                    <GroceryItemCard
                      key={item.id}
                      task={item}
                      onTogglePurchased={handleTogglePurchased}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteItem}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Purchased Section */}
          {purchased.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Purchased ({purchased.length})
                </h3>
              </div>
              <div className="space-y-2 opacity-75">
                {purchased.map((item: Task) => (
                  <GroceryItemCard
                    key={item.id}
                    task={item}
                    onTogglePurchased={handleTogglePurchased}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteItem}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Grocery Item Modal */}
      <GroceryItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        boardId={board.id}
        item={editingItem}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
      />

      {/* Share Board Modal */}
      <ShareBoardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        boardId={board.id}
        boardName={board.name}
      />
    </div>
  );
};

export default GroceryListView;
