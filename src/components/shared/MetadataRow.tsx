import { LucideIcon } from "lucide-react";

export interface MetadataItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hidden?: boolean;
}

interface MetadataRowProps {
  items: MetadataItem[];
  size?: "sm" | "md";
  className?: string;
}

export default function MetadataRow({
  items,
  size = "md",
  className = "",
}: MetadataRowProps) {
  const textSizeClass = size === "sm" ? "text-sm" : "text-base";
  const iconSizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

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

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {visibleItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <Icon
              className={`${iconSizeClass} text-gray-600 dark:text-gray-400`}
              aria-hidden="true"
            />
            <span
              className={`${textSizeClass} text-gray-600 dark:text-gray-400`}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
