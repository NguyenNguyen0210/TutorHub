import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '@/utils/formatters';
import { sessionTime } from '@/utils/tutorSchedule';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';

export default function TeachingSessionCard({ session, returnTo, now, past = false }) {
  const current = sessionTime(session.startAt) <= now && !past;
  return <Link to={`/tutor/sessions/${session.id}`} state={{ scheduleReturn: returnTo }}
    aria-label={`Xem buổi học ${session.sessionNumber} của ${session.studentName || 'học viên'}`}
    className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:p-6">
    <div className="flex items-center gap-4 sm:items-start">
      <div aria-hidden="true" className="flex w-20 shrink-0 flex-col items-center rounded-xl bg-brand-primary-50 px-2 py-3 text-brand-primary-700">
        <span className="text-caption font-medium">{formatDateTime(session.startAt, 'ddd')}</span>
        <span className="my-1 text-3xl font-semibold tabular-nums">{formatDateTime(session.startAt, 'DD')}</span>
        <span className="text-[11px]">{formatDateTime(session.startAt, 'MM/YYYY')}</span>
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-lg font-semibold tabular-nums text-primary">{formatDateTime(session.startAt, 'HH:mm')}{session.endAt ? ` – ${formatDateTime(session.endAt, 'HH:mm')}` : ''}</p>
        <p className="text-caption text-fg-secondary">{formatDateTime(session.startAt, 'DD/MM/YYYY')} · Giờ Việt Nam</p>
        <h3 className="text-body-reg font-semibold text-fg">{session.studentName || 'Học viên'}</h3>
        <p className="text-body-reg text-fg-secondary">Buổi #{session.sessionNumber}{session.subjectName ? ` · ${session.subjectName}` : ''}</p>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 sm:ml-auto sm:shrink-0 sm:flex-col sm:items-end">
      <Badge variant={past ? 'holding' : 'primary'}>{past ? 'Đã qua giờ học' : current ? 'Theo lịch hiện tại' : 'Đã xếp lịch'}</Badge>
      <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Xem buổi học<Icon name="arrow_forward" size="sm" /></span>
    </div>
  </Link>;
}
