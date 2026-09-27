import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { STEPS } from './applicationFormUtils';

/**
 * ApplicationStepper — stepper dọc của wizard hồ sơ gia sư.
 *
 * Quy tắc bất biến: một bước chỉ bấm được khi nó đã hoàn tất (`isDone`) hoặc là
 * bước 1. `onSelect` chỉ được gọi trong đúng 2 trường hợp đó.
 */
export default function ApplicationStepper({ currentStep, onSelect }) {
  return (
    <nav aria-label="Các bước đăng ký" className="relative pl-1">
      {/* Connecting line */}
      <div
        className="absolute left-[19px] top-4 bottom-8 w-[2px] bg-border -z-0"
        aria-hidden="true"
      />

      <ol className="space-y-3 relative z-10">
        {STEPS.map((s) => {
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  // Allow clicking completed steps or step 1
                  if (isDone || s.id === 1) onSelect(s.id);
                }}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'w-full flex items-center gap-3.5 p-2 rounded-brand-lg text-left transition-all cursor-pointer',
                  isActive
                    ? 'bg-brand-primary-50 border border-brand-primary-100 shadow-brand-sm'
                    : 'border border-transparent hover:bg-neutral-100'
                )}
              >
                {/* Circle Indicator */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-caption font-bold shrink-0 transition-all',
                    isActive
                      ? 'bg-brand-primary-600 text-white shadow-brand-sm ring-4 ring-brand-primary-100'
                      : isDone
                        ? 'bg-brand-primary-600 text-white'
                        : 'bg-surface border-2 border-border text-fg-muted'
                  )}
                >
                  {isDone ? <Icon name="check" size="xs" /> : s.id}
                </span>

                {/* Step title & subtitle */}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-caption font-bold leading-snug truncate',
                      isActive ? 'text-brand-primary-700' : isDone ? 'text-fg' : 'text-fg-secondary'
                    )}
                  >
                    {s.title}
                  </span>
                  <span
                    className={cn(
                      'block text-[11px] truncate hidden lg:block',
                      isActive ? 'text-brand-primary-600 font-medium' : 'text-fg-muted'
                    )}
                  >
                    {s.sub}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

ApplicationStepper.propTypes = {
  currentStep: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
};

/** SupportCard — ô "Cần hỗ trợ?" đặt dưới stepper. */
export function SupportCard() {
  return (
    <div className="p-4 rounded-brand-lg bg-brand-primary-50 border border-brand-primary-100 flex items-start gap-3.5">
      <span className="w-10 h-10 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center shrink-0">
        <Icon name="support_agent" size="md" />
      </span>
      <div className="space-y-0.5 min-w-0">
        <span className="font-bold text-fg text-caption block">Cần hỗ trợ?</span>
        <p className="text-caption text-fg-muted">Liên hệ đội ngũ TutorHub</p>
        <a
          href="mailto:support@tutorhub.vn"
          className="text-caption font-medium text-brand-primary-700 hover:underline block truncate"
        >
          support@tutorhub.vn
        </a>
      </div>
    </div>
  );
}
