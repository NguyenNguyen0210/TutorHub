import React from 'react';
import Input, { Field } from '@/components/ui/Input';
import ServiceCoverPicker from '../ServiceCoverPicker';
export { CoverPreview } from '../ServiceCoverPicker';
import { trialLessonMedia } from '@/utils/trialLessonMedia';

export default function EditorMediaFields({ form, service, onChange, locked }) {
  const media = trialLessonMedia(form.trialLessonUrl);
  const existingNonVideo = form.trialLessonUrl === (service.trialLessonUrl || '') && media && media.kind !== 'video';
  return <div className="space-y-5 border-t border-border pt-5">
    <ServiceCoverPicker form={form} onChange={onChange} locked={locked} />
    <Field label="Liên kết video học thử" htmlFor="service-trial" hint="YouTube, Vimeo hoặc liên kết tệp MP4/WebM/OGG. Không bắt buộc."><Input id="service-trial" type="url" value={form.trialLessonUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={event => onChange('trialLessonUrl', event.target.value)} /></Field>
    {existingNonVideo && <p className="rounded-xl bg-holding-subtle p-3 text-caption leading-relaxed text-holding-strong">Liên kết hiện tại mở {media.kind === 'meeting' ? 'cuộc họp' : 'trang bên ngoài'}, không phải video phát lại. Bạn có thể thay bằng video giới thiệu hoặc xóa liên kết. Nếu giữ nguyên, liên kết sẽ mở ngoài trang thay vì phát video.</p>}
    {media?.kind === 'video' && <p className="text-caption text-success-strong">Đã nhận diện nguồn video. Dùng Xem trước để kiểm tra nội dung gói học.</p>}
  </div>;
}
