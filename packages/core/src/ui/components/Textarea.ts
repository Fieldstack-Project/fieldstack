export interface TextareaProps {
  name: string;
  value: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange: (value: string) => void;
}
