import React from 'react';
import ServiceCoverPicker from '../ServiceCoverPicker';
export { CoverPreview } from '../ServiceCoverPicker';
import ServiceDemoVideoPicker from '../ServiceDemoVideoPicker';
import { trialLessonMedia } from '@/utils/trialLessonMedia';

export default function EditorMediaFields({ form, onChange, locked }) {
  // Packages published before demo videos were uploaded may still carry an
  // external trial link. It stays readable but is no longer editable.
  const legacy = !form.trialVideoUrl ? trialLessonMedia(form.trialLessonUrl) : null;
  return <div className="space-y-5 border-t border-border pt-5">
    <ServiceCoverPicker form={form} onChange={onChange} locked={locked} />
    <ServiceDemoVideoPicker form={form} onChange={onChange} />
    {legacy && <p className="rounded-xl bg-holding-subtle p-3 text-caption leading-relaxed text-holding-strong">Gói học đang gắn {legacy.kind === 'video' ? 'video học thử' : 'liên kết học thử'} bên ngoài từ trước. Khi bạn tải video demo MP4 lên, video mới sẽ thay thế liên kết này trên trang gói học.</p>}
  </div>;
}
