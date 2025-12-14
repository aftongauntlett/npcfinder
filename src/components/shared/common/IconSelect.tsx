import { useMemo } from "react";

import Select, { type SelectOption } from "@/components/shared/ui/Select";
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
  const formatLabel = useMemo(() => {
    const overrides: Record<string, string> = {
      CheckCircle: "Check",
      ListChecks: "Checklist",
      Gear: "Settings",
      FilmSlate: "Film",
      GameController: "Controller",
      MusicNote: "Music",
      BookOpen: "Book",
      BookBookmark: "Bookmark",
      Books: "Books",
      PianoKeys: "Piano",
      PenNib: "Pen",
      PaintBrush: "Paint",
      ShoppingCart: "Shopping",
    };

    return (name: string) => {
      if (overrides[name]) return overrides[name];
      return name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
    };
  }, []);

  const options = useMemo(() => {
    const base: SelectOption[] = (icons ?? []).map((opt) => {
      const Icon = opt.icon;
      return {
        value: opt.name,
        label: formatLabel(opt.name),
        leftIcon: (
          <Icon
            className="w-4 h-4"
            weight="regular"
            style={iconColor ? { color: iconColor } : undefined}
          />
        ),
      };
    });

    return [{ value: "", label: "None" }, ...base];
  }, [formatLabel, iconColor, icons]);

  const selectedOption = useMemo(() => {
    if (!selectedIcon) return null;
    return (icons ?? []).find((o) => o.name === selectedIcon) ?? null;
  }, [icons, selectedIcon]);

  const Icon = selectedOption?.icon ?? null;

  return (
    <Select
      id={id}
      label={label}
      value={selectedIcon ?? ""}
      onChange={(e) => onIconChange(e.target.value ? e.target.value : null)}
      options={options}
      disabled={disabled}
      leftIcon={
        Icon ? (
          <Icon
            className="w-5 h-5"
            weight="regular"
            style={iconColor ? { color: iconColor } : undefined}
          />
        ) : null
      }
      size="md"
    />
  );
}
