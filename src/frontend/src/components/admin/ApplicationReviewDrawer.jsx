import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import Avatar from '@/components/ui/Avatar';
import Button, { IconButton } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { formatDateTime } from '@/utils/formatters';

const STATUS = {
  Pending: ['Chờ xét duyệt', 'text-holding-strong', 'bg-holding'],
  Approved: ['Đã phê duyệt', 'text-success-strong', 'bg-success'],
  Rejected: ['Đã từ chối', 'text-danger-strong', 'bg-danger'],
};
export function ApplicationStatus({ status }) {
  const [label, color, dot] = STATUS[status] || ['Chưa rõ trạng thái', 'text-fg-secondary', 'bg-neutral-400'];
  return <span className={cn('inline-flex items-center gap-2 text-xs font-medium', color)}><span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />{label}</span>;
}

function Info({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{value || 'Chưa cung cấp'}</dd></div>;
}

export default function ApplicationReviewDrawer({ applicant, processing, onApprove, onReject, onPreviewDoc, onClose, embedded = false }) {
  const [tab, setTab] = useState('info');
  const documents = applicant.documents || [];
  const pending = applicant.status === 'Pending';
  const tabs = [['info', 'Thông tin'], ['degrees', `Bằng cấp (${documents.length})`], ['experience', 'Kinh nghiệm'], ['history', 'Xét duyệt']];
  return <section aria-label="Chi tiết hồ sơ gia sư" className={cn('min-w-0 space-y-5 bg-surface', !embedded && 'rounded-2xl border border-border p-5 sm:p-6')}>
    <header className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><Avatar src={applicant.userAvatarUrl} name={applicant.userFullName} size="lg" /><div className="min-w-0"><h2 className="text-lg font-semibold leading-7">{applicant.userFullName}</h2><div className="mt-2"><ApplicationStatus status={applicant.status} /></div><p className="mt-2 break-all text-xs text-fg-secondary">{applicant.userEmail}</p></div></div>{!embedded && <IconButton label="Đóng chi tiết hồ sơ" disabled={processing} onClick={onClose} icon={<Icon name="close" size="sm" />} />}</header>
    {!pending && <div className={cn('flex items-start gap-2 rounded-xl p-3 text-sm', applicant.status === 'Approved' ? 'bg-success-subtle text-success-strong' : 'bg-danger-subtle text-danger-strong')}><Icon name={applicant.status === 'Approved' ? 'check_circle' : 'info'} size="sm" /><p>{applicant.status === 'Approved' ? 'Hồ sơ đã được chấp thuận.' : 'Hồ sơ đã được từ chối. Xem lý do trong mục Xét duyệt.'}</p></div>}
    <nav aria-label="Nội dung hồ sơ" className="flex gap-2 overflow-x-auto border-b border-border sm:gap-5">{tabs.map(([key, label]) => <button type="button" key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)} className={cn('shrink-0 whitespace-nowrap border-b-2 pb-3 text-xs font-medium sm:text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600', tab === key ? 'border-brand-primary-600 text-brand-primary-700' : 'border-transparent text-fg-secondary hover:text-fg')}>{label}</button>)}</nav>
    {tab === 'info' && <dl className="space-y-5"><Info label="Chuyên môn" value={[applicant.subject, applicant.subjectSub].filter(Boolean).join(' · ')} /><Info label="Giới thiệu" value={applicant.bio} /><div className="grid gap-4 sm:grid-cols-2"><Info label="Email" value={applicant.userEmail} /><Info label="Điện thoại" value={applicant.userPhone} /><Info label="Học vấn" value={applicant.education} /><Info label="Trường đào tạo" value={applicant.university} /><Info label="Học vị" value={applicant.degreeLevel} /><Info label="Chuyên ngành" value={applicant.major} /></div><Info label="Chứng chỉ do ứng viên khai báo" value={applicant.certifications} /></dl>}
    {tab === 'degrees' && <div className="space-y-4"><div><h3 className="text-sm font-semibold">Tài liệu ứng viên cung cấp</h3><p className="mt-2 text-xs leading-5 text-fg-secondary">Phê duyệt hồ sơ không đồng nghĩa từng văn bằng đã được xác thực với đơn vị cấp.</p></div>{documents.length ? <ul className="divide-y divide-border">{documents.map((doc, index) => <li key={doc.id || doc.mediaId || index} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words text-sm font-medium">{doc.title || 'Tài liệu đính kèm'}</p><p className="mt-1 text-xs text-fg-secondary">{doc.institution}</p></div><Button variant="outline" size="sm" onClick={() => onPreviewDoc(doc)}>Xem tài liệu</Button></li>)}</ul> : <p className="rounded-xl bg-neutral-50 p-5 text-sm leading-6 text-fg-secondary">Chưa có tài liệu đính kèm để đối chiếu văn bằng hoặc chứng chỉ.</p>}</div>}
    {tab === 'experience' && <dl className="space-y-5"><Info label="Kinh nghiệm giảng dạy" value={`${applicant.experienceYears} năm`} /><Info label="Phương pháp giảng dạy" value={applicant.methodology} /><Info label="Thành tích nổi bật" value={applicant.achievements} /></dl>}
    {tab === 'history' && <div className="space-y-5"><h3 className="text-sm font-semibold">Lịch sử xét duyệt</h3><ol className="space-y-5 border-l border-border pl-4 text-sm">{applicant.submittedAt && <li><p className="font-medium">Nộp hồ sơ</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(applicant.submittedAt)}</p></li>}{applicant.reviewedAt && <li><p className="font-medium">{applicant.status === 'Approved' ? 'Phê duyệt hồ sơ' : 'Từ chối hồ sơ'}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(applicant.reviewedAt)}</p></li>}</ol>{pending && <p className="text-sm text-fg-secondary">Hồ sơ đang chờ xét duyệt.</p>}{applicant.status === 'Rejected' && <div className="rounded-xl bg-danger-subtle p-4"><h4 className="text-sm font-medium text-danger-strong">Lý do từ chối</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{applicant.rejectionReason || 'Chưa có lý do được lưu.'}</p></div>}</div>}
    {tab === 'history' && applicant.reviewedByAdminName && <p className="text-sm text-fg-secondary">Người xét duyệt: <span className="font-medium text-fg">{applicant.reviewedByAdminName}</span></p>}
    {pending && <footer className="space-y-3 border-t border-border pt-5"><p className="text-xs leading-5 text-fg-secondary">Đối chiếu thông tin và tài liệu trước khi quyết định. Lý do từ chối sẽ được gửi đến ứng viên.</p><div className="grid grid-cols-2 gap-3"><Button variant="danger-outline" disabled={processing} onClick={onReject}>Từ chối</Button><Button disabled={processing} loading={processing} onClick={onApprove}>Phê duyệt</Button></div></footer>}
  </section>;
}
