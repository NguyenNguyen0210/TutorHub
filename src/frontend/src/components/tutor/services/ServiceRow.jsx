import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Money from '@/components/ui/Money';
import Badge, { Tag } from '@/components/ui/Badge';
import StatusIndicator from '@/components/ui/StatusIndicator';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Menu } from '@/components/ui/Avatar';
import StretchedCardLink from '@/components/ui/StretchedCardLink';
import { ServiceLessonChips, ServiceTrialBadge } from '@/components/discovery/ServiceCardDetails';
import { formatRelativeTime } from '@/utils/formatters';

export function ServiceStatusBadge({ status }) {
  const meta = {
    Published: ['success', 'Đang tuyển sinh'], Draft: ['neutral', 'Bản nháp'],
    Paused: ['holding', 'Tạm dừng tuyển sinh'], Unpublished: ['neutral', 'Đã gỡ xuất bản'],
  }[status] || ['neutral', 'Chưa có trạng thái'];
  return status === 'Paused' ? <Badge variant={meta[0]} size="sm" dot>{meta[1]}</Badge>
    : <StatusIndicator variant={status === 'Published' ? 'success' : 'neutral'} icon={status === 'Published' ? 'check_circle' : 'description'}>{meta[1]}</StatusIndicator>;
}

/** Workspace variant: status and management actions take priority over marketing copy. */
export default function ServiceRow({ pkg, isActing, disabled, editState, onPublish, onUnpublish, onPause, onResume }) {
  const [brokenImage, setBrokenImage] = useState(null);
  const editPath = `/tutor/services/${pkg.id}/edit`;
  const published = pkg.status === 'Published';
  const paused = pkg.status === 'Paused';
  const draft = pkg.status === 'Draft';
  const price = Number(pkg.price);
  const perSession = Number(pkg.totalSessions) > 0 && price > 0 ? price / pkg.totalSessions : null;
  const updated = pkg.updatedAt || pkg.createdAt;
  const menu = [
    ...(published ? [{ key: 'pause', label: 'Tạm dừng tuyển sinh', icon: <Icon name="pause_circle" size="sm" />, onClick: () => onPause(pkg) }] : []),
    ...((published || paused) ? [{ key: 'unpublish', label: 'Gỡ xuất bản', danger: true, icon: <Icon name="visibility_off" size="sm" />, onClick: () => onUnpublish(pkg) }] : []),
  ];
  return <article className="interactive-card min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-[var(--learning-card-shadow)] transition-[border-color,box-shadow] hover:border-brand-primary-300 hover:shadow-brand-sm sm:p-6">
    <StretchedCardLink to={published ? `/services/${pkg.id}` : editPath} state={published ? undefined : editState} target={published ? '_blank' : undefined} label={`${published ? 'Xem chi tiết' : 'Quản lý'} gói học ${pkg.title}`} />
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-brand-primary-50 sm:flex sm:items-center sm:justify-center">
          {pkg.coverImageUrl && brokenImage !== pkg.coverImageUrl
            // Image loading failures are browser events, not user interactions.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            ? <img src={pkg.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setBrokenImage(pkg.coverImageUrl)} />
            : <Icon name="menu_book" size="lg" className="text-brand-primary-600" />}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><ServiceStatusBadge status={pkg.status} />{updated && <span className="text-caption text-fg-secondary">Cập nhật {formatRelativeTime(updated)}</span>}</div>
          <h2 className="break-words text-[18px] font-semibold leading-snug text-fg">{pkg.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {pkg.subjectName && <span className="max-w-full break-words rounded-lg bg-brand-primary-50 px-2.5 py-1 text-caption font-medium text-brand-primary-700">{pkg.subjectName}</span>}
            {(Array.isArray(pkg.tags) ? pkg.tags : []).slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ServiceLessonChips totalSessions={pkg.totalSessions} sessionDurationMinutes={pkg.sessionDurationMinutes} />
            {pkg.studentCount != null && <span className="inline-flex items-center gap-1.5 py-1 text-caption text-fg-secondary"><Icon name="group" size="sm" />{pkg.studentCount} học viên</span>}
            {(pkg.trialVideoUrl || pkg.trialLessonUrl) && <ServiceTrialBadge />}
          </div>
        </div>
      </div>
      <div className="space-y-3 border-t border-border pt-4 xl:w-60 xl:shrink-0 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
        <div><p className="text-caption text-fg-secondary">Học phí trọn gói</p><p className="mt-1 text-2xl font-semibold text-fg"><Money value={price} /></p></div>
        {perSession !== null && <div className="rounded-xl border border-[rgb(var(--course-price-border))] bg-[rgb(var(--course-price-subtle))] px-3 py-2 text-[rgb(var(--course-price-strong))]"><p className="text-[11px] font-medium">Chi phí quy đổi mỗi buổi</p><p className="mt-1 text-body-reg font-semibold">{!Number.isInteger(perSession) && '≈ '}<Money value={Math.round(perSession)} /><span className="text-caption font-normal"> / buổi</span></p></div>}
      </div>
    </div>
    <div className="relative z-20 mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      {published && <Button as={Link} to={`/services/${pkg.id}`} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" icon={<Icon name="open_in_new" size="sm" />}>Xem trang công khai</Button>}
      <Button as={Link} to={editPath} state={editState} disabled={disabled} variant={draft ? 'primary' : 'outline'} size="sm" icon={<Icon name="edit" size="sm" />}>{draft ? 'Tiếp tục chỉnh sửa' : 'Chỉnh sửa'}</Button>
      {paused && <Button size="sm" disabled={disabled} loading={isActing} onClick={() => onResume(pkg)} icon={<Icon name="play_arrow" size="sm" />}>Mở lại tuyển sinh</Button>}
      {(draft || pkg.status === 'Unpublished') && <Button variant={draft ? 'outline' : 'primary'} size="sm" disabled={disabled} loading={isActing} onClick={() => onPublish(pkg)}>{draft ? 'Xuất bản' : 'Xuất bản lại'}</Button>}
      {menu.length > 0 && !disabled && <div className="ml-auto"><Menu label={`Thêm thao tác cho ${pkg.title}`} trigger={<span title="Thêm thao tác" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg-secondary hover:bg-neutral-100"><Icon name="more_vert" size="sm" /></span>} items={menu} /></div>}
    </div>
  </article>;
}
