import React from 'react';
import { formatDateTime } from '@/utils/formatters';
import { EvidenceLink } from './DisputeHistory';
import Avatar from '@/components/ui/Avatar';

import { DISPUTE_REASONS as REASONS } from '@/utils/disputeList';

export default function DisputeReport({ dispute, title }) {
  const files = (dispute.evidences || []).filter(file => file.uploadedByUserId === dispute.initiatorUserId && !file.responseId);
  return <section id="dispute-report" tabIndex={-1} aria-labelledby="dispute-report-title" className="scroll-mt-24 space-y-5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div><h2 id="dispute-report-title" className="text-lg font-semibold text-fg">{title}</h2><div className="mt-4 flex items-start gap-3"><Avatar name={dispute.initiatorName} size="md" /><div className="min-w-0"><p className="break-words text-sm font-semibold text-fg">{dispute.initiatorName}</p><p className="mt-1 text-caption text-fg-secondary">Người gửi báo cáo</p><p className="mt-1 text-caption text-fg-secondary">{formatDateTime(dispute.createdAt, 'DD/MM/YYYY · HH:mm')}</p></div></div></div>
    <div className="space-y-2"><h3 className="text-sm font-semibold text-fg">Lý do báo cáo</h3><p className="text-body-reg text-fg-secondary">{REASONS[dispute.reason] || 'Chưa có thông tin lý do'}</p></div>
    <div className="space-y-2"><h3 className="text-sm font-semibold text-fg">Nội dung báo cáo gốc</h3><p className="whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{dispute.description?.trim() ? dispute.description : 'Người gửi chưa cung cấp mô tả chi tiết.'}</p></div>
    <div className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold text-fg">Bằng chứng người gửi đã cung cấp</h3>
      {files.length ? <ul className="divide-y divide-border">{files.map(file => <li key={file.id} className="py-2"><EvidenceLink evidence={file} /></li>)}</ul>
        : <p className="text-sm text-fg-secondary">Người gửi chưa đính kèm tệp bằng chứng cho báo cáo gốc. Các tài liệu bổ sung kèm giải trình được hiển thị trong lịch sử trao đổi.</p>}
    </div>
  </section>;
}
