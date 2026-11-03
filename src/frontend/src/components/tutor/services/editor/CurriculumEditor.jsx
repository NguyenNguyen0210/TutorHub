import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input, { Field, Textarea } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import { EMPTY_SESSION } from '../serviceFormUtils';

export default function CurriculumEditor({ form, onChange, errorField }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const confirm = useConfirm();
  const sessions = form.sessions;
  const errorIndex = Number(errorField?.match(/^service-session-(\d+)-/)?.[1]);
  useEffect(() => {
    if (!Number.isInteger(errorIndex)) return;
    setShowAll(true); setOpenIndex(errorIndex);
  }, [errorIndex, errorField]);
  useEffect(() => {
    if (openIndex !== errorIndex || !errorField) return undefined;
    const frame = requestAnimationFrame(() => document.getElementById(errorField)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [openIndex, errorIndex, errorField]);
  const update = (index, key, value) => onChange('sessions', sessions.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const remove = async index => {
    if (!await confirm({ title: 'Xóa mô tả buổi này?', content: 'Thao tác chỉ xóa mô tả khỏi lộ trình gói học. Buổi học và lịch của các hợp đồng đã mua vẫn giữ nguyên.', confirmText: 'Xóa mô tả', cancelText: 'Giữ lại', danger: true })) return;
    onChange('sessions', sessions.filter((_, i) => i !== index));
    setOpenIndex(previous => previous === index ? null : previous > index ? previous - 1 : previous);
  };
  return <div className="space-y-4">
    <p className="text-body-reg text-fg-secondary">{sessions.length}/{form.totalSessions} buổi đã có mô tả. Nội dung này giới thiệu lộ trình gói học; không xóa hay đổi lịch các buổi của hợp đồng đã ký.</p>
    <div className="divide-y divide-border rounded-xl border border-border">{(showAll ? sessions : sessions.slice(0, 5)).map((item, index) => <div key={index}>
      <div className="flex items-center gap-2 px-3 py-1"><button type="button" onClick={() => setOpenIndex(previous => previous === index ? null : index)} aria-expanded={openIndex === index} aria-controls={`lesson-content-${index}`} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-caption font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1 break-words text-body-reg font-medium text-fg">{item.title || 'Chưa đặt tên nội dung'}</span><Icon name={openIndex === index ? 'expand_less' : 'expand_more'} size="sm" /></button><button type="button" onClick={() => remove(index)} aria-label={`Xóa mô tả buổi ${index + 1}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary hover:bg-danger-subtle hover:text-danger-strong"><Icon name="delete" size="sm" /></button></div>
      {openIndex === index && <div id={`lesson-content-${index}`} className="space-y-4 border-t border-border p-4">
        <Field label={`Tiêu đề buổi ${index + 1}`} htmlFor={`service-session-${index}-title`} required><Input id={`service-session-${index}-title`} maxLength={200} value={item.title} onChange={event => update(index, 'title', event.target.value)} /></Field>
        <Field label="Nội dung chi tiết" htmlFor={`service-session-${index}-desc`}><Textarea id={`service-session-${index}-desc`} maxLength={2000} rows={3} value={item.description} onChange={event => update(index, 'description', event.target.value)} /></Field>
        <Field label="Trọng tâm kiến thức" htmlFor={`service-session-${index}-topics`} hint="Các ý cách nhau bằng dấu phẩy."><Input id={`service-session-${index}-topics`} value={item.keyTopicsText} onChange={event => update(index, 'keyTopicsText', event.target.value)} /></Field>
        <Field label="Thời lượng nội dung (phút)" htmlFor={`service-session-${index}-duration`} hint="Từ 30 đến 240 phút. Không sửa thời lượng hợp đồng đã ký."><Input id={`service-session-${index}-duration`} type="number" min={30} max={240} step={1} placeholder={String(form.sessionDurationMinutes)} value={item.durationMinutes} onChange={event => update(index, 'durationMinutes', event.target.value)} /></Field>
      </div>}
    </div>)}</div>
    {!sessions.length && <p className="text-body-reg text-fg-secondary">Chưa có nội dung từng buổi.</p>}
    <div className="flex flex-wrap gap-2">{sessions.length > 5 && <Button variant="ghost" onClick={() => setShowAll(value => !value)}>{showAll ? 'Thu gọn danh sách' : `Hiển thị đủ ${sessions.length} nội dung buổi`}</Button>}<Button variant="outline" disabled={sessions.length >= Number(form.totalSessions)} onClick={() => { onChange('sessions', [...sessions, { ...EMPTY_SESSION }]); setShowAll(true); setOpenIndex(sessions.length); }}>Thêm nội dung buổi</Button></div>
  </div>;
}
