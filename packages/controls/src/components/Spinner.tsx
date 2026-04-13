export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  blocking?: boolean;
  className?: string;
}

export function Spinner({ size = 'md', label, blocking = false, className = '' }: SpinnerProps) {
  const spinnerEl = (
    <span
      className={`fs-spinner fs-spinner-${size} ${className}`}
      role="status"
      aria-label={label ?? '로딩 중'}
    />
  );

  if (blocking) {
    return (
      <div className="fs-spinner-overlay" aria-live="polite" aria-busy="true">
        <span className={`fs-spinner fs-spinner-${size}`} aria-hidden="true" />
        {label && <span>{label}</span>}
      </div>
    );
  }

  if (label) {
    return (
      <div className="fs-spinner-inline" aria-live="polite" aria-busy="true">
        {spinnerEl}
        <span>{label}</span>
      </div>
    );
  }

  return spinnerEl;
}
