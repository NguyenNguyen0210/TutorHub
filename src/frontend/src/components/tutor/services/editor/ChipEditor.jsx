import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';

export default function ChipEditor({ id, label, items, onChange, max = 8, maxLength = 200 }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (items.length >= max) { setError(`Tối đa ${max} mục.`); return; }
    if (value.length > maxLength) { setError(`Mỗi mục tối đa ${maxLength} ký tự.`); return; }
    if (items.some(item => item.toLocaleLowerCase('vi') === value.toLocaleLowerCase('vi'))) { setError('Mục này đã có trong danh sách.'); return; }
    onChange([...items, value]); setDraft(''); setError('');
  };
  return <div className="space-y-3"><label htmlFor={id} className="block text-body-reg font-medium text-fg">{label} <span className="font-normal text-fg-secondary">({items.length}/{max})</span></label>
    {items.length > 0 && <ul className="flex flex-wrap gap-2">{items.map((item, index) => <li key={`${index}-${item}`} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-brand-primary-100 bg-brand-primary-50 pl-3 text-caption text-brand-primary-700"><span className="break-words">{item}</span><button type="button" aria-label={`Xóa ${item}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-brand-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="close" size="xs" /></button></li>)}</ul>}
    <div className="flex gap-2"><Input id={id} value={draft} maxLength={maxLength} placeholder={`Thêm ${label.toLowerCase()}`} onChange={event => { setDraft(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} aria-describedby={`${id}-hint`} /><Button type="button" variant="outline" disabled={!draft.trim() || items.length >= max} onClick={add}>Thêm</Button></div>
    <p id={`${id}-hint`} className="text-caption text-fg-secondary">Nhập một mục rồi nhấn Enter hoặc Thêm.</p>{error && <p role="alert" className="text-caption text-danger-strong">{error}</p>}
  </div>;
}
