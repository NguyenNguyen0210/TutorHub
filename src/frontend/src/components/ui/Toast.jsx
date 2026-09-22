import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const ToastContext = createContext(null);

const VARIANT = {
  success: { icon: 'check_circle', cls: 'border-success/30 text-success-strong bg-success-subtle' },
  error: { icon: 'error', cls: 'border-danger/30 text-danger-strong bg-danger-subtle' },
  warning: { icon: 'info', cls: 'border-holding/30 text-holding-strong bg-holding-subtle' },
  info: { icon: 'info', cls: 'border-info/30 text-info bg-info-subtle' },
};

/**
 * ToastProvider — thay thế AntD `message`.
 * API: const toast = useToast(); toast.success('...'), toast.error('...'), toast.info/warning.
 * Lưu ý bất biến: chỉ gọi toast SAU khi promise resolve (không báo thành công trước).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, content, duration = 4000) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, content }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (msg, d) => push('success', msg, d),
      error: (msg, d) => push('error', msg, d),
      warning: (msg, d) => push('warning', msg, d),
      info: (msg, d) => push('info', msg, d),
      open: (msg, d) => push('info', msg, d),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
          role="region"
          aria-label="Thông báo hệ thống"
        >
          {toasts.map((t) => {
            const v = VARIANT[t.type] || VARIANT.info;
            return (
              <div
                key={t.id}
                role="status"
                aria-live="polite"
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-brand-md border px-4 py-3 shadow-brand-lg animate-fadeIn',
                  v.cls
                )}
              >
                <Icon name={v.icon} size="md" />
                <p className="text-body-reg font-medium flex-1">{t.content}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Đóng thông báo"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

const NOOP_TOAST = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  open: () => {},
  dismiss: () => {},
};

export function useToast() {
  return useContext(ToastContext) || NOOP_TOAST;
}

export default ToastProvider;
