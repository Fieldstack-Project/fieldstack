export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  onClick: () => void;
}
