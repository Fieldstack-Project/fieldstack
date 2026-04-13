// ─── P0 Controls ──────────────────────────────────────────────
export { Button } from './Button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.js';

export { Input } from './Input.js';
export type { InputProps } from './Input.js';

export { Select } from './Select.js';
export type { SelectProps, SelectOption } from './Select.js';

export { Checkbox, CheckboxGroup } from './Checkbox.js';
export type { CheckboxProps, CheckboxGroupProps } from './Checkbox.js';

export { RadioGroup } from './Radio.js';
export type { RadioGroupProps, RadioOption } from './Radio.js';

export { Switch } from './Switch.js';
export type { SwitchProps } from './Switch.js';

export { Modal } from './Modal.js';
export type { ModalProps, ModalSize } from './Modal.js';

export { FormField } from './FormField.js';
export type { FormFieldProps } from './FormField.js';

export { Alert } from './Alert.js';
export type { AlertProps, AlertVariant } from './Alert.js';

export { Progress, StepProgress } from './Progress.js';
export type { ProgressProps, StepProgressProps } from './Progress.js';

// ─── P0.5 Controls ────────────────────────────────────────────
export { Textarea } from './Textarea.js';
export type { TextareaProps } from './Textarea.js';

export { PasswordInput } from './PasswordInput.js';
export type { PasswordInputProps, PasswordStrength } from './PasswordInput.js';

export { OtpInput } from './OtpInput.js';
export type { OtpInputProps } from './OtpInput.js';

export { SearchInput } from './SearchInput.js';
export type { SearchInputProps } from './SearchInput.js';

export { Spinner } from './Spinner.js';
export type { SpinnerProps, SpinnerSize } from './Spinner.js';

export { ToastProvider, useToast } from './Toast.js';
export type { ToastItem, ToastVariant, ToastContextValue } from './Toast.js';

export { EmptyState } from './EmptyState.js';
export type { EmptyStateProps } from './EmptyState.js';

export { Skeleton } from './Skeleton.js';
export type { SkeletonProps } from './Skeleton.js';

// ─── Control Registry ─────────────────────────────────────────
export type ControlTier = 'p0' | 'p0_5' | 'p1' | 'p2';

export type ControlName =
  | 'alert'
  | 'button'
  | 'checkbox'
  | 'combobox'
  | 'empty-state'
  | 'form-field'
  | 'input'
  | 'modal'
  | 'otp-pin-input'
  | 'password-input'
  | 'progress'
  | 'radio'
  | 'search-input'
  | 'select'
  | 'skeleton'
  | 'spinner'
  | 'switch'
  | 'textarea'
  | 'toast';

export interface ControlDescriptor {
  name: ControlName;
  tier: ControlTier;
  ready: boolean;
}

export const CONTROL_DESCRIPTORS: ControlDescriptor[] = [
  { name: 'button',       tier: 'p0',   ready: true },
  { name: 'input',        tier: 'p0',   ready: true },
  { name: 'select',       tier: 'p0',   ready: true },
  { name: 'combobox',     tier: 'p0',   ready: false }, // Select로 단일 선택 커버, multi+create는 P1
  { name: 'checkbox',     tier: 'p0',   ready: true },
  { name: 'radio',        tier: 'p0',   ready: true },
  { name: 'switch',       tier: 'p0',   ready: true },
  { name: 'modal',        tier: 'p0',   ready: true },
  { name: 'form-field',   tier: 'p0',   ready: true },
  { name: 'alert',        tier: 'p0',   ready: true },
  { name: 'progress',     tier: 'p0',   ready: true },
  { name: 'textarea',     tier: 'p0_5', ready: true },
  { name: 'password-input', tier: 'p0_5', ready: true },
  { name: 'otp-pin-input',  tier: 'p0_5', ready: true },
  { name: 'search-input',   tier: 'p0_5', ready: true },
  { name: 'spinner',      tier: 'p0_5', ready: true },
  { name: 'toast',        tier: 'p0_5', ready: true },
  { name: 'empty-state',  tier: 'p0_5', ready: true },
  { name: 'skeleton',     tier: 'p0_5', ready: true },
];
