import React from 'react';
import { cn } from '@/lib/cn';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { TableSkeleton } from '@/components/common/Skeleton';
import { formatDateTime } from '@/utils/formatters';
import { ApplicationStatus } from './ApplicationReviewDrawer';

export default function ApplicationTable({ rows, loading, selectedId, totalFiltered, currentPage, totalPages, onToggleRow, onPageChange }) {
  return <section aria-label="Danh sách ứng viên" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
    <div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Ứng viên</h2><p className="mt-1 text-xs text-fg-secondary">{loading ? 'Đang tải hồ sơ…' : `${totalFiltered} hồ sơ phù hợp`}</p></div>
    {loading ? <div className="p-5"><TableSkeleton rows={4} /></div> : !rows.length ? <div className="px-5 py-12 text-center text-sm text-fg-secondary">Không có hồ sơ phù hợp với điều kiện hiện tại.</div> : <ul className="divide-y divide-border">{rows.map(app => <li key={app.id}>
      <button type="button" aria-pressed={selectedId === app.id} onClick={() => onToggleRow(app)} className={cn('w-full border-l-[3px] p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary-600', selectedId === app.id ? 'border-brand-primary-600 bg-brand-primary-50' : 'border-transparent hover:bg-neutral-50')}>
        <div className="flex items-start gap-3"><Avatar src={app.userAvatarUrl} name={app.userFullName} size="md" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-6">{app.userFullName}</h3><p className="mt-0.5 truncate text-xs text-fg-secondary" title={app.userEmail}>{app.userEmail}</p><p className="mt-2 line-clamp-2 text-[13px] leading-5">{[app.subject, app.subjectSub].filter(Boolean).join(' · ') || 'Chưa cung cấp chuyên môn'}</p><p className="mt-1 truncate text-xs text-fg-secondary" title={app.education}>{app.degreeLevel || app.education || 'Chưa cung cấp học vấn'}</p></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><ApplicationStatus status={app.status} /><span className="text-xs text-fg-secondary">{app.submittedAt ? formatDateTime(app.submittedAt) : 'Chưa có ngày nộp'}</span></div>
      </button>
    </li>)}</ul>}
    {!loading && <nav aria-label="Phân trang hồ sơ" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-fg-secondary"><span>{rows.length ? `${(currentPage - 1) * 7 + 1}–${(currentPage - 1) * 7 + rows.length}` : '0'} / {totalFiltered}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Trước</Button><span>{currentPage}/{totalPages}</span><Button variant="outline" size="sm" aria-label="Trang sau" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Sau</Button></div></nav>}
  </section>;
}
