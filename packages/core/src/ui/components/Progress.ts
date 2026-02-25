export type ProgressVariant = "linear" | "steps";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  variant?: ProgressVariant;
  steps?: ProgressStep[];
}
