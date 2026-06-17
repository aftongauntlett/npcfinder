import { PLAYLIST_ICONS } from "./playlistIconOptions";

interface PlaylistIconPickerProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function PlaylistIconPicker({
  value,
  onChange,
  disabled,
}: PlaylistIconPickerProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {PLAYLIST_ICONS.map(({ id, label, Icon }) => {
        const isSelected = value === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={[
              "flex items-center justify-center rounded-lg p-2 transition-colors",
              isSelected
                ? "bg-primary/15 dark:bg-primary-light/15 text-primary dark:text-primary-light ring-1 ring-primary/40 dark:ring-primary-light/40"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
