import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const SIZE_CLASS = {
  sm: 'w-8 h-8 text-caption',
  md: 'w-10 h-10 text-body-reg',
  lg: 'w-14 h-14 text-headline-3',
  xl: 'w-20 h-20 text-headline-1',
};

/**
 * Avatar — ảnh đại diện với fallback chữ cái đầu khi ảnh lỗi/không có.
 */
export default function Avatar({ src, name, size = 'md', className, ...rest }) {
  const [broken, setBroken] = useState(false);
  const showImage = src && !broken;
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden bg-brand-primary-50 text-brand-primary-700 font-bold shrink-0 border border-border',
        SIZE_CLASS[size] || SIZE_CLASS.md,
        className
      )}
      {...rest}
    >
      {showImage ? (
        // `onError` KHÔNG phải tương tác người dùng — nó là phản ứng với việc ảnh
        // hỏng, nên `no-noninteractive-element-interactions` báo nhầm. Cách duy
        // nhất khác là đi qua ref/callback, thêm code mà không thêm được gì:
        // `<img onError>` là cách chuẩn của React và không mở ra tương tác nào.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <img
          src={src}
          alt={name || 'Ảnh đại diện'}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

/**
 * Menu — dropdown tuỳ biến, đóng khi click ngoài / nhấn Escape.
 * `items`: [{ key, label, icon?, danger?, onClick } | { type: 'divider' }]
 */
export function Menu({ trigger, items = [], align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex"
      >
        {trigger}
      </div>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-2 z-50 min-w-[200px] bg-surface border border-border rounded-brand-md shadow-brand-lg py-1.5 animate-fadeIn',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={`d-${idx}`} className="my-1.5 h-px bg-border" role="separator" />;
            }
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (item.onClick) item.onClick();
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2 text-body-reg text-left transition-colors',
                  item.danger
                    ? 'text-danger-strong hover:bg-danger-subtle'
                    : 'text-fg-secondary hover:bg-neutral-100 hover:text-fg'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Drawer — panel trượt từ cạnh màn hình, dùng cho mobile nav và bộ lọc.
 */
export function Drawer({ open, onClose, side = 'left', title, widthClass = 'w-80', children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Đóng bảng điều hướng"
        className="absolute inset-0 bg-brand-navy-950/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bảng điều hướng'}
        className={cn(
          'absolute top-0 bottom-0 bg-surface shadow-brand-xl flex flex-col max-w-[85vw]',
          widthClass,
          side === 'left' ? 'left-0' : 'right-0'
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-border shrink-0">
          <h2 className="text-headline-3 text-fg truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-brand-md flex items-center justify-center text-fg-muted hover:bg-neutral-100 transition-colors"
          >
            <Icon name="close" size="md" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>,
    document.body
  );
}

/**
 * Modal — hộp thoại trung tâm có kiểm soát focus/escape.
 */
export function Modal({ open, onClose, title, footer, size = 'md', children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 bg-brand-navy-950/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-surface rounded-brand-lg border border-border shadow-brand-xl animate-fadeIn max-h-[90vh] flex flex-col',
          sizeCls
        )}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-headline-3 text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-brand-md flex items-center justify-center text-fg-muted hover:bg-neutral-100 transition-colors"
          >
            <Icon name="close" size="md" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
