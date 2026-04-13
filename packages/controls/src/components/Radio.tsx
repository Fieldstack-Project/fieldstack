export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset
      className={`fs-radio-group ${className}`}
      style={{ border: 'none', margin: 0, padding: 0 }}
    >
      {label && (
        <legend className="fs-field-label" style={{ marginBottom: 8 }}>
          {label}
        </legend>
      )}
      {options.map((opt) => (
        <label key={opt.value} className="fs-radio-wrap">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            disabled={opt.disabled}
            onChange={() => onChange?.(opt.value)}
          />
          <span className="fs-radio-label">{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
