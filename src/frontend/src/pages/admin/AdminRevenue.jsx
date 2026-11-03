import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { formatCurrency } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Input';
import DataTable from '@/components/common/DataTable';

const metrics = [ ['grossBookingVolume', 'Tổng giá trị gói đã thanh toán'], ['grossReleasedEarnings', 'Tổng học phí đã giải ngân'], ['recognizedPlatformFee', 'Phí nền tảng đã ghi nhận'], ['platformFeeReversals', 'Phí nền tảng đã hoàn'], ['netRecognizedPlatformRevenue', 'Doanh thu phí thuần'], ['unrecognizedPendingPlatformFee', 'Phí dự kiến chưa ghi nhận'] ];
export default function AdminRevenue() {
  const { user } = useAuthStore();
  const [months, setMonths] = useState(6);
  const overview = useQuery({ queryKey: ['admin-revenue-overview', user?.id], queryFn: adminService.getPlatformRevenue, retry: false });
  const chart = useQuery({ queryKey: ['admin-revenue-chart', user?.id, months], queryFn: () => adminService.getRevenueChart(months), retry: false });
  const points = chart.data?.data || [];
  const max = Math.max(1, ...points.map(item => Math.abs(Number(item.platformRevenue))));
  return <div className="space-y-6 lg:space-y-8"><WorkspacePageHeader title="Doanh thu nền tảng" description="Phân biệt giá trị gói học, học phí giải ngân và phần phí thuộc TutorHub." />
    <section aria-labelledby="revenue-overview"><h2 id="revenue-overview" className="mb-4 text-lg font-semibold">Lũy kế toàn hệ thống</h2>{overview.isPending ? <p role="status">Đang tải thống kê…</p> : overview.isError ? <Card padding="lg"><p role="alert">Chưa tải được số liệu doanh thu.</p><Button className="mt-3" variant="outline" onClick={() => overview.refetch()}>Thử lại</Button></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([key, label]) => <Card key={key} padding="lg" variant="outlined"><h3 className="text-sm text-fg-secondary">{label}</h3><p className="mt-3 text-2xl font-semibold tabular-nums">{formatCurrency(overview.data[key])}</p></Card>)}</div>}<p className="mt-4 text-sm leading-relaxed text-fg-secondary">Doanh thu phí thuần = phí đã ghi nhận khi giải ngân − phí hoàn do điều chỉnh. Học phí đang ký quỹ và phí dự kiến chưa được tính là doanh thu.</p></section>
    <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Doanh thu phí theo tháng</h2><p className="mt-2 text-sm text-fg-secondary">Tháng báo cáo theo giờ Việt Nam (UTC+7), tính đến tháng hiện tại.</p></div><div className="w-44"><Field label="Khoảng thời gian" htmlFor="revenue-months"><Select id="revenue-months" value={months} onChange={e => setMonths(Number(e.target.value))}>{[3, 6, 12, 24].map(value => <option key={value} value={value}>{value} tháng gần nhất</option>)}</Select></Field></div></div>
      {chart.isPending ? <p role="status">Đang tải biểu đồ…</p> : chart.isError ? <><p role="alert">Chưa tải được biểu đồ doanh thu.</p><Button variant="outline" onClick={() => chart.refetch()}>Thử lại</Button></> : !points.length ? <p>Chưa có số liệu trong khoảng thời gian này.</p> : <>
        <div className="overflow-x-auto"><div className="flex h-60 items-end gap-4 border-b border-border pb-2" style={{ minWidth: Math.max(360, points.length * 70) }}>{points.map(item => <div key={item.month} className="flex h-full min-w-12 flex-1 flex-col justify-end text-center"><span className="mb-2 text-xs tabular-nums text-fg-secondary">{formatCurrency(item.platformRevenue)}</span><div role="img" aria-label={`${item.month}: ${formatCurrency(item.platformRevenue)}`} className={`mx-auto w-full max-w-12 rounded-t-md ${item.platformRevenue < 0 ? 'bg-rose-400' : 'bg-blue-500'}`} style={{ height: `${Math.abs(Number(item.platformRevenue)) / max * 65}%`, minHeight: item.platformRevenue ? 3 : 1 }} /><span className="mt-3 text-xs text-fg-secondary">{item.month}</span></div>)}</div></div><p className="text-xs text-fg-secondary">Xanh: doanh thu không âm · Đỏ: phần hoàn phí vượt phí ghi nhận trong tháng.</p>
        <DataTable caption="Chi tiết doanh thu theo tháng" columns={[{ key: 'month', label: 'Tháng' }, { key: 'bookings', label: 'Đơn đã thanh toán', align: 'right' }, { key: 'gmv', label: 'Giá trị gói đã thanh toán', align: 'right' }, { key: 'revenue', label: 'Doanh thu phí thuần', align: 'right' }, { key: 'payout', label: 'Thu nhập gia sư', align: 'right' }]}>{points.map(item => <tr key={item.month}><td className="p-3">{item.month}</td><td className="p-3 text-right tabular-nums">{item.paidBookings}</td><td className="p-3 text-right tabular-nums">{formatCurrency(item.totalGmv)}</td><td className="p-3 text-right tabular-nums">{formatCurrency(item.platformRevenue)}</td><td className="p-3 text-right tabular-nums">{formatCurrency(item.tutorPayouts)}</td></tr>)}</DataTable>
      </>}
    </Card>
  </div>;
}
