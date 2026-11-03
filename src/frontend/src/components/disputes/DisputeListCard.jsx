import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/utils/formatters';
import { CLOSED_DISPUTES, DISPUTE_REASONS, lastDisputeActivity } from '@/utils/disputeList';

const statuses = {
  Open: ['Đã tiếp nhận', 'border-l-brand-secondary-500', 'bg-holding-subtle text-holding-strong', 'inbox'],
  UnderReview: ['Đang xem xét', 'border-l-primary', 'bg-brand-primary-50 text-primary', 'search'],
  RequiresAdminFinancialIntervention: ['Chờ xử lý tài chính', 'border-l-brand-secondary-500', 'bg-holding-subtle text-holding-strong', 'account_balance_wallet'],
  RequiresAdminRefundSettlement: ['Chờ xử lý hoàn tiền', 'border-l-brand-secondary-500', 'bg-holding-subtle text-holding-strong', 'account_balance_wallet'],
  Resolved: ['Đã có kết luận', 'border-l-success-strong', 'bg-success-subtle text-success-strong', 'check_circle'],
  Dismissed: ['Đã kết thúc', 'border-l-neutral-300', 'bg-neutral-100 text-fg-secondary', 'check_circle'],
};
export default function DisputeListCard({ item, isTutor }) {
  const [label, accent, tone, icon] = statuses[item.status] || ['Đang cập nhật', 'border-l-neutral-300', 'bg-neutral-100 text-fg-secondary', 'info'];
  const activeHold = item.holdStatus === 'Active';
  const updated = lastDisputeActivity(item);
  const other = isTutor ? item.studentName : item.tutorName;
  const avatar = isTutor ? item.studentAvatarUrl : item.tutorAvatarUrl;
  const title = item.serviceTitle || item.subjectName || 'Chưa có thông tin gói học';
  return <article className={cn('min-w-0 rounded-2xl border border-l-4 border-border bg-surface shadow-sm', accent)}>
    <div className="grid min-w-0 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-8">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-fg">Khiếu nại buổi học #{item.sessionNumber != null ? String(item.sessionNumber).padStart(2, '0') : '—'}</h2>
        <div className="mt-3 flex items-start gap-2 text-sm"><Icon name="menu_book" size="sm" className="mt-0.5 shrink-0 text-primary" /><div className="min-w-0"><p className="break-words font-medium leading-relaxed text-fg">{title}</p>{item.subjectName && item.subjectName !== title && <p className="mt-1 text-xs text-fg-secondary">{item.subjectName}</p>}</div></div>
        <div className="mt-4 flex items-center gap-2.5"><Avatar src={avatar} name={other || 'Người dùng'} size="sm" /><p className="min-w-0 break-words text-sm text-fg-secondary">{isTutor ? 'Học viên' : 'Gia sư'}: <span className="font-medium text-fg">{other || 'Chưa có thông tin'}</span></p></div>
        <p className="mt-4 text-sm font-medium leading-relaxed text-fg"><span className="font-normal text-fg-secondary">Lý do: </span>{DISPUTE_REASONS[item.reason] || 'Chưa có thông tin lý do'}</p>
        <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg-secondary [overflow-wrap:anywhere]">{item.description?.trim() ? item.description : 'Chưa có mô tả chi tiết.'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-secondary"><span className="inline-flex items-center gap-1.5"><Icon name="schedule" size="xs" />Gửi lúc {formatDateTime(item.createdAt, 'DD/MM/YYYY · HH:mm')}</span>{updated && Date.parse(updated) > Date.parse(item.createdAt) && <span>Cập nhật {formatDateTime(updated, 'DD/MM/YYYY · HH:mm')}</span>}</div>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-5 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium', tone)}><Icon name={icon} size="xs" />{label}</span>
        <div className={cn('w-full rounded-xl p-4', activeHold ? 'bg-holding-subtle' : 'bg-neutral-50')}><p className="text-xs text-fg-secondary">{activeHold ? 'Học phí đang tạm giữ' : item.holdStatus === 'Released' ? 'Khoản tạm giữ ban đầu' : 'Khoản tạm giữ được ghi nhận'}</p><p className={cn('mt-2 break-words text-xl font-semibold', activeHold ? 'text-holding-strong' : 'text-fg')}>{item.heldAmount != null ? <Money value={item.heldAmount} /> : 'Chưa có dữ liệu'}</p>{item.holdStatus === 'Released' && <p className="mt-2 text-xs text-fg-secondary">Khoản tạm giữ đã được xử lý</p>}</div>
        <Button as={Link} to={`/app/disputes/${item.id}`} className="mt-auto w-full" variant={CLOSED_DISPUTES.includes(item.status) ? 'outline' : 'primary'} icon={<Icon name="arrow_forward" size="sm" />}>Xem chi tiết</Button>
      </div>
    </div>
  </article>;
}
DisputeListCard.propTypes = { item: PropTypes.object.isRequired, isTutor: PropTypes.bool };
