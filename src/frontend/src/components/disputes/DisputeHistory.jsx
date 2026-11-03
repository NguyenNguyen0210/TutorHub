import React from 'react';
import { formatDateTime } from '@/utils/formatters';
import { evidenceDownloadUrl } from '@/utils/disputeEvidence';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

function author(dispute, id) {
  if (id === dispute.initiatorUserId) return `${dispute.initiatorName} · Người gửi khiếu nại`;
  if (id === dispute.respondentUserId) return `${dispute.respondentName} · Bên phản hồi`;
  return 'Quản trị viên';
}

export function EvidenceLink({ evidence }) {
  const url = evidenceDownloadUrl(evidence.fileUrl);
  return <div className="min-w-0 text-sm">
    {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="attach_file" size="sm" /><span className="break-all">{evidence.fileName}</span><Icon name="open_in_new" size="xs" /></a> : <p className="break-all font-medium text-fg">{evidence.fileName}</p>}
    <p className="text-caption text-fg-secondary">{formatDateTime(evidence.createdAt, 'DD/MM/YYYY · HH:mm')} · {Math.max(1, Math.ceil(evidence.fileSizeBytes / 1024))} KB</p>
  </div>;
}

/** The same immutable record is visible to both participants and the reviewer. */
export default function DisputeHistory({ dispute, reportHref }) {
  const responses = dispute.responses || [];
  const files = dispute.evidences || [];
  const decisions = { StudentWinsFullRefund: 'Hoàn toàn bộ học phí của buổi học', StudentWinsPartialRefund: 'Hoàn một phần học phí theo kết luận', TutorWinsReleaseEarning: 'Giải ngân học phí cho gia sư', DismissedNoFinancialChange: 'Đóng vụ việc, không điều chỉnh tài chính' };
  const entries = [
    { id: 'opened', type: 'system', icon: 'inbox', at: dispute.createdAt, label: `${dispute.initiatorName} đã gửi khiếu nại`, href: reportHref },
    ...responses.map(response => ({ id: response.id, type: 'response', at: response.createdAt, name: response.authorName, role: response.authorRole === 'Tutor' ? 'Gia sư' : 'Học viên', content: response.content, files: files.filter(file => file.responseId === response.id) })),
    ...files.filter(file => !file.responseId || !responses.some(response => response.id === file.responseId)).map(file => ({ id: file.id, type: 'file', icon: 'attach_file', at: file.createdAt, label: `${author(dispute, file.uploadedByUserId)} · Bổ sung bằng chứng`, files: reportHref && file.uploadedByUserId === dispute.initiatorUserId && !file.responseId ? [] : [file], href: reportHref && file.uploadedByUserId === dispute.initiatorUserId && !file.responseId ? reportHref : undefined })),
    ...(dispute.resolvedAt ? [{ id: 'resolved', type: 'conclusion', icon: 'gavel', at: dispute.resolvedAt, label: 'Kết luận của TutorHub', decision: decisions[dispute.resolutionDecision], content: dispute.adminNotes || 'Khiếu nại đã kết thúc.' }] : []),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
  return <section aria-label="Lịch sử trao đổi" className="space-y-5">
    <h2 className="text-lg font-semibold text-fg">Lịch sử xử lý</h2>
    <ol className="space-y-5">{entries.map(entry => <li key={entry.id} className="min-w-0">
      {entry.type === 'response' ? <article className="min-w-0 border-l-2 border-neutral-200 pl-4">
        <header className="flex items-start gap-3"><Avatar name={entry.name} size="sm" /><div className="min-w-0"><p className="break-words text-sm font-semibold text-fg">{entry.name}<span className="ml-2 font-normal text-fg-secondary">{entry.role}</span></p><p className="mt-1 text-caption text-fg-secondary">{formatDateTime(entry.at, 'DD/MM/YYYY · HH:mm')}</p></div></header>
        <p className="mt-3 whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{entry.content}</p>
        {entry.files.length > 0 && <ul className="mt-3 space-y-2">{entry.files.map(file => <li key={file.id}><EvidenceLink evidence={file} /></li>)}</ul>}
      </article> : <div className={`flex gap-3 ${entry.type === 'conclusion' ? 'border-t border-border pt-5' : ''}`}>
        <Icon name={entry.icon} size="sm" className="mt-0.5 text-fg-secondary" />
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium text-fg">{entry.label}</p><p className="mt-1 text-caption text-fg-secondary">{formatDateTime(entry.at, 'DD/MM/YYYY · HH:mm')}</p>
          {entry.decision && <p className="mt-3 font-semibold text-fg">{entry.decision}</p>}
          {entry.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg-secondary">{entry.content}</p>}
          {entry.href && <a href={entry.href} className="inline-flex min-h-11 items-center rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{entry.type === 'file' ? 'Xem bằng chứng trong báo cáo' : 'Xem báo cáo gốc'}</a>}
          {entry.files?.length > 0 && <ul className="mt-2 space-y-2">{entry.files.map(file => <li key={file.id}><EvidenceLink evidence={file} /></li>)}</ul>}
        </div>
      </div>}
    </li>)}</ol>
  </section>;
}
