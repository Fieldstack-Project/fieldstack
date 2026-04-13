import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helpText?: string;
}

export function Textarea({ error, helpText, className = '', id, ...props }: TextareaProps) {
  const classes = ['fs-textarea', error ? 'fs-textarea-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <textarea
        {...props}
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
}
