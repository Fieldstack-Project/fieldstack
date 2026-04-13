import { useState, type InputHTMLAttributes } from 'react';

export type PasswordStrength = 'weak' | 'fair' | 'strong';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrength?: boolean;
  error?: string;
}

function getStrength(value: string): PasswordStrength {
  if (value.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3 && value.length >= 12) return 'strong';
  if (score >= 2) return 'fair';
  return 'weak';
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: '취약',
  fair: '보통',
  strong: '강함',
};
const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak:   'var(--err)',
  fair:   'var(--warn)',
  strong: 'var(--ok)',
};
const STRENGTH_WIDTH: Record<PasswordStrength, string> = {
  weak:   '33%',
  fair:   '66%',
  strong: '100%',
};

export function PasswordInput({
  showStrength = false,
  error,
  className = '',
  id,
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && typeof value === 'string' && value.length > 0
    ? getStrength(value)
    : null;

  const classes = ['fs-input', error ? 'fs-input-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className="fs-input-wrap">
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={classes}
          style={{ paddingRight: 36 }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={props.autoComplete ?? 'current-password'}
        />
        <button
          type="button"
          className="fs-input-wrap-icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
          tabIndex={-1}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {strength && (
        <div style={{ marginTop: 4 }}>
          <div
            style={{
              height: 3,
              borderRadius: 999,
              background: 'var(--bg-hover)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: STRENGTH_WIDTH[strength],
                background: STRENGTH_COLOR[strength],
                borderRadius: 999,
                transition: 'width 260ms ease',
              }}
            />
          </div>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 11,
              color: STRENGTH_COLOR[strength],
            }}
          >
            {STRENGTH_LABEL[strength]}
          </p>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="fs-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
