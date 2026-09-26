import React, { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tabs — điều hướng tab có kiểm soát a11y (role=tablist/tab/tabpanel).
 * `tabs`: [{ key, label, icon?, content }]
 */
export default function Tabs({ tabs = [], defaultKey, value, onChange, className }) {
  const [internal, setInternal] = useState(defaultKey ?? tabs[0]?.key);
  const active = value ?? internal;

  const select = (key) => {
    if (value === undefined) setInternal(key);
    if (onChange) onChange(key);
  };

  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => select(t.key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 rounded-t-brand-sm',
                isActive
                  ? 'border-brand-primary-600 text-brand-primary-700'
                  : 'border-transparent text-fg-secondary hover:text-fg hover:border-neutral-300'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div role="tabpanel" className="pt-4">
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
