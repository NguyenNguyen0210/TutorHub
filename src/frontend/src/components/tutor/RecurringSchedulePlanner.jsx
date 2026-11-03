import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import { recurringDates, scheduleConflicts } from '@/utils/recurringSchedule';
import { schedulingItem, vietnamDay } from '@/utils/tutorSchedule';
import { formatDateTime } from '@/utils/formatters';

export default function RecurringSchedulePlanner({ enrollment, existing, drafts = [], busy, onApply }) {
  const [days, setDays] = useState([2, 5]);
  const [start, setStart] = useState(vietnamDay());
  const [time, setTime] = useState('18:00');
  const [count, setCount] = useState(Math.min(4, enrollment.unscheduledSessions.length));
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const generate = () => {
    const dates = recurringDates(start, time, days, Number(count));
    if (!dates.length || Number(count) > enrollment.unscheduledSessions.length) { setError('Chọn ngày bắt đầu, giờ học, ít nhất một ngày trong tuần và số buổi hợp lệ.'); return; }
    setPreview(enrollment.unscheduledSessions.slice(0, Number(count)).map((session, index) => ({ ...session, local: dates[index] })));
    setError('');
  };
  const items = [], invalid = {};
  (preview || []).forEach(session => { try { items.push(schedulingItem(session.id, session.local, enrollment.sessionDurationMinutes)); } catch { invalid[session.id] = 'Chọn ngày giờ hợp lệ.'; } });
  // Generated dates replace only their own drafts; other classes still reserve their selected time.
  const otherDrafts = drafts.filter(item => !(preview || []).some(session => session.id === item.sessionId));
  const conflicts = { ...scheduleConflicts(items, existing, Date.now(), otherDrafts), ...invalid };
  return <div className="space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-5">
    <div><h3 className="font-semibold text-fg">Lịch lặp hàng tuần</h3><p className="mt-2 text-caption leading-relaxed text-fg-secondary">Tạo lịch dự kiến, kiểm tra từng buổi rồi xác nhận. Các buổi đã xếp lịch không bị thay đổi.</p></div>
    <fieldset disabled={busy} className="space-y-4"><legend className="mb-3 text-sm font-medium text-fg">Ngày học trong tuần</legend><div className="flex flex-wrap gap-2">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, index) => <Button key={label} variant={days.includes(index+1) ? 'primary' : 'outline'} aria-pressed={days.includes(index+1)} onClick={() => { setDays(previous => previous.includes(index+1) ? previous.filter(day => day !== index+1) : [...previous, index+1]); setPreview(null); }}>{label}</Button>)}</div>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Bắt đầu từ ngày" htmlFor={`repeat-start-${enrollment.id}`}><Input id={`repeat-start-${enrollment.id}`} type="date" min={vietnamDay()} value={start} onChange={event => { setStart(event.target.value); setPreview(null); }} /></Field><Field label="Giờ học (UTC+7)" htmlFor={`repeat-time-${enrollment.id}`}><Input id={`repeat-time-${enrollment.id}`} type="time" value={time} onChange={event => { setTime(event.target.value); setPreview(null); }} /></Field><Field label="Số buổi muốn xếp" htmlFor={`repeat-count-${enrollment.id}`}><Input id={`repeat-count-${enrollment.id}`} type="number" min={1} max={Math.min(100, enrollment.unscheduledSessions.length)} value={count} onChange={event => { setCount(event.target.value); setPreview(null); }} /></Field></div>
    </fieldset>
    {error && <p role="alert" className="text-caption text-danger-strong">{error}</p>}
    <Button variant="outline" disabled={busy} onClick={generate}>Xem trước lịch</Button>
    {preview && <section aria-label="Xem trước lịch lặp" className="space-y-4 border-t border-border pt-4"><p className="text-sm font-medium text-fg">{preview.length} buổi dự kiến · {enrollment.sessionDurationMinutes} phút/buổi</p><ul className="divide-y divide-border">{preview.map(session => {
      const proposed = items.find(item => item.sessionId === session.id);
      return <li key={session.id} className="space-y-2 py-3"><label className="block text-caption font-medium text-fg" htmlFor={`preview-${session.id}`}>Buổi #{session.sessionNumber}<Input id={`preview-${session.id}`} className="mt-2" type="datetime-local" value={session.local} disabled={busy} aria-invalid={Boolean(conflicts[session.id])} onChange={event => setPreview(previous => previous.map(item => item.id === session.id ? { ...item, local: event.target.value } : item))} /></label>{proposed && <p className="text-caption text-fg-secondary">Kết thúc: {formatDateTime(proposed.endAt)}</p>}{conflicts[session.id] && <p role="alert" className="text-caption text-danger-strong">{conflicts[session.id]}</p>}</li>;
    })}</ul><p className="text-caption text-fg-secondary">Dùng lịch dự kiến chỉ điền thời gian vào các buổi được chọn. Chưa lưu lên hệ thống cho đến khi bạn xác nhận xếp lịch.</p><Button disabled={busy || Object.keys(conflicts).length > 0} onClick={() => onApply(preview)}>Dùng lịch dự kiến</Button></section>}
  </div>;
}
