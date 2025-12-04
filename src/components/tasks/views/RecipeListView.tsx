import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import Button from "../../shared/ui/Button";
import Chip from "../../shared/ui/Chip";
import { RecipeCard } from "../../shared/cards";
import FilterSortMenu from "../../shared/common/FilterSortMenu";
import type { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

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
  const [activeSort, setActiveSort] = useState<string>("name-asc");
  const [categoryFilters, setCategoryFilters] = useState<string[]>(["all"]);

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
    if (categoryFilters.length === 0 || categoryFilters.includes("all")) {
      return tasks;
    }

    return tasks.filter((task) => {
      const category = task.item_data?.category as string | undefined;
      return category && categoryFilters.includes(category);
    });
  }, [tasks, categoryFilters]);

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
        <div
          onClick={() => onCreateTask()}
          className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Add Your First Recipe
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
            Save and organize your favorite recipes. Paste a recipe URL or
            manually enter details.
          </p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-nowrap items-center justify-between gap-3">
              <FilterSortMenu
                sections={filterSortSections}
                activeFilters={{
                  category: categoryFilters,
                  sort: activeSort,
                }}
                onFilterChange={handleFilterChange}
                label="Sort & Filter"
              />
              <Button
                onClick={() => onCreateTask()}
                variant="action"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Add
              </Button>
            </div>

            {/* Active Filter Chips */}
            {!categoryFilters.includes("all") && categoryFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map((category) => (
                  <Chip
                    key={category}
                    variant="primary"
                    size="sm"
                    rounded="full"
                    removable
                    onRemove={() => {
                      const newFilters = categoryFilters.filter(
                        (c) => c !== category
                      );
                      setCategoryFilters(
                        newFilters.length > 0 ? newFilters : ["all"]
                      );
                    }}
                  >
                    {category}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* Recipe List */}
          <div className="space-y-3">
            {sortedTasks.map((task) => {
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
                  onEdit={() => onViewRecipe(task)}
                  onDelete={
                    onDeleteTask ? () => onDeleteTask(task.id) : undefined
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
