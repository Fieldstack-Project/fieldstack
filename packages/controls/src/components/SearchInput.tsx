import { useEffect, useRef, type InputHTMLAttributes } from 'react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
  onClear?: () => void;
}

export function SearchInput({
  onSearch,
  debounceMs = 300,
  onClear,
  value,
  onChange,
  className = '',
  ...props
}: SearchInputProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onSearch || typeof value !== 'string') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs, onSearch]);

  const handleClear = () => {
    onClear?.();
    onSearch?.('');
  };

  return (
    <div className={`fs-search-wrap ${className}`}>
      <span className="fs-search-icon" aria-hidden="true">🔍</span>
      <input
        {...props}
        type="search"
        value={value}
        onChange={onChange}
        className="fs-input"
        style={{ paddingLeft: 32, paddingRight: value ? 30 : undefined }}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="fs-search-clear"
          onClick={handleClear}
          aria-label="검색어 지우기"
          tabIndex={-1}
        >
          ✕
        </button>
      )}
    </div>
  );
}
