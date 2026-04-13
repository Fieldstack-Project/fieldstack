import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, helpText, className = '', id, ...props }: InputProps,
  ref,
) {
  const classes = ['fs-input', error ? 'fs-input-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <input
        {...props}
        ref={ref}
        id={id}
        className={classes}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
      />
      {helpText && !error && (
        <p id={`${id}-help`} className="fs-field-help">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="fs-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
});
