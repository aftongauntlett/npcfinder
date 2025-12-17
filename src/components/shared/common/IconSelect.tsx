import type { IconOption } from "@/utils/taskIcons";

interface IconSelectProps {
  id: string;
  label?: string;
  selectedIcon: string | null;
  onIconChange: (icon: string | null) => void;
  icons?: IconOption[];
  iconColor?: string;
  disabled?: boolean;
}

export default function IconSelect({
  id,
  label,
  selectedIcon,
  onIconChange,
  icons,
  iconColor,
  disabled,
}: IconSelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-primary mb-2">
          {label}
        </label>
      )}
      <div className="grid grid-cols-8 gap-2">
        {/* Icon options */}
        {(icons ?? []).map((iconOption) => {
          const Icon = iconOption.icon;
          const isSelected = selectedIcon === iconOption.name;
          
          return (
            <button
              key={iconOption.name}
              type="button"
              onClick={() => onIconChange(iconOption.name)}
              disabled={disabled}
              className={`
                aspect-square rounded-lg border-2 transition-all flex items-center justify-center
                ${
                  isSelected
                    ? "border-current bg-gray-100 dark:bg-gray-800"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={isSelected && iconColor ? { borderColor: iconColor } : undefined}
              title={iconOption.name}
            >
              <Icon
                className="w-5 h-5"
                weight="regular"
                style={iconColor ? { color: iconColor } : undefined}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
