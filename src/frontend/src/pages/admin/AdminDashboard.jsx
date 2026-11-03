import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import adminService from '@/services/admin.service';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import Icon from '@/components/ui/Icon';

const PERIODS = { All: 'Toàn thời gian', Today: 'Hôm nay', SevenDays: '7 ngày', ThirtyDays: '30 ngày' };
const percent = (value, total) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(total > 0 ? value / total * 100 : 0);

export default function AdminDashboard() {
  const [period, setPeriod] = useState('All');
  const [reload, setReload] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    adminService.getStats(period, controller.signal).then(data => {
      if (!controller.signal.aborted) setStats(data);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [period, reload]);

  const { users, bookings, financials, actionQueue } = stats || {};
  const queues = actionQueue ? [
    { label: 'Báo cáo vi phạm', count: actionQueue.openReportsCount, path: '/admin/trust-reports?status=Open', icon: 'flag' },
    { label: 'Lệnh rút tiền', count: actionQueue.pendingWithdrawalsCount, path: '/admin/withdrawals', icon: 'payments' },
    { label: 'Hồ sơ gia sư', count: actionQueue.pendingTutorsCount, path: '/admin/tutor-applications', icon: 'verified_user' },
    { label: 'Tranh chấp học phí', count: actionQueue.openDisputesCount, path: '/admin/disputes', icon: 'gavel' },
  ] : [];
  const pending = queues.filter(q => q.count > 0);
  const gmv = financials?.totalGmv || 0;
  const flows = financials ? [
    { label: 'Đã giải ngân cho gia sư', value: financials.totalTutorPayouts, color: 'bg-success-strong', description: 'Thu nhập gia sư từ các giao dịch giải ngân đã xác nhận trong kỳ.' },
    { label: 'Phí sàn sau điều chỉnh', value: financials.totalPlatformRevenue, color: 'bg-brand-primary-600', description: 'Phí từ giao dịch giải ngân, trừ các khoản đảo phí phát sinh trong kỳ.' },
    { label: 'Đã hoàn tiền / Bồi hoàn', value: financials.totalRefundedAmount, color: 'bg-holding', description: 'Các giao dịch hoàn tiền đã hoàn tất trong kỳ.' },
  ] : [];
  const difference = gmv - flows.reduce((sum, item) => sum + item.value, 0);
  const kpis = financials ? [
    { label: 'Tổng GMV', value: gmv, icon: 'receipt_long', hint: 'Giá trị gói học thanh toán trong kỳ', primary: true },
    { label: 'Phí sàn sau điều chỉnh', value: financials.totalPlatformRevenue, icon: 'trending_up', hint: `${percent(financials.totalPlatformRevenue, gmv)}% GMV` },
    { label: 'Đã giải ngân', value: financials.totalTutorPayouts, icon: 'payments', hint: `${percent(financials.totalTutorPayouts, gmv)}% GMV`, positive: true },
    { label: 'Đã hoàn tiền / Bồi hoàn', value: financials.totalRefundedAmount, icon: 'refresh', hint: financials.totalRefundedAmount ? 'Chỉ tính giao dịch đã hoàn tất' : 'Chưa ghi nhận hoàn tiền hoàn tất' },
  ] : [];

  return <div className="space-y-6 lg:space-y-8">
    <WorkspacePageHeader title="Tổng quan quản trị" description="Theo dõi hoạt động, xử lý yêu cầu và quản lý học phí."
      actions={<div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="dashboard-period">Phạm vi thống kê</label>
        <select id="dashboard-period" value={period} onChange={event => setPeriod(event.target.value)} className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
          {Object.entries(PERIODS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <Button variant="outline" size="sm" loading={loading} onClick={() => setReload(value => value + 1)} icon={<Icon name="refresh" size="sm" />}>Làm mới</Button>
      </div>} />

    {loading ? <StatsSkeleton count={4} /> : error || !stats ? <ErrorState error={error} title="Không thể tải dữ liệu điều hành" onRetry={() => setReload(value => value + 1)} /> : <>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-fg-secondary">
        <p>Số liệu phát sinh: <strong className="font-medium text-fg">{PERIODS[stats.period] || PERIODS[period]}</strong> · Giờ Việt Nam</p>
        {stats.updatedAt && <p>Cập nhật lúc {formatDateTime(stats.updatedAt)}</p>}
      </div>

      <section aria-label="Chỉ số tài chính" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(kpi => <div key={kpi.label} className={cn('min-w-0 rounded-2xl border p-5', kpi.primary ? 'border-brand-primary-100 bg-brand-primary-50' : 'border-border bg-surface')}>
          <div className="mb-4 flex items-center gap-2 text-sm text-fg-secondary">
            <Icon name={kpi.icon} size="sm" className={kpi.primary ? 'text-brand-primary-600' : kpi.positive ? 'text-success-strong' : 'text-fg-muted'} />
            <h2 className="font-medium">{kpi.label}</h2>
          </div>
          <Money value={kpi.value} className={cn('block font-semibold text-fg', kpi.primary ? 'text-2xl' : 'text-xl')} />
          <p className="mt-2 text-xs leading-5 text-fg-secondary">{kpi.hint}</p>
        </div>)}
      </section>

      <Card padding="lg">
        <CardHeader title="Công việc cần xử lý" subtitle="Trạng thái hiện tại · Không phụ thuộc bộ lọc thời gian" />
        {pending.length === 0 ? <div className="mt-4 flex items-start gap-3 rounded-xl bg-success-subtle p-4">
          <Icon name="check_circle" size="md" className="mt-0.5 text-success-strong" />
          <div><p className="text-sm font-semibold text-fg">Không có yêu cầu mới đang chờ</p><p className="mt-1 text-xs text-fg-secondary">Cả {queues.length} nhóm công việc đều đã được xử lý.</p></div>
        </div> : <div className="mt-2 divide-y divide-border">
          {pending.map(queue => <Link key={queue.path} to={queue.path} className="flex min-h-16 items-center gap-3 rounded-lg py-3 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
            <Icon name={queue.icon} size="md" className="text-holding-strong" /><span className="flex-1 font-medium">{queue.label}</span><span className="tabular-nums font-semibold text-holding-strong">{queue.count} chờ xử lý</span><Icon name="chevron_right" size="sm" />
          </Link>)}
        </div>}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-secondary">
          {queues.map(queue => <span key={queue.path}>{queue.label}: <strong className="font-medium tabular-nums text-fg">{queue.count}</strong></span>)}
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
        <Card padding="lg" className="xl:col-span-3">
          <CardHeader title="Dòng tiền học phí" subtitle="Các khoản phát sinh trong phạm vi đã chọn" />
          <dl className="mt-5 divide-y divide-border text-sm">
            {flows.map(flow => <div key={flow.label} className="py-3 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><dt className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', flow.color)} /><span>{flow.label}</span></dt><dd><Money value={flow.value} className="font-semibold" /></dd></div>
              <p className="mt-1 text-xs leading-5 text-fg-secondary">{flow.description}</p>
            </div>)}
            <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="font-medium">Chênh lệch so với GMV</dt><dd><Money value={difference} className="font-semibold" /></dd></div>
          </dl>
          {financials.pendingRefundAmount > 0 && <p className="mb-3 flex flex-wrap justify-between gap-2 text-sm text-holding-strong"><span>Hoàn tiền đang chờ</span><Money value={financials.pendingRefundAmount} /></p>}
          <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-fg-secondary">GMV trừ giải ngân, phí sàn và hoàn tiền đã hoàn tất. Các khoản có thể thuộc gói học mua ở kỳ khác; chênh lệch này không phải số dư Escrow đã đối soát.</p>
          <Link to="/admin/transactions" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand-primary-600 focus-visible:ring-2 focus-visible:ring-brand-primary-500">Xem sổ giao dịch<Icon name="arrow_forward" size="sm" /></Link>
        </Card>

        <Card padding="lg" className="xl:col-span-2">
          <CardHeader title="Sức khỏe nền tảng" />
          <div className="mt-5 border-b border-border pb-5">
            <h3 className="text-sm font-medium">Thanh toán</h3>
            <p className="mt-1 text-xs text-fg-secondary">Theo đơn đặt chỗ được tạo trong kỳ</p>
            <div className="mt-4 flex items-baseline justify-between gap-3"><span className="text-sm text-fg-secondary">Đã thanh toán</span><strong className="text-xl tabular-nums text-success-strong">{percent(bookings.paidBookings, bookings.totalBookings)}%</strong></div>
            <p className="mt-1 text-right text-xs tabular-nums text-fg-secondary">{bookings.paidBookings}/{bookings.totalBookings} đơn đặt chỗ</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true"><div className="h-full bg-success-strong" style={{ width: `${bookings.totalBookings ? bookings.paidBookings / bookings.totalBookings * 100 : 0}%` }} /></div>
          </div>
          <div className="pt-5">
            <h3 className="text-sm font-medium">Người dùng hiện tại</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[[ 'Học viên', users.totalStudents ], [ 'Gia sư', users.totalTutors ], [ 'Tổng tài khoản', users.totalUsers ], [ 'Đang hoạt động', users.activeUsers ]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-fg-secondary">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}
            </dl>
            <p className="mt-4 text-xs leading-5 text-fg-secondary">Tổng tài khoản gồm cả quản trị viên. Đang hoạt động là số tài khoản có trạng thái hoạt động ở tất cả vai trò.</p>
          </div>
        </Card>
      </div>
    </>}
  </div>;
}
