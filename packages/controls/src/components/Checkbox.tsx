import { useEffect, useRef, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
}

export interface CheckboxGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function Checkbox({
  label,
  indeterminate = false,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={`fs-checkbox-wrap ${className}`} htmlFor={id}>
      <input {...props} ref={ref} type="checkbox" id={id} />
      {label && <span className="fs-checkbox-label">{label}</span>}
    </label>
  );
}

export function CheckboxGroup({ children, label, className = '' }: CheckboxGroupProps) {
  return (
    <fieldset
      className={`fs-checkbox-group ${className}`}
      style={{ border: 'none', margin: 0, padding: 0 }}
    >
      {label && (
        <legend className="fs-field-label" style={{ marginBottom: 8 }}>
          {label}
        </legend>
      )}
      {children}
    </fieldset>
  );
}
