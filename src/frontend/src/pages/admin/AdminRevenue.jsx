import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import RevenueMonthlyChart from '@/components/admin/RevenueMonthlyChart';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { cn } from '@/lib/cn';
import { revenueMonthLabel, revenueMonthLink, revenueNumber, revenuePeriodTotal } from '@/utils/revenuePresentation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import Icon from '@/components/ui/Icon';
import { Field, Select } from '@/components/ui/Input';
import { StatsSkeleton, TableSkeleton } from '@/components/common/Skeleton';

function Amount({ value, className }) {
  return revenueNumber(value) == null ? <span className={cn('text-fg-secondary', className)} aria-label="Chưa có dữ liệu">—</span> : <Money value={value} className={className} />;
}

export default function AdminRevenue() {
  const { user } = useAuthStore();
  const [months, setMonths] = useState(6);
  const overview = useQuery({ queryKey: ['admin-revenue-overview', user?.id], queryFn: adminService.getPlatformRevenue, retry: false });
  const chart = useQuery({ queryKey: ['admin-revenue-chart', user?.id, months], queryFn: () => adminService.getRevenueChart(months), retry: false });
  const points = chart.data?.data || [];
  const currentMonth = chart.data?.toMonth;
  const totals = overview.data || {};
  const detailMetrics = [
    { key: 'grossBookingVolume', label: 'Giá trị gói đã thanh toán', icon: 'receipt_long', tone: 'text-brand-primary-600' },
    { key: 'recognizedPlatformFee', label: 'Phí nền tảng đã ghi nhận', icon: 'trending_up', tone: 'text-insight-strong' },
    { key: 'platformFeeReversals', label: 'Phí nền tảng đã hoàn', icon: 'refresh', tone: 'text-holding-strong' },
  ];
  return <div className="space-y-6 lg:space-y-8">
    <WorkspacePageHeader title="Doanh thu nền tảng" description="Tổng quan tài chính và doanh thu phí TutorHub." />

    <section aria-labelledby="revenue-overview" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="revenue-overview" className="text-lg font-semibold">Lũy kế toàn hệ thống</h2><p className="text-xs text-fg-secondary">Không phụ thuộc bộ lọc biểu đồ</p></div>
      {overview.isPending ? <StatsSkeleton count={3} /> : overview.isError ? <Card padding="lg"><p role="alert" className="text-sm text-fg-secondary">Chưa tải được số liệu doanh thu.</p><Button className="mt-3" variant="outline" onClick={() => overview.refetch()}>Thử lại</Button></Card> : <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card padding="lg" variant="outlined" className="border-success/20 bg-success-subtle md:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success-strong"><Icon name="trending_up" size="md" /></span><h3 className="text-sm font-medium text-fg">Doanh thu phí thuần</h3></div>
            <Amount value={totals.netRecognizedPlatformRevenue} className={cn('mt-5 block text-3xl font-semibold sm:text-4xl', revenueNumber(totals.netRecognizedPlatformRevenue) < 0 ? 'text-insight-strong' : 'text-success-strong')} />
            <p className="mt-3 text-xs text-fg-secondary">Phí đã ghi nhận sau khi trừ phí hoàn.</p>
            <details className="mt-4 text-xs leading-5 text-fg-secondary"><summary className="w-fit cursor-pointer rounded font-medium text-success-strong focus-visible:ring-2 focus-visible:ring-brand-primary-500">Cách tính phí thuần</summary><p className="mt-2">Phí thuần = Phí đã ghi nhận − Phí đã hoàn. Học phí ký quỹ và phí dự kiến chưa được tính vào doanh thu.</p></details>
          </Card>
          <Card padding="lg" variant="outlined" className="border-brand-primary-100 bg-brand-primary-50">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-100 text-brand-primary-600"><Icon name="payments" size="md" /></span>
            <h3 className="text-sm font-medium">Học phí đã giải ngân</h3><Amount value={totals.grossReleasedEarnings} className="mt-4 block text-2xl font-semibold" /><p className="mt-3 text-xs text-fg-secondary">Trước phí nền tảng</p>
          </Card>
          <Card padding="lg" variant="outlined" className="border-holding/20 bg-holding-subtle">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-holding/10 text-holding-strong"><Icon name="schedule" size="md" /></span>
            <h3 className="text-sm font-medium">Phí dự kiến chưa ghi nhận</h3><Amount value={totals.unrecognizedPendingPlatformFee} className="mt-4 block text-2xl font-semibold" /><p className="mt-3 text-xs text-fg-secondary">Chưa cộng vào doanh thu phí thuần</p>
          </Card>
        </div>
        <Card padding="lg" variant="outlined">
          <div className="mb-5 flex items-center gap-2"><Icon name="pie_chart" size="sm" className="text-insight-strong" /><h3 className="text-sm font-semibold">Chi tiết doanh thu lũy kế</h3></div>
          <dl className="grid gap-5 md:grid-cols-3">{detailMetrics.map(metric => <div key={metric.key} className="min-w-0"><dt className="flex items-center gap-2 text-xs text-fg-secondary"><Icon name={metric.icon} size="sm" className={metric.tone} />{metric.label}</dt><dd className="mt-2"><Amount value={totals[metric.key]} className="text-xl font-semibold" /></dd></div>)}</dl>
          <details className="mt-5 border-t border-border pt-4 text-xs leading-5 text-fg-secondary"><summary className="w-fit cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-brand-primary-500">Vì sao giá trị gói và học phí giải ngân có thể khác nhau?</summary><p className="mt-2">Giá trị gói là số tiền học viên đã thanh toán. Học phí giải ngân được ghi nhận theo từng buổi, có thể ở kỳ khác với lúc mua gói. Khoản giải ngân gồm cả phí nền tảng, không phải toàn bộ tiền gia sư thực nhận.</p></details>
        </Card>
      </>}
    </section>

    <Card padding="lg" variant="outlined" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-insight-subtle text-insight-strong"><Icon name="insights" size="md" /></span><div><h2 className="text-lg font-semibold">Doanh thu phí theo tháng</h2><p className="mt-1 text-xs text-fg-secondary">Giờ Việt Nam (UTC+7) · Chỉ áp dụng cho biểu đồ và bảng</p></div></div><div className="w-full sm:w-48"><Field label="Khoảng thời gian" htmlFor="revenue-months"><Select id="revenue-months" value={months} onChange={event => setMonths(Number(event.target.value))}>{[3, 6, 12, 24].map(value => <option key={value} value={value}>{value} tháng gần nhất</option>)}</Select></Field></div></div>
      {chart.isPending ? <div role="status" className="space-y-5"><div className="h-64 animate-pulse rounded-xl bg-neutral-100" /><TableSkeleton rows={3} /></div> : chart.isError ? <><p role="alert" className="text-sm text-fg-secondary">Chưa tải được biểu đồ doanh thu.</p><Button variant="outline" onClick={() => chart.refetch()}>Thử lại</Button></> : !points.length ? <div className="py-12 text-center"><Icon name="insights" size="xl" className="mx-auto mb-3 text-insight-strong" /><h3 className="font-medium">Chưa có số liệu trong khoảng thời gian này</h3></div> : <>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-4">
          <div><p className="text-xs text-fg-secondary">Doanh thu phí thuần trong kỳ</p><Amount value={revenuePeriodTotal(points)} className="mt-1 block text-2xl font-semibold" /><p className="mt-1 text-xs text-fg-secondary">{revenueMonthLabel(chart.data.fromMonth || points[0].month)} – {revenueMonthLabel(chart.data.toMonth || points.at(-1).month)}</p></div>
          {currentMonth && <p className="flex items-center gap-2 text-xs text-brand-primary-700"><Icon name="schedule" size="sm" />{revenueMonthLabel(currentMonth)} · Tháng đang diễn ra</p>}
        </div>
        <RevenueMonthlyChart key={months} points={points} currentMonth={currentMonth} />
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-secondary"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-brand-primary-300" />Các tháng trước</span><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-brand-primary-600" />Tháng đang diễn ra</span>{points.some(point => revenueNumber(point.platformRevenue) < 0) && <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-insight-strong" />Hoàn phí vượt phí ghi nhận</span>}</div>
        <p className="text-xs text-fg-secondary">Chọn tháng để xem giao dịch. Cuộn ngang để xem thêm các tháng khi cần.</p>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[850px] text-sm"><caption className="sr-only">Chi tiết doanh thu theo tháng</caption><thead className="bg-neutral-100 text-xs text-fg-secondary"><tr>{['Tháng', 'Đơn đã thanh toán', 'Giá trị gói đã thanh toán', 'Doanh thu phí thuần', 'Thu nhập gia sư'].map((label, index) => <th key={label} scope="col" className={cn('px-4 py-3 font-medium', index === 0 ? 'text-left' : 'text-right')}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{points.map(point => {
              const current = point.month === currentMonth;
              const zero = ['paidBookings', 'totalGmv', 'platformRevenue', 'tutorPayouts'].every(key => revenueNumber(point[key]) === 0);
              const target = revenueMonthLink(point.month);
              return <tr key={point.month} className={cn('hover:bg-neutral-50', current && 'bg-brand-primary-50/50', zero && 'text-fg-secondary')}><th scope="row" className="px-4 py-4 text-left font-medium">{target ? <Link to={target} className="inline-flex items-center gap-2 rounded text-brand-primary-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary-500">{revenueMonthLabel(point.month)}<Icon name="chevron_right" size="xs" /></Link> : revenueMonthLabel(point.month)}{current && <span className="mt-1 block text-[11px] font-normal text-brand-primary-700">Đang diễn ra</span>}</th><td className="px-4 py-4 text-right tabular-nums">{revenueNumber(point.paidBookings) ?? '—'}</td><td className="px-4 py-4 text-right"><Amount value={point.totalGmv} /></td><td className="px-4 py-4 text-right"><Amount value={point.platformRevenue} className={cn('font-semibold', revenueNumber(point.platformRevenue) < 0 ? 'text-insight-strong' : revenueNumber(point.platformRevenue) > 0 ? 'text-success-strong' : 'text-fg-secondary')} /></td><td className="px-4 py-4 text-right"><Amount value={point.tutorPayouts} className={zero ? 'text-fg-secondary' : 'text-fg'} /></td></tr>;
            })}</tbody>
          </table>
        </div>
        <details className="text-xs leading-5 text-fg-secondary"><summary className="w-fit cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-brand-primary-500">Phạm vi dữ liệu và cách đọc báo cáo</summary><p className="mt-2">0 ₫ là không phát sinh; — là chưa có dữ liệu. Biểu đồ và bảng sử dụng cùng khoảng thời gian, theo tháng ghi nhận giao dịch. Số đơn là các đơn tạo trong tháng đã thanh toán. Tháng đang diễn ra chưa thể so sánh trực tiếp với một tháng đầy đủ.</p></details>
      </>}
    </Card>
  </div>;
}
