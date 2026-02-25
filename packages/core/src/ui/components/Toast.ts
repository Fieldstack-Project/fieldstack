export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onClose?: (id: string) => void;
}
