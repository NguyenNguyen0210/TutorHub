import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { validImageLink } from '@/utils/trialLessonMedia';
import { validateAvatar } from '@/utils/profileSettings';

export function CoverPreview({ value, file, className = '' }) {
  const [local, setLocal] = useState(null);
  const [failed, setFailed] = useState(null);
  useEffect(() => {
    if (!file) { setLocal(null); return undefined; }
    const url = URL.createObjectURL(file); setLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const src = file ? local : validImageLink(value) ? value : null;
  return <div className={`flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-neutral-50 ${className}`}>
    {src && failed !== src
      // Browser image decoding failures are not user interactions.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      ? <img src={src} alt="Ảnh bìa gói học" className="h-full w-full object-cover" onError={() => setFailed(src)} />
      : <div className="space-y-2 p-4 text-center text-fg-secondary"><Icon name="image" size="lg" /><p className="text-caption">{value || file ? 'Chưa hiển thị được ảnh. Vui lòng chọn ảnh khác.' : 'Chưa có ảnh bìa'}</p></div>}
  </div>;
}

export default function ServiceCoverPicker({ form, onChange, disabled = false, locked = false }) {
  const input = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => { setError(''); }, [form.coverImageFile, form.coverImageUrl]);
  const choose = file => {
    if (!file) return;
    const invalid = validateAvatar(file);
    if (invalid) { setError(invalid); return; }
    setError(''); onChange('coverImageFile', file);
  };
  return <div className="space-y-3">
    <p className="text-body-reg font-semibold text-fg">Ảnh bìa gói học{locked && ' · Chỉ đọc'}</p>
    <CoverPreview value={form.coverImageUrl} file={form.coverImageFile} className="max-w-md" />
    {!locked && <><p id="service-cover-hint" className="text-caption text-fg-secondary">Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB. Ảnh được tải lên khi bạn lưu gói học.</p><input ref={input} id="service-cover" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh bìa gói học" aria-describedby={error ? 'service-cover-hint service-cover-error' : 'service-cover-hint'} aria-invalid={Boolean(error)} disabled={disabled} className="sr-only" onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} />
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => input.current?.click()} icon={<Icon name="image" size="sm" />}>{form.coverImageUrl || form.coverImageFile ? 'Thay ảnh bìa' : 'Chọn ảnh bìa'}</Button>{(form.coverImageUrl || form.coverImageFile) && <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => { onChange('coverImageFile', null); onChange('coverImageUrl', ''); setError(''); }}>Xóa ảnh bìa</Button>}</div>
      {form.coverImageFile && <p className="break-all text-caption text-fg-secondary">{form.coverImageFile.name} · {Math.max(1, Math.ceil(form.coverImageFile.size / 1024))} KB · Chưa lưu</p>}
      {error && <p id="service-cover-error" role="alert" className="text-caption text-danger-strong">{error}</p>}
    </>}
  </div>;
}
