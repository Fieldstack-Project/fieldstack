import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   'fs-btn-primary',
  secondary: '',
  danger:    'fs-btn-danger',
  ghost:     'fs-btn-ghost',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'fs-btn-sm',
  md: '',
  lg: 'fs-btn-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'fs-btn',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? 'fs-btn-block' : '',
    loading ? 'fs-btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="fs-btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
