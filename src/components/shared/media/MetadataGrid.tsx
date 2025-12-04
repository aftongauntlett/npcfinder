export interface MetadataGridItem {
  label: string;
  value: string | number | null | undefined;
  hidden?: boolean;
}

interface MetadataGridProps {
  items: MetadataGridItem[];
  columns?: 2 | 3;
  className?: string;
}

/**
 * MetadataGrid - Compact grid layout for displaying metadata stats
 *
 * Displays label/value pairs in a responsive grid (2 or 3 columns).
 * Used for ratings, awards, box office, publication info, etc.
 *
 * @param items - Array of metadata items with label and value
 * @param columns - Number of columns (default: 3)
 * @param className - Additional classes
 */
export default function MetadataGrid({
  items,
  columns = 3,
  className = "",
}: MetadataGridProps) {
  // Filter out items with no value or hidden items
  const visibleItems = items.filter(
    (item) =>
      !item.hidden &&
      item.value !== null &&
      item.value !== undefined &&
      item.value !== ""
  );

  if (visibleItems.length === 0) {
    return null;
  }

  const gridClass =
    columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {visibleItems.map((item, index) => (
        <div key={`${item.label}-${index}`} className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
            {item.label}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
