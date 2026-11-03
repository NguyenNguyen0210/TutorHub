import React from 'react';
import { formatDateTime } from '@/utils/formatters';
import { evidenceDownloadUrl } from '@/utils/disputeEvidence';
import Icon from '@/components/ui/Icon';

function author(dispute, id) {
  if (id === dispute.initiatorUserId) return `${dispute.initiatorName} · Người gửi khiếu nại`;
  if (id === dispute.respondentUserId) return `${dispute.respondentName} · Bên phản hồi`;
  return 'Quản trị viên';
}

export function EvidenceLink({ evidence }) {
  const url = evidenceDownloadUrl(evidence.fileUrl);
  return <div className="min-w-0 text-sm">
    {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="attach_file" size="sm" /><span className="break-all">{evidence.fileName}</span><Icon name="open_in_new" size="xs" /></a> : <p className="break-all font-medium text-fg">{evidence.fileName}</p>}
    <p className="text-caption text-fg-secondary">{formatDateTime(evidence.createdAt)} · {Math.max(1, Math.ceil(evidence.fileSizeBytes / 1024))} KB</p>
  </div>;
}

/** The same immutable record is visible to both participants and the reviewer. */
export default function DisputeHistory({ dispute }) {
  const responses = dispute.responses || [];
  const files = dispute.evidences || [];
  const entries = [
    { id: 'opened', at: dispute.createdAt, label: `${dispute.initiatorName} · Mở khiếu nại` },
    ...responses.map(response => ({ id: response.id, at: response.createdAt, label: `${response.authorName} · ${response.authorRole === 'Tutor' ? 'Gia sư' : 'Học viên'}`, content: response.content, files: files.filter(file => file.responseId === response.id) })),
    ...files.filter(file => !file.responseId || !responses.some(response => response.id === file.responseId)).map(file => ({ id: file.id, at: file.createdAt, label: author(dispute, file.uploadedByUserId), files: [file] })),
    ...(dispute.resolvedAt ? [{ id: 'resolved', at: dispute.resolvedAt, label: 'Kết quả xử lý của TutorHub', content: dispute.adminNotes || 'Khiếu nại đã kết thúc.' }] : []),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
  return <section aria-label="Lịch sử trao đổi" className="space-y-5">
    <h2 className="text-lg font-semibold text-fg">Lịch sử trao đổi</h2>
    <ol className="ml-2 space-y-6 border-l border-border pl-5">{entries.map(entry => <li key={entry.id} className="relative min-w-0">
      <span aria-hidden="true" className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-neutral-400 ring-4 ring-surface" />
      <p className="break-words text-sm font-semibold text-fg">{entry.label}</p>
      <p className="mt-1 text-caption text-fg-secondary">{formatDateTime(entry.at)}</p>
      {entry.content && <p className="mt-3 whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{entry.content}</p>}
      {entry.files?.length > 0 && <ul className="mt-3 space-y-2">{entry.files.map(file => <li key={file.id}><EvidenceLink evidence={file} /></li>)}</ul>}
    </li>)}</ol>
  </section>;
}
