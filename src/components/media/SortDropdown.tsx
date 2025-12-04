import React from "react";
import { ChevronDown } from "lucide-react";
import { Button, Dropdown } from "@/components/shared";
import type { DropdownOption } from "@/components/shared/ui/Dropdown";

export interface SortOption {
  id: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sortId: string) => void;
}

/**
 * Sort Dropdown Component
 * Uses the reusable Dropdown component for consistent behavior
 */
const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  activeSort,
  onSortChange,
}) => {
  const activeOption = options.find((opt) => opt.id === activeSort);

  // Convert SortOption[] to DropdownOption[]
  const dropdownOptions: DropdownOption[] = options.map((opt) => ({
    id: opt.id,
    label: opt.label,
  }));

  return (
    <Dropdown
      trigger={
        <Button
          variant="secondary"
          size="sm"
          icon={<ChevronDown className="w-4 h-4" />}
          iconPosition="right"
        >
          {activeOption?.label || "Sort"}
        </Button>
      }
      options={dropdownOptions}
      value={activeSort}
      onChange={(value) => onSortChange(value as string)}
      size="sm"
    />
  );
};

export default SortDropdown;
