export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`fs-empty ${className}`}>
      {icon && (
        <span className="fs-empty-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="fs-empty-title">{title}</p>
      {description && <p className="fs-empty-desc">{description}</p>}
      {action && (
        <div className="fs-empty-action">
          <button
            type="button"
            className="fs-btn fs-btn-primary"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
