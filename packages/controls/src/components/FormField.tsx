import type { ReactNode } from 'react';

export interface FormFieldProps {
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  helpText,
  error,
  required = false,
  children,
  className = '',
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={`fs-field ${className}`}>
      {label && (
        <label className="fs-field-label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="fs-field-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {helpText && !error && <p className="fs-field-help">{helpText}</p>}
      {error && (
        <p className="fs-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
