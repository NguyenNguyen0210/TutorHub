import React from 'react';
import { Modal } from '@/components/ui/Avatar';

export default function ApplicationDocumentModal({ doc, onClose }) {
  return <Modal open={!!doc} onClose={onClose} title={doc?.title || 'Tài liệu đính kèm'} size="lg">
    {doc && <div className="space-y-4"><p className="text-sm text-fg-secondary">{doc.institution}</p><div className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl bg-neutral-50">{doc.format === 'application/pdf' || /\.pdf(?:[?#]|$)/i.test(doc.previewUrl) ? <iframe title={doc.title || 'Tài liệu PDF'} src={doc.previewUrl} className="h-[60vh] w-full" /> : <img src={doc.previewUrl} alt={doc.title || 'Tài liệu ứng viên'} className="max-h-[60vh] w-full object-contain" />}</div><a href={doc.previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand-primary-700 focus-visible:ring-2 focus-visible:ring-brand-primary-600">Mở tài liệu trong tab mới</a></div>}
  </Modal>;
}
