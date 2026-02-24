export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  name: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}
