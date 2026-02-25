export type AlertVariant = "success" | "warning" | "error" | "info";

export interface AlertAction {
  label: string;
  onClick: () => void;
}

export interface AlertProps {
  title?: string;
  message: string;
  variant?: AlertVariant;
  closable?: boolean;
  action?: AlertAction;
  onClose?: () => void;
}
