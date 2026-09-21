import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const DialogContext = createContext(null);

/**
 * DialogProvider — thay thế AntD `Modal.confirm`.
 * `confirm()` trả về Promise<boolean> để giữ đúng luồng `await` cũ:
 *   const ok = await confirm({ title, content, confirmText, danger });
 */
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const resolveRef = useRef(null);

  const close = useCallback((result) => {
    setDialog(null);
    setReason('');
    setReasonError('');
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setReason(options.defaultReason || '');
        setReasonError('');
        setDialog({
          title: 'Xác nhận',
          content: null,
          confirmText: 'Xác nhận',
          cancelText: 'Hủy',
          danger: false,
          requireReason: false,
          reasonLabel: 'Lý do',
          reasonPlaceholder: 'Nhập lý do...',
          minReasonLength: 0,
          ...options,
        });
      }),
    []
  );

  const api = useMemo(() => ({ confirm, close }), [confirm, close]);

  const handleConfirm = () => {
    if (dialog?.requireReason) {
      const trimmed = reason.trim();
      const min = dialog.minReasonLength || 1;
      if (trimmed.length < min) {
        setReasonError(
          `Vui lòng nhập ${dialog.reasonLabel.toLowerCase()} (tối thiểu ${min} ký tự).`
        );
        return;
      }
      if (typeof dialog.onConfirmReason === 'function') dialog.onConfirmReason(trimmed);
      close(true);
      return;
    }
    close(true);
  };

  const handleCancel = () => close(false);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              className="absolute inset-0 bg-brand-navy-950/50 backdrop-blur-sm cursor-default"
              onClick={handleCancel}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={dialog.title}
              className="relative w-full max-w-md bg-surface rounded-brand-lg border border-border shadow-brand-xl p-6 animate-fadeIn"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-brand-md flex items-center justify-center shrink-0',
                    dialog.danger
                      ? 'bg-danger-subtle text-danger-strong'
                      : 'bg-brand-primary-50 text-brand-primary-600'
                  )}
                >
                  <Icon name={dialog.danger ? 'warning' : 'info'} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-headline-3 text-fg">{dialog.title}</h2>
                  {dialog.content && (
                    <div className="text-body-reg text-fg-secondary mt-1.5">{dialog.content}</div>
                  )}
                </div>
              </div>

              {dialog.requireReason && (
                <div className="mb-4">
                  <label
                    htmlFor="dialog-reason"
                    className="block text-caption font-semibold text-fg-secondary mb-1.5 uppercase tracking-wide"
                  >
                    {dialog.reasonLabel}
                  </label>
                  <textarea
                    id="dialog-reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (reasonError) setReasonError('');
                    }}
                    placeholder={dialog.reasonPlaceholder}
                    className="w-full rounded-brand-md border border-border bg-surface px-3 py-2 text-body-reg text-fg placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 resize-none"
                  />
                  {reasonError && (
                    <p className="text-caption text-danger-strong mt-1.5" role="alert">
                      {reasonError}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-10 px-4 rounded-brand-md border border-border bg-surface text-body-reg font-semibold text-fg-secondary hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
                >
                  {dialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={cn(
                    'h-10 px-4 rounded-brand-md text-body-reg font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    dialog.danger
                      ? 'bg-danger hover:bg-danger-strong focus-visible:ring-danger'
                      : 'bg-brand-primary-600 hover:bg-brand-primary-700 focus-visible:ring-brand-primary-600'
                  )}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </DialogContext.Provider>
  );
}

const NOOP_DIALOG = { confirm: async () => false, close: () => {} };

export function useDialog() {
  return useContext(DialogContext) || NOOP_DIALOG;
}

export function useConfirm() {
  return useDialog().confirm;
}

export default DialogProvider;
