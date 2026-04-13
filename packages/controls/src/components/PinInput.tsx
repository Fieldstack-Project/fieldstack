import { useRef } from 'react';

export interface PinInputProps {
  length?: 4 | 6;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function PinInput({
  length = 4,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(sanitized);
  };

  return (
    <div className={`fs-pin-wrap ${className}`}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        className={['fs-pin-input', error ? 'fs-pin-input-error' : ''].filter(Boolean).join(' ')}
        value={value}
        onChange={handleChange}
        maxLength={length}
        disabled={disabled}
        autoComplete="off"
        aria-label="PIN 입력"
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p className="fs-pin-error" role="alert">{error}</p>
      )}
    </div>
  );
}
