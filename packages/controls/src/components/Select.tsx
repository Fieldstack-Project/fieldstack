import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({
  options,
  placeholder,
  error,
  className = '',
  id,
  ...props
}: SelectProps) {
  const classes = ['fs-select', error ? 'fs-select-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <select
        {...props}
        id={id}
        className={classes}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="fs-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
