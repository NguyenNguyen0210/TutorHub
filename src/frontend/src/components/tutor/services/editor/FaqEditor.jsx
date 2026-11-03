import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Field, Textarea } from '@/components/ui/Input';

export default function FaqEditor({ items, onChange, errorField }) {
  const [openIndex, setOpenIndex] = useState(null);
  const errorIndex = Number(errorField?.match(/^service-faq-(\d+)-/)?.[1]);
  useEffect(() => { if (Number.isInteger(errorIndex)) setOpenIndex(errorIndex); }, [errorIndex, errorField]);
  useEffect(() => {
    if (openIndex !== errorIndex || !errorField) return undefined;
    const frame = requestAnimationFrame(() => document.getElementById(errorField)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [openIndex, errorIndex, errorField]);
  const update = (index, key, value) => onChange(items.map((item, i) => index === i ? { ...item, [key]: value } : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={index} className="rounded-xl border border-border"><div className="flex items-center gap-2 px-3"><button type="button" className="flex min-h-12 min-w-0 flex-1 items-center gap-2 py-2 text-left text-body-reg font-medium text-fg" aria-expanded={openIndex === index} onClick={() => setOpenIndex(previous => previous === index ? null : index)}><span className="min-w-0 flex-1 break-words">{item.question || `Câu hỏi ${index + 1}`}</span><Icon name={openIndex === index ? 'expand_less' : 'expand_more'} size="sm" /></button><button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary hover:text-danger-strong" aria-label={`Xóa câu hỏi ${index + 1}`} onClick={() => { onChange(items.filter((_, i) => i !== index)); setOpenIndex(previous => previous === index ? null : previous > index ? previous - 1 : previous); }}><Icon name="delete" size="sm" /></button></div>
      {openIndex === index && <div className="space-y-4 border-t border-border p-4"><Field label="Câu hỏi" htmlFor={`service-faq-${index}-q`} required><Input id={`service-faq-${index}-q`} maxLength={300} value={item.question} onChange={event => update(index, 'question', event.target.value)} /></Field><Field label="Câu trả lời" htmlFor={`service-faq-${index}-a`} required><Textarea id={`service-faq-${index}-a`} rows={3} maxLength={2000} value={item.answer} onChange={event => update(index, 'answer', event.target.value)} /></Field></div>}
    </div>)}
    {!items.length && <p className="text-body-reg text-fg-secondary">Chưa có câu hỏi thường gặp.</p>}
    <Button variant="outline" disabled={items.length >= 10} onClick={() => { onChange([...items, { question: '', answer: '' }]); setOpenIndex(items.length); }}>{items.length ? 'Thêm câu hỏi' : 'Thêm câu hỏi đầu tiên'}</Button>
  </div>;
}
