import type { SelectOption } from "./Select";

export interface ComboBoxProps {
  name: string;
  value: string | string[];
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  allowCreate?: boolean;
  disabled?: boolean;
  onChange: (value: string | string[]) => void;
  onSearchChange?: (query: string) => void;
}
