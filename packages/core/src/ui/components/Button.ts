export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  onClick: () => void;
}
