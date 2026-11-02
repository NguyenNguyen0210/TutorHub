import React from 'react';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';

export function ServiceTrialBadge() {
  return <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--course-trial-border))] bg-[rgb(var(--course-trial-subtle))] px-2.5 py-1 text-caption font-medium text-[rgb(var(--course-trial-strong))]" title="Gói học có nội dung học thử">
    <Icon name="play_arrow" size="xs" />Học thử
  </span>;
}

export function ServiceLessonChips({ totalSessions, sessionDurationMinutes }) {
  const sessions = Number(totalSessions);
  const duration = Number(sessionDurationMinutes);
  return <div className="flex flex-wrap gap-2 text-caption text-fg-secondary">
    {sessions > 0 && Number.isFinite(sessions) && <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-2.5 py-1.5"><Icon name="calendar_month" size="sm" className="text-primary" />{sessions} buổi</span>}
    {duration > 0 && Number.isFinite(duration) && <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-2.5 py-1.5"><Icon name="schedule" size="sm" className="text-primary" />{duration} phút/buổi</span>}
  </div>;
}

/** Derived comparison price only; no per-session purchase or payment is implied. */
export function ServicePricing({ price, totalSessions, children }) {
  const total = Number(price);
  const sessions = Number(totalSessions);
  const hasPrice = Number.isFinite(total) && total > 0;
  const perSession = hasPrice && Number.isFinite(sessions) && sessions > 0 ? total / sessions : null;
  return <div className="space-y-4">
    {perSession !== null && <div className="rounded-xl border border-[rgb(var(--course-price-border))] bg-[rgb(var(--course-price-subtle))] p-4">
      <p className="text-caption font-medium text-[rgb(var(--course-price-strong))]">Chi phí quy đổi mỗi buổi</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[24px] font-semibold leading-tight text-[rgb(var(--course-price-strong))]">
        <span>{!Number.isInteger(perSession) && <span aria-label="xấp xỉ">≈ </span>}<Money value={Math.round(perSession)} /></span>
        <span className="text-caption font-normal">/ buổi</span>
      </p>
    </div>}
    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
      <div className="min-w-0">
        <p className="text-caption text-fg-secondary">Tổng học phí gói</p>
        {hasPrice ? <p className="mt-1 text-[20px] font-semibold text-fg"><Money value={total} /></p>
          : <p className="mt-1 text-body-reg font-medium text-fg">Xem trong gói học</p>}
      </div>
      {children}
    </div>
  </div>;
}
