/**
 * Grocery List View
 *
 * Displays grocery items grouped by category with quick add/toggle functionality
 * Similar to AnyList - simple, focused on groceries
 */

import React, { useState, useMemo } from "react";
import { Plus, Share2, Check } from "lucide-react";
import Button from "../../shared/ui/Button";
import Chip from "../../shared/ui/Chip";
import MediaEmptyState from "../../media/MediaEmptyState";
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
import type {
  BoardWithStats,
  Task,
} from "../../../services/tasksService.types";

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
  const [categoryFilters, setCategoryFilters] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<"category" | "name">("category");

  const { data: tasks = [] } = useTasks(board.id);
  const { data: shares = [] } = useBoardShares(board.id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    GROCERY_CATEGORIES.forEach((cat) => {
      grouped.set(cat, []);
    });

    tasks.forEach((task) => {
      const category = (task.item_data?.category as string) || "Other";
      const categoryTasks = grouped.get(category) || grouped.get("Other")!;
      categoryTasks.push(task);
    });

    return grouped;
  }, [tasks]);

  // Separate purchased and need to buy
  const needToBuy = useMemo(() => {
    let items = tasks.filter((t) => t.status !== "done");

    // Apply category filter
    if (categoryFilters.length > 0 && !categoryFilters.includes("all")) {
      items = items.filter((t) => {
        const category = (t.item_data?.category as string) || "Other";
        return categoryFilters.includes(category);
      });
    }

    // Apply sorting
    if (sortBy === "name") {
      items = items.sort((a, b) => {
        const nameA = (a.item_data?.item_name as string) || a.title || "";
        const nameB = (b.item_data?.item_name as string) || b.title || "";
        return nameA.localeCompare(nameB);
      });
    }

    return items;
  }, [tasks, categoryFilters, sortBy]);

  const purchased = useMemo(
    () => tasks.filter((t) => t.status === "done"),
    [tasks]
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
    if (!editingItem) return;

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
        <MediaEmptyState
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
              onResetFilters={() => {
                setCategoryFilters(["all"]);
              }}
              hasActiveFilters={
                !categoryFilters.includes("all") && categoryFilters.length > 0
              }
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
                  className="!border-purple-400/50 dark:!border-purple-400/50 !bg-purple-100/10 dark:!bg-purple-500/10 !text-purple-600 dark:!text-purple-300 hover:!border-purple-500/70 dark:hover:!border-purple-400/70 hover:!bg-purple-200/20 dark:hover:!bg-purple-500/20"
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
