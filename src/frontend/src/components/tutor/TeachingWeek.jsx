import React from 'react';
import { teachingWeek, shiftDay, vietnamDay } from '@/utils/tutorSchedule';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function TeachingWeek({ date, day, sessions, onChange }) {
  const days = teachingWeek(date);
  const today = vietnamDay();
  const label = value => value.split('-').reverse().join('/');
  return <section aria-label="Lịch giảng dạy theo tuần" className="overflow-hidden rounded-2xl border border-border bg-surface">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
      <h2 className="text-body-reg font-semibold text-fg">{label(days[0])} – {label(days[6])}</h2>
      <div className="flex items-center gap-1"><Button variant="ghost" aria-label="Tuần trước" onClick={() => onChange({ date: shiftDay(days[0], -7), day: null })}><Icon name="chevron_left" size="sm" /></Button><Button variant="outline" onClick={() => onChange({ date: today, day: null })}>Hôm nay</Button><Button variant="ghost" aria-label="Tuần sau" onClick={() => onChange({ date: shiftDay(days[0], 7), day: null })}><Icon name="chevron_right" size="sm" /></Button></div>
    </div>
    <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-7">{days.map((value, index) => {
      const items = sessions.filter(session => vietnamDay(session.startAt) === value);
      return <button type="button" key={value} aria-pressed={day === value} aria-label={`${label(value)}, ${items.length} buổi học`}
        onClick={() => onChange({ day: day === value ? null : value })}
        className={`min-h-32 space-y-2 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${day === value ? 'bg-brand-primary-50' : 'bg-surface hover:bg-neutral-50'}`}>
        <span className="block text-caption text-fg-secondary">{['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][index]}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold ${value === today ? 'bg-primary text-white' : 'text-fg'}`}>{value.slice(-2)}</span>
        <span className="block text-caption text-fg-secondary">{items.length ? `${items.length} buổi học` : 'Không có lịch'}</span>
      </button>;
    })}</div>
  </section>;
}
