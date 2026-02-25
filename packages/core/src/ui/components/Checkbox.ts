export interface CheckboxProps {
  name: string;
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}

export interface CheckboxGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  name: string;
  values: string[];
  options: CheckboxGroupOption[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}
