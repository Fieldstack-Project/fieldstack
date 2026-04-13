import type { ReactNode } from 'react';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const ICONS: Record<AlertVariant, string> = {
  success: '✓',
  warning: '⚠',
  error:   '✕',
  info:    'ℹ',
};

export function Alert({
  variant,
  title,
  children,
  onClose,
  className = '',
}: AlertProps) {
  return (
    <div
      className={`fs-alert fs-alert-${variant} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className="fs-alert-icon" aria-hidden="true">
        {ICONS[variant]}
      </span>
      <div className="fs-alert-body">
        {title && <p className="fs-alert-title">{title}</p>}
        <p className="fs-alert-msg">{children}</p>
      </div>
      {onClose && (
        <button
          type="button"
          className="fs-alert-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
      )}
    </div>
  );
}
