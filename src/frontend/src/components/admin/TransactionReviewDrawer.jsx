import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatters';
import { TRANSACTION_TYPES } from '@/utils/adminTransactions';
import { Drawer } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { TransactionIcon, TransactionStatus } from './TransactionPresentation';
import RefundSettlementPanel from './RefundSettlementPanel';

export default function TransactionReviewDrawer({ id, onClose, onSelect }) {
  const userId = useAuthStore(state => state.user?.id);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const detail = useQuery({ queryKey: ['admin-transaction', userId, id], queryFn: () => adminService.getTransaction(id), enabled: !!id, retry: false });
  const item = detail.data;
  useEffect(() => setPage(1), [item?.bookingId]);
  const related = useQuery({ queryKey: ['admin-transaction-related', userId, item?.bookingId, page], queryFn: () => adminService.getTransactions({ bookingId: item.bookingId, pageNumber: page, pageSize: 5, sort: 'Oldest' }), enabled: !!id && !!item?.bookingId, retry: false });
  const copy = async value => {
    try { await navigator.clipboard.writeText(value); toast.success('Đã sao chép mã giao dịch.'); }
    catch { toast.error('Không thể sao chép. Bạn có thể chọn mã để sao chép trực tiếp.'); }
  };
  return <Drawer open={!!id} onClose={onClose} title="Đối soát giao dịch" side="right" widthClass="w-full sm:max-w-2xl" panelClassName="max-w-full">
    {detail.isPending ? <p role="status" className="py-8 text-sm text-fg-secondary">Đang tải thông tin đối soát…</p> : detail.isError || !item ? <div className="space-y-4 py-8"><p role="alert" className="text-sm text-fg-secondary">Không thể mở giao dịch này. Vui lòng thử lại hoặc chọn giao dịch khác.</p><Button variant="outline" onClick={() => detail.refetch()}>Thử lại</Button></div> : <div className="space-y-6">
      <div className="rounded-xl border border-border bg-neutral-50 p-4">
        <div className="flex items-center gap-3"><TransactionIcon type={item.type} /><div><h3 className="text-base font-semibold">{TRANSACTION_TYPES[item.type]?.label || 'Giao dịch'}</h3><div className="mt-1"><TransactionStatus item={item} /></div></div></div>
        <Money value={item.grossAmount} className="mt-4 block text-3xl font-semibold" />
        {item.type === 'SessionPayoutCredit' && <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt>Phí nền tảng</dt><dd><Money value={item.platformFeeAmount} /></dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Thu nhập gia sư</dt><dd><Money value={item.payoutAmount} className="font-semibold" /></dd></div></dl>}
        {item.settlementRequired && <p className="mt-3 text-xs text-holding-strong">Cần hoàn tất đối soát thanh toán.</p>}
      </div>

      <section className="space-y-4" aria-label="Thông tin đối soát">
        <dl className="space-y-4 text-sm">
          <div><dt className="text-xs text-fg-secondary">Học viên</dt><dd className="mt-1 font-medium">{item.studentName}</dd><dd className="break-all text-xs text-fg-secondary">{item.studentEmail}</dd></div>
          <div><dt className="text-xs text-fg-secondary">Gia sư</dt><dd className="mt-1 font-medium">{item.tutorName}</dd><dd className="break-all text-xs text-fg-secondary">{item.tutorEmail}</dd></div>
          <div><dt className="text-xs text-fg-secondary">Gói học</dt><dd className="mt-1">{item.serviceTitle || item.subjectName}</dd></div>
          {item.sessionNumber != null && <div><dt className="text-xs text-fg-secondary">Buổi học liên quan</dt><dd className="mt-1">Buổi {item.sessionNumber}</dd></div>}
          {[[ 'Mã giao dịch', item.id ], [ 'Mã đơn đặt chỗ', item.bookingId ], [ 'Tham chiếu cổng thanh toán', item.paymentGatewayRef ], [ 'Mã buổi học', item.sessionId ]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-1 flex items-start gap-2"><code className="min-w-0 flex-1 select-all break-all text-xs">{value}</code><Button variant="ghost" size="sm" aria-label={`Sao chép ${label.toLowerCase()}`} onClick={() => copy(value)}><Icon name="content_copy" size="sm" /></Button></dd></div>)}
        </dl>
        {item.description && <p className="whitespace-pre-wrap break-words text-sm text-fg-secondary">{item.description}</p>}
        <div className="flex flex-wrap gap-3">
          {item.enrollmentId && <Button as={Link} to={`/admin/enrollments/${item.enrollmentId}`} variant="outline" size="sm">Xem hợp đồng</Button>}
          {item.disputeId && <Button as={Link} to={`/admin/disputes/${item.disputeId}`} variant="outline" size="sm">Xem tranh chấp</Button>}
          {item.relatedTransactionId && <Button variant="outline" size="sm" onClick={() => onSelect(item.relatedTransactionId)}>Xem giao dịch gốc</Button>}
        </div>
      </section>

      <RefundSettlementPanel key={item.id} item={item} />
      <section><h3 className="text-sm font-semibold">Mốc thời gian ghi nhận</h3><p className="mt-1 text-xs text-fg-secondary">Giờ Việt Nam (UTC+7)</p>
        <ol className="mt-4 space-y-4 border-l border-border pl-4 text-sm">
          {[
            { label: "Ghi nhận giao dịch", at: item.createdAt },
            ...(item.type === 'BookingPayment' ? [{ label: 'Xác nhận thanh toán đơn', at: item.bookingConfirmedAt }] : []),
            { label: 'Giải ngân', at: item.releasedAt }, { label: 'Hoàn tiền', at: item.refundedAt },
          ].filter(event => event.at).sort((a, b) => new Date(a.at) - new Date(b.at)).map(event => <li key={event.label}><p className="font-medium">{event.label}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(event.at)}</p></li>)}
        </ol>
      </section>

      <section className="border-t border-border pt-5"><h3 className="text-sm font-semibold">Các khoản thu, chi của đơn</h3><p className="mt-2 text-xs leading-5 text-fg-secondary">Thanh toán, giải ngân và hoàn tiền là các bước khác nhau; không cộng tất cả thành doanh thu.</p>
        {related.isPending ? <p role="status" className="mt-4 text-sm">Đang tải lịch sử thu, chi…</p> : related.isError ? <div className="mt-4"><p className="text-sm text-fg-secondary">Chưa tải được các khoản thu, chi liên quan. Vui lòng thử lại.</p><Button variant="ghost" size="sm" onClick={() => related.refetch()}>Thử lại</Button></div> : <>
          <div className="mt-3 divide-y divide-border">{related.data?.items?.map(row => <button type="button" key={row.id} aria-current={row.id === id ? 'true' : undefined} disabled={row.id === id} onClick={() => onSelect(row.id)} className="flex w-full items-start justify-between gap-3 rounded-lg py-3 text-left text-sm hover:bg-neutral-50 disabled:cursor-default focus-visible:ring-2 focus-visible:ring-brand-primary-500">
            <span className="min-w-0"><span className="block font-medium">{TRANSACTION_TYPES[row.type]?.label || 'Giao dịch'}{row.id === id && <span className="ml-2 text-xs font-normal text-fg-secondary">Đang xem</span>}</span><span className="mt-1 block text-xs text-fg-secondary">{formatDateTime(row.createdAt)}</span><span className="mt-1 block"><TransactionStatus item={row} /></span></span><Money value={row.grossAmount} className="shrink-0 font-semibold" />
          </button>)}</div>
          {related.data?.totalPages > 1 && <div className="mt-3 flex items-center justify-between gap-2 text-xs"><Button size="sm" variant="outline" disabled={!related.data.hasPreviousPage} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page}/{related.data.totalPages}</span><Button size="sm" variant="outline" disabled={!related.data.hasNextPage} onClick={() => setPage(page + 1)}>Tiếp</Button></div>}
        </>}
      </section>
    </div>}
  </Drawer>;
}
