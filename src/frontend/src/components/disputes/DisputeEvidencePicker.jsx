import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT } from '@/utils/disputeEvidence';

export default function DisputeEvidencePicker({ file, onChoose, onRemove, disabled, invalid }) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  const [brokenPreview, setBrokenPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="space-y-3">
    <input ref={input} id="dispute-evidence" type="file" accept={EVIDENCE_ACCEPT} disabled={disabled} tabIndex={-1} aria-label="Chọn tệp bằng chứng" aria-invalid={invalid || undefined} aria-describedby="evidence-help" className="sr-only" onChange={event => { const chosen = event.target.files?.[0]; if (chosen) onChoose(chosen); event.target.value = ''; }} />
    {/* Drag events supplement the native keyboard-accessible file picker button. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
    <div role="group" aria-label="Thêm bằng chứng" onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled && event.dataTransfer.files[0]) onChoose(event.dataTransfer.files[0]); }} className={`rounded-xl border border-dashed px-4 py-5 text-center ${dragging ? 'border-brand-primary-500 bg-brand-primary-50' : 'border-neutral-300 bg-neutral-50'}`}>
      <Icon name="cloud_upload" size="lg" className="mx-auto text-fg-secondary" />
      <p className="mt-2 text-sm font-semibold text-fg">Thêm bằng chứng</p>
      <p className="mx-auto mt-1 max-w-sm text-caption leading-relaxed text-fg-secondary">Kéo tệp vào đây hoặc chọn ảnh, tài liệu liên quan đến buổi học.</p>
      <p id="evidence-help" className="mt-2 text-caption text-fg-secondary">{EVIDENCE_HINT}</p>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()} className="mt-4">Chọn tệp từ thiết bị</Button>
    </div>
    {file && <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface p-3">
      {preview && brokenPreview !== preview
        // Browser image decoding failures are not user interactions.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        ? <img src={preview} alt={`Xem trước ${file.name}`} onError={() => setBrokenPreview(preview)} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-fg-secondary"><Icon name="description" size="md" /></span>}
      <div className="min-w-0 flex-1"><p className="break-all text-sm font-medium text-fg">{file.name}</p><p className="mt-1 text-caption text-fg-secondary">{file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.ceil(file.size / 1024))} KB`} · Sẵn sàng gửi</p></div>
      <button type="button" disabled={disabled} aria-label="Bỏ tệp đã chọn" onClick={onRemove} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><Icon name="close" size="sm" /></button>
    </div>}
  </div>;
}
