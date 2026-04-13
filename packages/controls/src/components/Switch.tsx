export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className = '',
}: SwitchProps) {
  return (
    <label className={`fs-switch-wrap ${className}`} htmlFor={id}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-checked={checked}
      />
      <span className="fs-switch-track" aria-hidden="true">
        <span className="fs-switch-thumb" />
      </span>
      {label && <span className="fs-switch-label">{label}</span>}
    </label>
  );
}
