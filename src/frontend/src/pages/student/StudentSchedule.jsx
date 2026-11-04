import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import sessionService from '@/services/session.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import StateBadge from '@/components/common/StateBadge';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';

const ZONE = 'Asia/Ho_Chi_Minh';
const weekStart = date => date.startOf('day').subtract((date.day() + 6) % 7, 'day');
const statuses = { all: 'Tất cả trạng thái', Scheduled: 'Đã xếp lịch', AwaitingPayout: 'Chờ giải ngân', Completed: 'Đã hoàn thành', Cancelled: 'Đã hủy', Unscheduled: 'Chưa xếp lịch' };

export default function StudentSchedule() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const mode = params.get('view') === 'month' ? 'month' : 'week';
  const rawDate = params.get('date');
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && dayjs(rawDate).format('YYYY-MM-DD') === rawDate
    ? dayjs.tz(rawDate, ZONE) : dayjs().tz(ZONE);
  const status = Object.hasOwn(statuses, params.get('status')) ? params.get('status') : 'all';
  const start = mode === 'month' ? date.startOf('month') : weekStart(date);
  const end = mode === 'month' ? date.endOf('month') : start.add(6, 'day').endOf('day');
  const rawDay = params.get('day');
  const selectedDay = rawDay && /^\d{4}-\d{2}-\d{2}$/.test(rawDay) && dayjs(rawDay).format('YYYY-MM-DD') === rawDay && rawDay >= start.format('YYYY-MM-DD') && rawDay <= end.format('YYYY-MM-DD') ? rawDay : null;
  const fromDate = start.toISOString();
  const toDate = end.toISOString();
  const query = useQuery({
    staleTime: 0,
    queryKey: ['student-schedule', user?.id, status, fromDate, toDate],
    queryFn: () => sessionService.getMySessions({
      ...(status !== 'Unscheduled' ? { fromDate, toDate } : {}),
      ...(status !== 'all' ? { status } : {}),
    }),
  });
  const change = changes => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (!Object.hasOwn(changes, 'day')) next.delete('day');
      Object.entries(changes).forEach(([key, value]) => value == null ? next.delete(key) : next.set(key, value));
      return next;
    });
  };
  const calendarStart = mode === 'month' ? weekStart(start) : start;
  const dayCount = mode === 'month' ? Math.ceil((end.startOf('day').diff(calendarStart, 'day') + 1) / 7) * 7 : 7;
  const sessions = [...(query.data || [])].sort((a, b) => (a.startAt || '').localeCompare(b.startAt || '') || a.sessionNumber - b.sessionNumber);
  const items = selectedDay && status !== 'Unscheduled' ? sessions.filter(item => formatDateTime(item.startAt, 'YYYY-MM-DD') === selectedDay) : sessions;

  return <div className="mx-auto max-w-[1200px] space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-headline-page text-fg">Lịch học của tôi</h1><p className="mt-2 text-body-reg text-fg-secondary">Theo dõi buổi học của tất cả các lớp trong cùng một lịch.</p></div><Button as={Link} to="/student/dashboard" variant="outline">Xem lớp học</Button></header>
    <section aria-label="Bộ lọc lịch học" className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">{[['week', 'Tuần'], ['month', 'Tháng']].map(([value, label]) => <Button key={value} variant={mode === value ? 'primary' : 'ghost'} aria-pressed={mode === value} onClick={() => change({ view: value })}>{label}</Button>)}</div>
      <label className="sr-only" htmlFor="schedule-status">Trạng thái buổi học</label><select id="schedule-status" value={status} onChange={e => change({ status: e.target.value })} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </section>
    {status !== 'Unscheduled' && <section className="overflow-hidden rounded-2xl border border-border bg-surface" aria-label="Lịch buổi học">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5"><h2 className="font-semibold text-fg">{mode === 'month' ? `Tháng ${date.format('MM/YYYY')}` : `${start.format('DD/MM')} – ${end.format('DD/MM/YYYY')}`}</h2><div className="flex gap-2"><Button variant="outline" aria-label={mode === 'month' ? 'Tháng trước' : 'Tuần trước'} onClick={() => change({ date: date.subtract(1, mode).format('YYYY-MM-DD') })}><Icon name="chevron_left" size="sm" /></Button><Button variant="outline" onClick={() => change({ date: dayjs().tz(ZONE).format('YYYY-MM-DD') })}>Hôm nay</Button><Button variant="outline" aria-label={mode === 'month' ? 'Tháng sau' : 'Tuần sau'} onClick={() => change({ date: date.add(1, mode).format('YYYY-MM-DD') })}><Icon name="chevron_right" size="sm" /></Button></div></div>
      <div className="grid grid-cols-7 bg-neutral-50 text-center text-xs text-fg-secondary">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day} className="py-3">{day}</span>)}</div>
      <div className="grid grid-cols-7">{Array.from({ length: dayCount }, (_, i) => {
        const day = calendarStart.add(i, 'day');
        const key = day.format('YYYY-MM-DD');
        const count = sessions.filter(item => item.startAt && formatDateTime(item.startAt, 'YYYY-MM-DD') === key).length;
        const outside = day.isBefore(start, 'day') || day.isAfter(end, 'day');
        return <button key={key} type="button" disabled={outside} onClick={() => change({ day: key })} aria-pressed={selectedDay === key} aria-label={`${day.format('DD/MM/YYYY')}, ${query.isPending ? 'đang tải lịch' : `${count} buổi học`}`} aria-current={key === dayjs().tz(ZONE).format('YYYY-MM-DD') ? 'date' : undefined} className={cn('flex min-h-20 min-w-0 flex-col items-center gap-2 border-t border-border px-1 py-3 text-sm focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-24', outside ? 'bg-neutral-50 text-fg-muted' : selectedDay === key ? 'bg-brand-primary-50 text-primary' : 'text-fg hover:bg-neutral-50')}><span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full', key === dayjs().tz(ZONE).format('YYYY-MM-DD') && 'bg-primary font-semibold text-white')}>{day.date()}</span>{count > 0 && <span className="rounded-md bg-brand-primary-50 px-1 text-[10px] font-medium text-primary sm:px-2 sm:text-xs">{count}<span className="hidden sm:inline"> buổi</span></span>}</button>;
      })}</div>
    </section>}
    <section aria-labelledby="schedule-list-title" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="schedule-list-title" className="text-lg font-semibold text-fg">{status === 'Unscheduled' ? 'Buổi học chờ xếp lịch' : selectedDay ? `Buổi học ngày ${dayjs(selectedDay).format('DD/MM/YYYY')}` : 'Buổi học trong kỳ'}</h2>{selectedDay && <Button variant="ghost" onClick={() => change({ day: null })}>Xem cả {mode === 'month' ? 'tháng' : 'tuần'}</Button>}</div>
      {query.isPending ? <DetailSkeleton /> : query.isError ? <ErrorState title="Không thể tải lịch học" error={query.error} onRetry={query.refetch} /> : items.length === 0 ? <EmptyState icon="calendar_month" title={status === 'Unscheduled' ? 'Không có buổi học chờ xếp lịch' : 'Chưa có buổi học trong khoảng này'} description="Bạn có thể xem khoảng thời gian khác hoặc mở lớp học để trao đổi lịch với gia sư." actionLabel="Xem lớp học của tôi" actionPath="/student/dashboard" /> : <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{items.map(item => <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-caption font-medium text-primary">{item.startAt ? formatDateTime(item.startAt) : 'Chờ thống nhất lịch học'}</p><h3 className="mt-2 font-semibold text-fg">{item.subjectName} · Buổi {item.sessionNumber}</h3><p className="mt-1 text-sm text-fg-secondary">Gia sư: {item.tutorName}{item.durationMinutes > 0 ? ` · ${item.durationMinutes} phút` : ''}</p></div><div className="flex flex-wrap items-center gap-3"><StateBadge status={item.status} /><Button as={Link} to={`/student/sessions/${item.id}`} variant="outline">Xem buổi học</Button></div></article>)}</div>}
    </section>
  </div>;
}
