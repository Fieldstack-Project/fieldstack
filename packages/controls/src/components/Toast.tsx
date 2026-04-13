import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  warning: '⚠',
  error:   '✕',
  info:    'ℹ',
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

let _idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `toast-${++_idCounter}`;
      const duration = item.duration ?? 4000;
      setItems((prev) => [...prev, { ...item, id }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fs-toast-region" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div
            key={item.id}
            className={`fs-toast fs-toast-${item.variant}`}
            role={item.variant === 'error' ? 'alert' : 'status'}
          >
            <span className="fs-toast-icon" aria-hidden="true">
              {ICONS[item.variant]}
            </span>
            <div className="fs-toast-body">
              {item.title && <p className="fs-toast-title">{item.title}</p>}
              <p className="fs-toast-msg">{item.message}</p>
            </div>
            <button
              type="button"
              className="fs-toast-close"
              onClick={() => dismiss(item.id)}
              aria-label="알림 닫기"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
