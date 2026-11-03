import React from 'react';
import { Drawer } from '@/components/ui/Avatar';
import { ServiceLessonChips, ServicePricing } from '@/components/discovery/ServiceCardDetails';
import { CoverPreview } from './EditorMediaFields';
import { splitLines, parseTags } from '../serviceFormUtils';
import { trialLessonMedia } from '@/utils/trialLessonMedia';

export default function ServiceEditorPreview({ open, onClose, form, service }) {
  const media = trialLessonMedia(form.trialLessonUrl);
  return <Drawer open={open} onClose={onClose} side="right" title="Xem trước gói học" widthClass="w-full sm:w-[820px]" panelClassName="max-w-full sm:max-w-[85vw]">
    <div className="space-y-6 pb-4">
      <p className="rounded-xl bg-brand-primary-50 p-3 text-body-reg text-brand-primary-700">Bản xem trước từ nội dung đang chỉnh sửa. Các thay đổi chưa được lưu hoặc xuất bản.</p>
      <CoverPreview value={form.coverImageUrl} file={form.coverImageFile} />
      <div className="space-y-3"><p className="text-caption font-medium text-primary">{service.subjectName}</p><h2 className="break-words text-2xl font-semibold text-fg">{form.title || 'Chưa có tên gói học'}</h2><p className="whitespace-pre-wrap break-words text-body-reg text-fg-secondary">{form.shortDescription}</p><ServiceLessonChips totalSessions={form.totalSessions} sessionDurationMinutes={form.sessionDurationMinutes} /><ServicePricing price={form.price} totalSessions={form.totalSessions} /></div>
      <section className="space-y-3"><h3 className="text-lg font-semibold text-fg">Giới thiệu gói học</h3><p className="whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{form.description}</p>{form.learningScope && <p className="text-body-reg text-fg-secondary">Giáo trình: {form.learningScope}</p>}{form.expectedOutcome && <p className="text-body-reg text-fg-secondary">Đầu ra: {form.expectedOutcome}</p>}</section>
      {media && <section className="space-y-3"><h3 className="text-lg font-semibold text-fg">{media.kind === 'video' ? 'Video học thử' : 'Liên kết học thử'}</h3><a href={media.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-primary underline">{media.kind === 'video' ? 'Mở video trong tab mới' : 'Mở liên kết trong tab mới'}</a></section>}
      {form.sessions.length > 0 && <section className="space-y-3"><h3 className="text-lg font-semibold text-fg">Nội dung {form.sessions.length} buổi</h3><ol className="divide-y divide-border">{form.sessions.map((item, index) => <li key={index} className="py-3"><p className="font-medium text-fg">{index + 1}. {item.title || 'Chưa đặt tên'}</p><p className="mt-2 whitespace-pre-wrap break-words text-body-reg text-fg-secondary">{item.description}</p>{item.keyTopicsText && <p className="mt-2 text-caption text-fg-secondary">{parseTags(item.keyTopicsText).join(' · ')}</p>}</li>)}</ol></section>}
      {[['Đối tượng phù hợp', form.targetAudienceText], ['Điều kiện tiên quyết', form.prerequisitesText]].map(([title, value]) => value.trim() && <section key={title}><h3 className="text-lg font-semibold text-fg">{title}</h3><ul className="mt-3 list-inside list-disc space-y-2 text-body-reg text-fg-secondary">{splitLines(value).map((item, i) => <li key={i}>{item}</li>)}</ul></section>)}
      {form.faqs.length > 0 && <section className="space-y-3"><h3 className="text-lg font-semibold text-fg">Câu hỏi thường gặp</h3>{form.faqs.map((item, index) => <details key={index} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium text-fg">{item.question || `Câu hỏi ${index + 1}`}</summary><p className="mt-3 whitespace-pre-wrap break-words text-body-reg text-fg-secondary">{item.answer}</p></details>)}</section>}
    </div>
  </Drawer>;
}
