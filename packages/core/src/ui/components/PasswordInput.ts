export interface PasswordInputProps {
  name: string;
  value: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showToggle?: boolean;
  error?: string;
  helperText?: string;
  onChange: (value: string) => void;
}
