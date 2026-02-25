export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectMode = "single" | "multi";

export interface SelectProps {
  name: string;
  value: string | string[];
  options: SelectOption[];
  mode?: SelectMode;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string | string[]) => void;
}
