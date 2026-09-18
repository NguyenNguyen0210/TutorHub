import React from 'react';
import { cn } from '@/lib/cn';

const FIELD_BASE =
  'w-full rounded-brand-md border bg-surface px-3 text-body-reg text-fg placeholder:text-fg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

const STATE_CLASS = {
  default: 'border-border focus-visible:ring-brand-primary-600',
  error: 'border-danger focus-visible:ring-danger',
};

export function Field({ label, htmlFor, hint, error, required, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-caption font-semibold text-fg-secondary mb-1.5 uppercase tracking-wide"
        >
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-caption text-danger-strong mt-1.5" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-caption text-fg-muted mt-1.5">{hint}</p>
      )}
    </div>
  );
}

const Input = React.forwardRef(function Input(
  { state = 'default', className, type = 'text', ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(FIELD_BASE, 'h-10', STATE_CLASS[state] || STATE_CLASS.default, className)}
      {...rest}
    />
  );
});

export default Input;

export const Textarea = React.forwardRef(function Textarea(
  { state = 'default', className, rows = 4, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        FIELD_BASE,
        'py-2 resize-none',
        STATE_CLASS[state] || STATE_CLASS.default,
        className
      )}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { state = 'default', className, children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        FIELD_BASE,
        'h-10 pr-8 cursor-pointer appearance-none bg-no-repeat',
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        'bg-[length:16px] bg-[position:right_0.75rem_center]',
        STATE_CLASS[state] || STATE_CLASS.default,
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export function Checkbox({ id, label, className, ...rest }) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 w-4 h-4 shrink-0 rounded border-border text-brand-primary-600 accent-brand-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 cursor-pointer"
        {...rest}
      />
      {label && (
        <label htmlFor={id} className="text-body-reg text-fg-secondary cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}

export function Radio({ id, name, value, label, checked, onChange, className, ...rest }) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 shrink-0 border-border text-brand-primary-600 accent-brand-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 cursor-pointer"
        {...rest}
      />
      {label && (
        <label htmlFor={id} className="text-body-reg text-fg-secondary cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}

export function Switch({ id, label, checked, onChange, className, ...rest }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2',
          checked ? 'bg-brand-primary-600' : 'bg-neutral-300'
        )}
        {...rest}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
          style={{ width: '1.125rem', height: '1.125rem' }}
        />
      </button>
      {label && (
        <label htmlFor={id} className="text-body-reg text-fg-secondary cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}
