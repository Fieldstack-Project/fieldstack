import { useEffect, type ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'fs-modal-sm',
  md: 'fs-modal-md',
  lg: 'fs-modal-lg',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fs-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'fs-modal-title' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`fs-modal ${SIZE_CLASS[size]} ${className}`}>
        {title && (
          <div className="fs-modal-header">
            <h2 className="fs-modal-title" id="fs-modal-title">
              {title}
            </h2>
            <button
              type="button"
              className="fs-modal-close"
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}
        <div className="fs-modal-body">{children}</div>
        {footer && <div className="fs-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
