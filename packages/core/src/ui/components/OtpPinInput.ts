export interface OtpPinInputProps {
  name: string;
  length: 4 | 6;
  value: string;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}
