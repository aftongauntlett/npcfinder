import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import Button from "../../shared/ui/Button";
import { RecipeCard } from "../../shared/cards";
import { Pagination } from "../../shared/common/Pagination";
import { EmptyStateAddCard, LocalSearchInput } from "../../shared";
import { usePagination } from "../../../hooks/usePagination";
import { useUrlPaginationState } from "../../../hooks/useUrlPaginationState";
import FilterSortMenu from "../../shared/common/FilterSortMenu";
import type { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

interface RecipeListViewProps {
  boardId: string;
  onCreateTask: () => void;
  onViewRecipe: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const RecipeListView: React.FC<RecipeListViewProps> = ({
  boardId,
  onCreateTask,
  onViewRecipe,
  onDeleteTask,
}) => {
  const { data: tasks = [], isLoading } = useTasks(boardId);

  // Load persisted filter state
  const persistenceKey = "tasks-recipe-filters";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    activeSort: "name-asc",
    categoryFilters: ["all"],
  });

  const [activeSort, setActiveSort] = useState<string>(
    persistedFilters.activeSort as string
  );
  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    persistedFilters.categoryFilters as string[]
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const listTopRef = useRef<HTMLDivElement>(null);

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, {
      activeSort,
      categoryFilters,
    });
  }, [activeSort, categoryFilters]);

  // Extract unique categories from recipes
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    tasks.forEach((task) => {
      const category = task.item_data?.category as string | undefined;
      if (category) {
        categorySet.add(category);
      }
    });
    return categorySet;
  }, [tasks]);

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by category
    if (!(categoryFilters.length === 0 || categoryFilters.includes("all"))) {
      filtered = filtered.filter((task) => {
        const category = task.item_data?.category as string | undefined;
        return category && categoryFilters.includes(category);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) => {
        const recipeName =
          (task.item_data?.recipe_name as string) ||
          (task.item_data?.name as string) ||
          task.title;
        return recipeName.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [tasks, categoryFilters, searchQuery]);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aName =
      (a.item_data?.recipe_name as string) ||
      (a.item_data?.name as string) ||
      a.title;
    const bName =
      (b.item_data?.recipe_name as string) ||
      (b.item_data?.name as string) ||
      b.title;

    switch (activeSort) {
      case "name-asc":
        return aName.localeCompare(bName);
      case "name-desc":
        return bName.localeCompare(aName);
      case "date-newest":
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      case "date-oldest":
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      default:
        return 0;
    }
  });

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  // Pagination with URL state for bookmarkable pages
  const pagination = usePagination({
    items: sortedTasks,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey: "tasks-recipe-list",
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  const filterSortSections: FilterSortSection[] = useMemo(() => {
    // Sort categories alphabetically
    const sortedCategories = Array.from(availableCategories).sort();

    const categoryOptions = [
      { id: "all", label: "All Categories" },
      ...sortedCategories.map((category) => ({
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
          { id: "name-asc", label: "Name (A-Z)" },
          { id: "name-desc", label: "Name (Z-A)" },
          { id: "date-newest", label: "Date (Newest)" },
          { id: "date-oldest", label: "Date (Oldest)" },
        ],
        multiSelect: false,
      },
    ];
  }, [availableCategories]);

  const handleFilterChange = (sectionId: string, value: string | string[]) => {
    if (sectionId === "category") {
      const categories = Array.isArray(value) ? value : [value];
      setCategoryFilters(categories);
    } else if (sectionId === "sort") {
      setActiveSort(value as string);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Loading recipes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {sortedTasks.length === 0 ? (
        /* Empty State Card */
        <EmptyStateAddCard
          icon={Plus}
          title="Add Your First Recipe"
          description="Save and organize your favorite recipes. Paste a recipe URL or manually enter details."
          onClick={onCreateTask}
          ariaLabel="Add your first recipe"
        />
      ) : (
        <>
          {/* Toolbar */}
          <div ref={listTopRef} className="space-y-3">
            <div className="flex flex-nowrap items-center justify-between gap-3">
              <div className="flex-1 max-w-md">
                <LocalSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search Recipes..."
                  filterButton={
                    <FilterSortMenu
                      sections={filterSortSections}
                      activeFilters={{
                        category: categoryFilters,
                        sort: activeSort,
                      }}
                      onFilterChange={handleFilterChange}
                      label=""
                    />
                  }
                />
              </div>
              <Button
                onClick={() => onCreateTask()}
                variant="action"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Recipe List */}
          <div className="space-y-3">
            {pagination.paginatedItems.map((task) => {
              const recipeName =
                (task.item_data?.recipe_name as string) ||
                (task.item_data?.name as string) ||
                task.title;
              const category = task.item_data?.category as string | undefined;
              const prepTime = task.item_data?.prep_time as string;
              const cookTime = task.item_data?.cook_time as string;
              const totalTime = task.item_data?.total_time as string;
              const servings = task.item_data?.servings as string | number;
              const description =
                (task.item_data?.description as string) || task.description;
              const ingredients = task.item_data?.ingredients as
                | string[]
                | string;
              const instructions = task.item_data?.instructions as
                | string[]
                | string;
              const sourceUrl =
                (task.item_data?.recipe_url as string) ||
                (task.item_data?.source_url as string);
              const notes = task.item_data?.notes as string;

              // Parse ingredients and instructions if they're strings
              const ingredientsList = Array.isArray(ingredients)
                ? ingredients
                : ingredients
                ? ingredients.split("\n").filter(Boolean)
                : [];
              const instructionsList = Array.isArray(instructions)
                ? instructions
                : instructions
                ? instructions.split("\n").filter(Boolean)
                : [];

              return (
                <RecipeCard
                  key={task.id}
                  recipeName={recipeName}
                  category={category}
                  prepTime={prepTime}
                  cookTime={cookTime}
                  totalTime={totalTime}
                  servings={servings ? String(servings) : undefined}
                  description={description || undefined}
                  ingredients={ingredientsList}
                  instructions={instructionsList}
                  sourceUrl={sourceUrl}
                  notes={notes}
                  task={task}
                  onEdit={() => onViewRecipe(task)}
                  onDelete={
                    onDeleteTask ? () => onDeleteTask(task.id) : undefined
                  }
                />
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.filteredItems.length}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(page) => {
              pagination.goToPage(page);
              listTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            onItemsPerPageChange={(count) => {
              pagination.setItemsPerPage(count);
              listTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
};
