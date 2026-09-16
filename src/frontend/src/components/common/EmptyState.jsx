import React from 'react';
import { Link } from 'react-router-dom';

/**
 * P4: Empty state component per DESIGN §5.
 * "Treat failure and emptiness as moments for direction, not mood. An empty screen is an invitation to act."
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin để hiển thị tại mục này.',
  actionLabel,
  actionPath,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-indigo-50 border border-brand-indigo-100 flex items-center justify-center text-brand-indigo-600">
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed m-0">{description}</p>
      </div>

      {(actionLabel && (actionPath || onAction)) && (
        <div className="pt-2">
          {actionPath ? (
            <Link
              to={actionPath}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
