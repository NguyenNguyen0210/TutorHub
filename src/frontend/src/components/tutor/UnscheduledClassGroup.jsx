import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { schedulingItem } from '@/utils/tutorSchedule';
import { formatDateTime } from '@/utils/formatters';
import { scheduleConflicts } from '@/utils/recurringSchedule';
import RecurringSchedulePlanner from './RecurringSchedulePlanner';
import { Progress } from '@/components/ui/Callout';

export default function UnscheduledClassGroup({ enrollment, open, onToggle, values, onChange, min, busy, busyKey, onSingle, onBatch, returnTo, existing = [] }) {
  const [mode, setMode] = useState('single');
  const [showAll, setShowAll] = useState(false);
  const selected = enrollment.unscheduledSessions.filter(session => values[session.id]).length;
  const duration = enrollment.sessionDurationMinutes || 60;
  const items = [], invalid = {};
  enrollment.unscheduledSessions.forEach(session => { if (values[session.id]) { try { items.push(schedulingItem(session.id, values[session.id], duration)); } catch { invalid[session.id] = 'Chọn ngày giờ hợp lệ.'; } } });
  const errors = { ...scheduleConflicts(items, existing), ...invalid };
  const scheduled = existing.filter(session => session.enrollmentId === enrollment.id && session.startAt && session.status !== 'Cancelled').length;
  return <details open={open} onToggle={event => { if (event.currentTarget.open !== open) onToggle(event.currentTarget.open); }}
    className="rounded-2xl border border-border bg-surface">
    <summary aria-label={`Lớp của ${enrollment.studentName || 'học viên'}: ${enrollment.unscheduledSessions.length} buổi chưa xếp lịch`} className="cursor-pointer rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
      <span className="ml-2 inline-flex max-w-[calc(100%_-_2rem)] align-top flex-col gap-3">
        <span className="flex items-center gap-3"><Avatar name={enrollment.studentName} /><span className="min-w-0"><span className="block font-semibold text-fg">{enrollment.studentName || 'Học viên'}</span><span className="mt-1 block text-caption text-fg-secondary">{enrollment.subjectName}</span></span></span>
        <span className="text-body-reg font-medium text-fg">{enrollment.serviceTitle || enrollment.subjectName}</span>
        <span className="flex flex-wrap items-center gap-3"><Badge variant="neutral">{enrollment.unscheduledSessions.length} buổi chưa xếp lịch</Badge><span className="text-caption text-fg-secondary">{duration} phút/buổi</span></span>
        <span className="space-y-2"><span className="block text-caption text-fg-secondary">{scheduled}/{enrollment.totalSessions} buổi đã có lịch</span><Progress value={enrollment.totalSessions ? scheduled / enrollment.totalSessions * 100 : 0} label="Tiến độ xếp lịch của lớp" /></span>
        <span className="text-caption font-medium text-primary">{open ? 'Thu gọn danh sách buổi học' : 'Xem các buổi chưa có lịch'}</span>
      </span>
    </summary>
    <div className="space-y-4 border-t border-border p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-caption leading-relaxed text-fg-secondary">Ưu tiên buổi #{enrollment.unscheduledSessions[0]?.sessionNumber}. Bạn có thể xếp từng buổi hoặc chỉ những buổi đã chọn thời gian.</p><Button variant="outline" as={Link} to={`/tutor/enrollments/${enrollment.id}`} size="sm">Xem lớp học</Button></div>
      <div className="flex flex-wrap gap-2" aria-label="Cách xếp lịch">{[['single', 'Xếp từng buổi'], ['weekly', 'Lịch lặp hàng tuần']].map(([key, label]) => <Button key={key} variant={mode === key ? 'primary' : 'outline'} aria-pressed={mode === key} disabled={busy} onClick={() => setMode(key)}>{label}</Button>)}</div>
      {mode === 'weekly' && <RecurringSchedulePlanner enrollment={enrollment} existing={existing} busy={busy} onApply={preview => { preview.forEach(item => onChange(item.id, item.local)); setMode('single'); setShowAll(true); }} />}
      {mode === 'single' && <>
      <ul className="divide-y divide-border">{(showAll ? enrollment.unscheduledSessions : enrollment.unscheduledSessions.slice(0, 3)).map(session => {
        const value = values[session.id] || '';
        let end = '';
        try { if (value) end = formatDateTime(schedulingItem(session.id, value, duration).endAt, 'HH:mm'); } catch { /* The submit handler explains invalid input. */ }
        return <li key={session.id} className="space-y-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-fg">Buổi #{session.sessionNumber}</span><Link to={`/tutor/sessions/${session.id}`} state={{ scheduleReturn: returnTo }} className="inline-flex min-h-11 items-center text-caption font-medium text-primary">Xem buổi học</Link></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-caption text-fg-secondary" htmlFor={`start-${session.id}`}>Bắt đầu (giờ Việt Nam)<input id={`start-${session.id}`} type="datetime-local" step={60} min={min} value={value} disabled={busy}
              onChange={event => onChange(session.id, event.target.value)} className="mt-2 h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-body-reg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <Button variant="outline" disabled={!value || Boolean(errors[session.id]) || busy} loading={busyKey === session.id} onClick={() => onSingle(session, duration)}>Xếp lịch</Button>
          </div>
          {end && <p className="text-caption text-fg-secondary">Kết thúc dự kiến: {end} · {duration} phút</p>}
          {errors[session.id] && <p role="alert" className="text-caption text-danger-strong">{errors[session.id]}</p>}
        </li>;
      })}</ul>
      {enrollment.unscheduledSessions.length > 3 && <Button variant="ghost" disabled={busy} onClick={() => setShowAll(value => !value)}>{showAll ? 'Thu gọn các buổi học' : `Xem thêm ${enrollment.unscheduledSessions.length - 3} buổi học`}</Button>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p aria-live="polite" className="text-caption text-fg-secondary">Đã chọn thời gian cho {selected} buổi.</p><Button disabled={!selected || busy} loading={busyKey === enrollment.id} onClick={() => Object.keys(errors).length ? document.getElementById(`start-${Object.keys(errors)[0]}`)?.focus() : onBatch(enrollment)}>{Object.keys(errors).length ? 'Kiểm tra xung đột' : selected ? `Xác nhận xếp ${selected} buổi` : 'Xếp lịch đã chọn'}</Button></div>
      </>}
    </div>
  </details>;
}
