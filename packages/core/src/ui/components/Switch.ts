export interface SwitchProps {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  onChange: (checked: boolean) => void;
}
