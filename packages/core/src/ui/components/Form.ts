export interface FormProps {
  id: string;
  disabled?: boolean;
  onSubmit: () => Promise<void>;
}
