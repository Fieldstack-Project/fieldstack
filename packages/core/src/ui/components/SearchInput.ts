export interface SearchInputProps {
  name: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
  onChange: (value: string) => void;
  onClear?: () => void;
}
