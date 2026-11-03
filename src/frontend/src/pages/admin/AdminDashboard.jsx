import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import adminService from '@/services/admin.service';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import Icon from '@/components/ui/Icon';

const PERIODS = { All: 'Toàn thời gian', Today: 'Hôm nay', SevenDays: '7 ngày', ThirtyDays: '30 ngày' };
const percent = (value, total) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(total > 0 ? value / total * 100 : 0);

const TONES = {
  blue: { surface: 'bg-brand-primary-50 border-brand-primary-100', icon: 'bg-brand-primary-100 text-brand-primary-700' },
  insight: { surface: 'bg-insight-subtle border-insight-border', icon: 'bg-insight-strong/10 text-insight-strong' },
  success: { surface: 'bg-success-subtle border-success/20', icon: 'bg-success/10 text-success-strong' },
  holding: { surface: 'bg-holding-subtle border-holding/20', icon: 'bg-holding/10 text-holding-strong' },
  danger: { surface: 'bg-danger-subtle border-danger/20', icon: 'bg-danger/10 text-danger-strong' },
  neutral: { surface: 'bg-neutral-50 border-border', icon: 'bg-neutral-100 text-fg-secondary' },
};

function SectionHeader({ title, description, icon, tone }) {
  return <div className="flex items-center gap-3">
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone].icon)}><Icon name={icon} size="md" /></span>
    <div className="min-w-0"><h2 className="text-lg font-semibold text-fg">{title}</h2>{description && <p className="mt-0.5 text-xs text-fg-secondary">{description}</p>}</div>
  </div>;
}

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
    { label: 'Báo cáo vi phạm', count: actionQueue.openReportsCount, path: '/admin/trust-reports?status=Open', icon: 'flag', tone: 'danger' },
    { label: 'Lệnh rút tiền', count: actionQueue.pendingWithdrawalsCount, path: '/admin/withdrawals', icon: 'payments', tone: 'blue' },
    { label: 'Hồ sơ gia sư', count: actionQueue.pendingTutorsCount, path: '/admin/tutor-applications', icon: 'verified_user', tone: 'success' },
    { label: 'Tranh chấp học phí', count: actionQueue.openDisputesCount, path: '/admin/disputes', icon: 'gavel', tone: 'holding' },
  ] : [];
  const pending = queues.filter(q => q.count > 0);
  const gmv = financials?.totalGmv || 0;
  const flows = financials ? [
    { label: 'Đã giải ngân cho gia sư', value: financials.totalTutorPayouts, color: 'bg-success-strong', icon: 'payments', tone: 'success', description: 'Thu nhập gia sư từ các giao dịch giải ngân đã xác nhận trong kỳ.' },
    { label: 'Phí sàn sau điều chỉnh', value: financials.totalPlatformRevenue, color: 'bg-insight-strong', icon: 'trending_up', tone: 'insight', description: 'Phí từ giao dịch giải ngân, trừ các khoản đảo phí phát sinh trong kỳ.' },
    { label: 'Đã hoàn tiền / Bồi hoàn', value: financials.totalRefundedAmount, color: 'bg-holding', icon: 'refresh', tone: 'holding', description: 'Các giao dịch hoàn tiền đã hoàn tất trong kỳ.' },
  ] : [];
  const difference = gmv - flows.reduce((sum, item) => sum + item.value, 0);
  const canShowComposition = gmv > 0 && difference >= 0 && flows.every(flow => flow.value >= 0);
  const chartFlows = [...flows, { label: 'Chênh lệch so với GMV', value: difference, color: 'bg-neutral-300' }];
  const kpis = financials ? [
    { label: 'Tổng GMV', value: gmv, icon: 'receipt_long', hint: 'Gói học đã thanh toán', primary: true, tone: 'blue' },
    { label: 'Phí sàn sau điều chỉnh', value: financials.totalPlatformRevenue, icon: 'trending_up', hint: `${percent(financials.totalPlatformRevenue, gmv)}% GMV`, tone: 'insight' },
    { label: 'Đã giải ngân', value: financials.totalTutorPayouts, icon: 'payments', hint: `${percent(financials.totalTutorPayouts, gmv)}% GMV`, tone: 'success' },
    { label: 'Đã hoàn tiền / Bồi hoàn', value: financials.totalRefundedAmount, icon: 'refresh', hint: financials.totalRefundedAmount ? 'Giao dịch đã hoàn tất' : 'Chưa phát sinh hoàn tiền', tone: 'holding' },
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
        {kpis.map(kpi => <div key={kpi.label} className={cn('min-w-0 rounded-2xl border p-5', TONES[kpi.tone].surface)}>
          <span className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-full', TONES[kpi.tone].icon)}><Icon name={kpi.icon} size="md" /></span>
          <h2 className="mb-2 text-sm font-medium text-fg-secondary">{kpi.label}</h2>
          <Money value={kpi.value} className={cn('block font-semibold text-fg', kpi.primary ? 'text-2xl' : 'text-xl')} />
          <p className="mt-2 text-xs leading-5 text-fg-secondary">{kpi.hint}</p>
        </div>)}
      </section>

      <Card padding="lg">
        <SectionHeader title="Công việc cần xử lý" description="Hiện tại · Tất cả thời gian" icon="flag" tone={pending.length ? 'holding' : 'success'} />
        {pending.length === 0 ? <div className="mt-5 flex items-start gap-3 rounded-xl border border-success/20 bg-success-subtle p-4">
          <Icon name="check_circle" size="md" className="mt-0.5 text-success-strong" />
          <div><p className="text-sm font-semibold text-success-strong">Không có yêu cầu mới đang chờ</p><p className="mt-1 text-xs text-fg-secondary">Không có việc tồn đọng trong {queues.length} nhóm theo dõi.</p></div>
        </div> : <div className="mt-2 divide-y divide-border">
          {pending.map(queue => <Link key={queue.path} to={queue.path} className="flex min-h-16 items-center gap-3 rounded-lg py-3 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TONES[queue.tone].icon)}><Icon name={queue.icon} size="sm" /></span><span className="flex-1 font-medium">{queue.label}</span><span className="tabular-nums font-semibold text-holding-strong">{queue.count} chờ xử lý</span><Icon name="chevron_right" size="sm" />
          </Link>)}
        </div>}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {queues.map(queue => <div key={queue.path} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs', TONES[queue.tone].surface)}>
            <Icon name={queue.icon} size="xs" className={TONES[queue.tone].icon.split(' ').find(value => value.startsWith('text-'))} /><span className="flex-1 text-fg-secondary">{queue.label}</span><strong className="text-sm tabular-nums text-fg">{queue.count}</strong>
          </div>)}
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
        <Card padding="lg" className="xl:col-span-3">
          <SectionHeader title="Dòng tiền học phí" description="Tổng hợp dòng tiền trong kỳ" icon="pie_chart" tone="blue" />
          {canShowComposition && <figure className="mt-6" aria-label="Các khoản so với tổng GMV">
            <figcaption className="mb-3 flex items-center justify-between gap-2 text-xs text-fg-secondary"><span>So với tổng GMV</span><Money value={gmv} className="font-semibold text-fg" /></figcaption>
            <div className="flex h-4 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
              {chartFlows.filter(flow => flow.value > 0).map(flow => <div key={flow.label} className={flow.color} style={{ width: `${flow.value / gmv * 100}%` }} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-fg-secondary">{chartFlows.map(flow => <span key={flow.label} className="inline-flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', flow.color)} />{flow.label}: {percent(flow.value, gmv)}%</span>)}</div>
          </figure>}
          <dl className="mt-5 divide-y divide-border text-sm">
            {flows.map(flow => <div key={flow.label} className="py-3 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><dt className="flex items-center gap-2"><span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONES[flow.tone].icon)}><Icon name={flow.icon} size="sm" /></span><span>{flow.label}</span></dt><dd><Money value={flow.value} className="font-semibold" /></dd></div>
            </div>)}
          </dl>
          {financials.pendingRefundAmount > 0 && <p className="mb-3 flex flex-wrap justify-between gap-2 text-sm text-holding-strong"><span>Hoàn tiền đang chờ</span><Money value={financials.pendingRefundAmount} /></p>}
          <div className="mt-2 rounded-xl border border-insight-border bg-insight-subtle p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-2 font-medium"><Icon name="info" size="sm" className="text-insight-strong" />Chênh lệch so với GMV</span><Money value={difference} className="font-semibold text-insight-strong" /></div>
            <p className="mt-2 text-xs text-fg-secondary">Không đồng nghĩa với số dư Escrow.</p>
            <details className="mt-3 text-xs leading-5 text-fg-secondary">
              <summary className="w-fit cursor-pointer rounded font-medium text-insight-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">Xem giải thích cách tính</summary>
              <p className="mt-2">GMV trừ giải ngân, phí sàn và hoàn tiền đã hoàn tất. Các khoản có thể thuộc gói học mua ở kỳ khác; chênh lệch này không phải số dư Escrow đã đối soát.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">{flows.map(flow => <li key={flow.label}>{flow.description}</li>)}</ul>
            </details>
          </div>
          <Link to="/admin/transactions" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand-primary-600 focus-visible:ring-2 focus-visible:ring-brand-primary-500">Xem sổ giao dịch<Icon name="arrow_forward" size="sm" /></Link>
        </Card>

        <Card padding="lg" className="xl:col-span-2">
          <SectionHeader title="Sức khỏe nền tảng" icon="group" tone="success" />
          <div className="mt-5 rounded-xl border border-success/20 bg-success-subtle p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium"><Icon name="receipt_long" size="sm" className="text-success-strong" />Thanh toán</h3>
            <p className="mt-1 text-xs text-fg-secondary">Theo đơn được tạo trong kỳ</p>
            <div className="mt-4 flex items-baseline justify-between gap-3"><span className="text-sm text-fg-secondary">Đã thanh toán</span><strong className="text-3xl tabular-nums text-success-strong">{percent(bookings.paidBookings, bookings.totalBookings)}%</strong></div>
            <p className="mt-1 text-right text-xs tabular-nums text-fg-secondary">{bookings.paidBookings}/{bookings.totalBookings} đơn đặt chỗ</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true"><div className="h-full bg-success-strong" style={{ width: `${bookings.totalBookings ? bookings.paidBookings / bookings.totalBookings * 100 : 0}%` }} /></div>
          </div>
          <div className="pt-5">
            <h3 className="text-sm font-medium">Người dùng hiện tại</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Học viên', value: users.totalStudents, icon: 'school', tone: 'blue' },
                { label: 'Gia sư', value: users.totalTutors, icon: 'person', tone: 'insight' },
                { label: 'Tổng tài khoản', value: users.totalUsers, icon: 'group', tone: 'neutral' },
                { label: 'Đang hoạt động', value: users.activeUsers, icon: 'check_circle', tone: 'success' },
              ].map(tile => <div key={tile.label} className={cn('rounded-xl border p-3', TONES[tile.tone].surface)}>
                <dt className="text-xs text-fg-secondary"><span className={cn('mb-2 flex h-7 w-7 items-center justify-center rounded-lg', TONES[tile.tone].icon)}><Icon name={tile.icon} size="sm" /></span>{tile.label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</dd>
              </div>)}
            </dl>
            <details className="mt-4 text-xs leading-5 text-fg-secondary"><summary className="w-fit cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">Phạm vi thống kê tài khoản</summary><p className="mt-2">Tổng tài khoản gồm cả quản trị viên. Đang hoạt động là số tài khoản có trạng thái hoạt động ở tất cả vai trò.</p></details>
          </div>
        </Card>
      </div>
    </>}
  </div>;
}
