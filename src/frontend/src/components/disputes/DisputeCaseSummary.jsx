import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { formatDateTime } from '@/utils/formatters';

const STATES = {
  Open: ['Đã tiếp nhận', 'inbox', 'neutral', 'TutorHub đã tiếp nhận báo cáo. Đây chưa phải kết luận về trách nhiệm của các bên.'],
  UnderReview: ['Đang xem xét', 'search', 'primary', 'TutorHub đang xem xét nội dung và bằng chứng do các bên cung cấp.'],
  Resolved: ['Đã có kết luận', 'check_circle', 'success', 'Bạn có thể xem kết luận và ghi chú xử lý trong lịch sử bên dưới.'],
  Dismissed: ['Đã kết thúc', 'check_circle', 'neutral', 'Vụ việc đã được đóng. Kết quả xử lý được lưu trong lịch sử.'],
  RequiresAdminFinancialIntervention: ['Chờ xử lý tài chính', 'account_balance_wallet', 'holding', 'TutorHub đang kiểm tra phương án xử lý học phí liên quan đến vụ việc.'],
  RequiresAdminRefundSettlement: ['Chờ xử lý hoàn tiền', 'account_balance_wallet', 'holding', 'TutorHub đang xử lý khoản hoàn tiền theo kết quả xem xét.'],
};

export function CaseStatus({ status }) {
  const [label, icon, tone] = STATES[status] || ['Đang cập nhật', 'info', 'neutral'];
  return <StatusIndicator variant={tone} icon={icon} size="md">{label}</StatusIndicator>;
}

export default function DisputeCaseSummary({ dispute, workspace }) {
  const activeHold = dispute.holdStatus === 'Active';
  const released = dispute.holdStatus === 'Released';
  const escrowHold = activeHold && dispute.holdType === 'EscrowHold';
  return <aside aria-label="Trạng thái và học phí" className="space-y-5 rounded-2xl border border-border bg-surface p-5 lg:p-6">
    <section className="space-y-3"><h2 className="text-sm font-semibold text-fg">Trạng thái vụ việc</h2><CaseStatus status={dispute.status} /><p className="text-sm leading-relaxed text-fg-secondary">{STATES[dispute.status]?.[3] || 'Vui lòng làm mới trạng thái để xem cập nhật của vụ việc.'}</p></section>
    <section className="space-y-2 border-t border-border pt-5"><h2 className="text-sm text-fg-secondary">{activeHold ? 'Học phí đang tạm giữ' : released ? 'Khoản tạm giữ ban đầu' : 'Giá trị tạm giữ được ghi nhận'}</h2><p className="break-words text-[28px] font-semibold text-fg">{dispute.heldAmount != null ? <Money value={dispute.heldAmount} /> : 'Chưa có dữ liệu'}</p>
      <p className={`inline-flex items-center gap-1.5 text-caption font-medium ${activeHold ? 'text-holding-strong' : 'text-fg-secondary'}`}><Icon name={activeHold ? 'lock' : 'info'} size="xs" />{escrowHold ? 'Chưa giải ngân' : activeHold ? 'Đang tạm giữ trong ví' : released ? 'Khoản tạm giữ đã được xử lý' : 'Chưa xác nhận khoản tạm giữ đang hoạt động'}</p>
      <p className="text-caption leading-relaxed text-fg-secondary">{activeHold ? 'Khoản tiền này được xử lý theo kết quả xem xét của TutorHub.' : 'Xem kết luận vụ việc và lịch sử ví để đối chiếu học phí.'}</p>
    </section>
    <dl className="space-y-3 border-t border-border pt-5 text-sm"><div><dt className="text-fg-secondary">Người gửi báo cáo</dt><dd className="mt-1 break-words font-medium text-fg">{dispute.initiatorName}</dd></div><div><dt className="text-fg-secondary">Thời gian tiếp nhận</dt><dd className="mt-1 text-fg">{formatDateTime(dispute.createdAt, 'DD/MM/YYYY · HH:mm')}</dd></div></dl>
    <nav aria-label="Thông tin liên quan" className="space-y-1 border-t border-border pt-4">{[[`/${workspace}/sessions/${dispute.sessionId}`, 'Xem buổi học'], [`/${workspace}/enrollments/${dispute.enrollmentId}`, 'Xem hợp đồng']].map(([to, text]) => <Link key={to} to={to} className="flex min-h-11 items-center justify-between gap-2 rounded-lg text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">{text}<Icon name="arrow_forward" size="sm" /></Link>)}</nav>
  </aside>;
}
