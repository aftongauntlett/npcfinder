/**
 * useGroceryListFiltering Hook
 *
 * Extracts grocery list filtering, sorting, and grouping logic.
 * Simplifies GroceryListView by moving repeated useMemo logic into a reusable hook.
 */

import { useMemo } from "react";
import { GROCERY_CATEGORIES } from "../utils/taskConstants";
import type { Task } from "../services/tasksService.types";

export interface GroceryListGroups {
  itemsByCategory: Map<string, Task[]>;
  needToBuy: Task[];
  purchased: Task[];
  needToBuyCount: number;
  purchasedCount: number;
}

export interface GroceryListFilters {
  categoryFilters: string[];
  sortBy: "category" | "name";
}

/**
 * Filter and group grocery list tasks
 *
 * @param tasks - Array of tasks from the grocery board
 * @param filters - Category filters and sort preference
 * @returns Grouped tasks, filtered lists, and counts
 */
export function useGroceryListFiltering(
  tasks: Task[],
  filters: GroceryListFilters
): GroceryListGroups {
  const { categoryFilters, sortBy } = filters;

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

  return {
    itemsByCategory,
    needToBuy,
    purchased,
    needToBuyCount: needToBuy.length,
    purchasedCount: purchased.length,
  };
}
