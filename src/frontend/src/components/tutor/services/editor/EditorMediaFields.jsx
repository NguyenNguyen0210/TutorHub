import React, { useState } from 'react';
import Input, { Field } from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import { trialLessonMedia, validImageLink } from '@/utils/trialLessonMedia';

export function CoverPreview({ value, className = '' }) {
  const [failed, setFailed] = useState(null);
  const showImage = value?.trim() && validImageLink(value) && failed !== value;
  return <div className={`flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-neutral-50 ${className}`}>
    {showImage
      // Loading failures are browser events, not user interactions.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      ? <img src={value} alt="Ảnh bìa gói học" className="h-full w-full object-cover" onError={() => setFailed(value)} />
      : <div className="space-y-2 p-4 text-center text-fg-secondary"><Icon name="image" size="lg" /><p className="text-caption">{value ? 'Chưa hiển thị được ảnh. Kiểm tra liên kết hoặc thay ảnh khác.' : 'Chưa có ảnh bìa'}</p></div>}
  </div>;
}

export default function EditorMediaFields({ form, service, onChange, locked }) {
  const media = trialLessonMedia(form.trialLessonUrl);
  const existingNonVideo = form.trialLessonUrl === (service.trialLessonUrl || '') && media && media.kind !== 'video';
  return <div className="space-y-5 border-t border-border pt-5">
    <div className="space-y-3"><h3 className="text-body-reg font-semibold text-fg">Ảnh bìa gói học{locked && ' · Chỉ đọc'}</h3><p className="text-caption text-fg-secondary">Ảnh hiển thị khi học viên khám phá và xem chi tiết gói học.</p><CoverPreview value={form.coverImageUrl} className="max-w-md" />{!locked && <Field label="Liên kết ảnh bìa" htmlFor="service-cover"><Input id="service-cover" type="url" value={form.coverImageUrl} placeholder="https://…" onChange={event => onChange('coverImageUrl', event.target.value)} /><p className="mt-2 text-caption text-fg-secondary">Dùng liên kết ảnh công khai, không cần đăng nhập để xem.</p></Field>}</div>
    <Field label="Liên kết video học thử" htmlFor="service-trial" hint="YouTube, Vimeo hoặc liên kết tệp MP4/WebM/OGG. Không bắt buộc."><Input id="service-trial" type="url" value={form.trialLessonUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={event => onChange('trialLessonUrl', event.target.value)} /></Field>
    {existingNonVideo && <p className="rounded-xl bg-holding-subtle p-3 text-caption leading-relaxed text-holding-strong">Liên kết hiện tại mở {media.kind === 'meeting' ? 'cuộc họp' : 'trang bên ngoài'}, không phải video phát lại. Bạn có thể thay bằng video giới thiệu hoặc xóa liên kết. Nếu giữ nguyên, liên kết sẽ mở ngoài trang thay vì phát video.</p>}
    {media?.kind === 'video' && <p className="text-caption text-success-strong">Đã nhận diện nguồn video. Dùng Xem trước để kiểm tra nội dung gói học.</p>}
  </div>;
}
