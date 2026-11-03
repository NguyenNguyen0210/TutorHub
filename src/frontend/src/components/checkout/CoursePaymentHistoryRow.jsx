import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Money from '@/components/ui/Money';
import { formatDateTime } from '@/utils/formatters';
import { summarizeTuition } from '@/utils/studentDashboard';

export default function CoursePaymentHistoryRow({ payment, focused = false }) {
  const enrollment = payment.enrollment;
  const captured = ['Held', 'Released', 'Refunded', 'Succeeded'].includes(payment.status);
  const paymentState = captured ? { label: 'Thành công', tone: 'success' }
    : payment.status === 'Failed' ? { label: 'Thất bại', tone: 'danger' }
    : payment.status === 'Pending' ? { label: ['Expired', 'Cancelled'].includes(payment.bookingStatus) ? 'Chưa thanh toán' : 'Chờ xác nhận', tone: 'neutral' }
    : { label: 'Chưa có thông tin', tone: 'neutral' };
  const reference = payment.paymentGatewayRef || '';
  const source = reference.startsWith('STUDENT_WALLET:') ? 'Ví học viên'
    : /^THB\d{12}[A-Z0-9]{6}(?:\||$)/.test(reference) || reference.startsWith('VNPAY') ? 'VNPAY' : 'Chưa có thông tin';
  const tuition = enrollment ? summarizeTuition([enrollment]) : null;
  let escrow = { label: 'Chưa có thông tin', tone: 'neutral' };
  if (!captured) escrow = { label: 'Không áp dụng', tone: 'neutral' };
  else if (tuition && tuition.totalTuition > 0) {
    if (tuition.escrowRemaining > 0) escrow = {
      label: tuition.escrowReleased > 0 ? 'Đã giải ngân một phần' : tuition.escrowRefunded > 0 ? 'Đã hoàn một phần' : 'Đang ký quỹ', tone: 'holding',
    };
    else escrow = { label: tuition.escrowRefunded >= tuition.totalTuition ? 'Đã hoàn tiền' : tuition.escrowReleased >= tuition.totalTuition ? 'Đã giải ngân' : 'Đã quyết toán', tone: 'success' };
  } else if (payment.status === 'Released') escrow = { label: 'Đã giải ngân', tone: 'success' };
  else if (payment.status === 'Refunded') escrow = { label: 'Đã hoàn tiền', tone: 'success' };
  const enrollmentId = payment.enrollmentId || enrollment?.id;

  return (
    <tr id={`wallet-record-${payment.id}`} className={focused ? 'bg-brand-primary-50 ring-1 ring-inset ring-brand-primary-200' : 'transition-colors hover:bg-neutral-50'}>
      <td className="max-w-sm px-4 py-4 align-top">
        <p className="font-semibold leading-relaxed text-fg">{payment.serviceTitle || enrollment?.serviceTitle || payment.subjectName || 'Gói học'}</p>
        {payment.otherPartyName && <p className="mt-1 text-fg-secondary">Gia sư: {payment.otherPartyName}</p>}
        <details open={focused || undefined} className="mt-3 text-fg-secondary">
          <summary className="w-fit cursor-pointer rounded font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Chi tiết thanh toán</summary>
          <dl className="mt-3 space-y-2 break-words">
            <div><dt>Thời gian tạo giao dịch</dt><dd className="text-fg">{formatDateTime(payment.createdAt)}</dd></div>
            <div><dt>Mã giao dịch</dt><dd className="break-all text-fg">{payment.id}</dd></div>
            <div><dt>Mã đặt chỗ</dt><dd className="break-all text-fg">{payment.bookingId}</dd></div>
            {reference && <div><dt>Mã đối soát</dt><dd className="break-all text-fg">{reference}</dd></div>}
            {captured && tuition && <div className="space-y-1 border-t border-border pt-2">
              <p>Đang ký quỹ: <Money value={tuition.escrowRemaining} /></p>
              <p>Đã giải ngân: <Money value={tuition.escrowReleased} /></p>
              {tuition.escrowRefunded > 0 && <p>Đã hoàn tiền: <Money value={tuition.escrowRefunded} /></p>}
            </div>}
          </dl>
        </details>
        {enrollmentId && <Link to={`/student/enrollments/${enrollmentId}`} className="mt-2 inline-flex min-h-11 items-center rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Xem hợp đồng →</Link>}
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-top text-fg-secondary">{source}</td>
      <td className="whitespace-nowrap px-4 py-4 text-right align-top font-semibold text-fg"><Money value={payment.grossAmount} /></td>
      <td className="whitespace-nowrap px-4 py-4 align-top"><Badge size="sm" variant={paymentState.tone}>{paymentState.label}</Badge></td>
      <td className="px-4 py-4 align-top"><Badge size="sm" variant={escrow.tone}>{escrow.label}</Badge>
        {captured && !tuition && enrollmentId && <p className="mt-2 text-fg-secondary">Xem hợp đồng để kiểm tra học phí.</p>}
      </td>
    </tr>
  );
}
