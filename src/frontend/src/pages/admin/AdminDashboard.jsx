import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { formatCurrency } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const data = await adminService.getStats();
      setStats(data);
      setError(null);
      if (isSilent) {
        toast.success('Dữ liệu điều hành đã được làm mới');
      }
    } catch (err) {
      setError(err);
      if (isSilent) {
        toast.error(err?.message || 'Không thể làm mới dữ liệu.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-neutral-200 rounded-brand-md animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải dữ liệu điều hành"
          onRetry={() => loadStats(false)}
        />
      </div>
    );
  }

  const { users, tutors, bookings, financials, actionQueue } = stats;

  // Derived financial ratios
  const totalGmv = financials.totalGmv || 0;
  const payoutRate = totalGmv > 0 ? ((financials.totalTutorPayouts / totalGmv) * 100).toFixed(1) : '0';
  const feeRate = totalGmv > 0 ? ((financials.totalPlatformRevenue / totalGmv) * 100).toFixed(1) : '0';
  const refundRate = totalGmv > 0 ? ((financials.totalRefundedAmount / totalGmv) * 100).toFixed(1) : '0';

  // Booking conversion ratio
  const totalBookingsCount = bookings.totalBookings || 0;
  const paidRatio = totalBookingsCount > 0 ? Math.round((bookings.paidBookings / totalBookingsCount) * 100) : 0;

  // Tutor verification ratio
  const totalTutorsCount = users.totalTutors || 0;
  const verifiedTutorRatio = totalTutorsCount > 0 ? Math.round((tutors.verifiedTutors / totalTutorsCount) * 100) : 0;

  const actionCards = [
    {
      id: 'disputes',
      title: 'Vụ tranh chấp & Báo cáo cần xử lý',
      count: `${actionQueue.openReportsCount} vụ việc`,
      urgent: actionQueue.openReportsCount > 0,
      desc:
        actionQueue.openReportsCount > 0
          ? 'Có khiếu nại tranh chấp buổi học đối soát 24h hoặc xung đột điểm danh đang chờ tiếp nhận.'
          : 'Bàn trọng tài hiện không có vụ việc tồn đọng.',
      link: '/admin/disputes',
      btnText: 'Phân xử trọng tài',
      tone: 'danger',
      icon: 'gavel',
    },
    {
      id: 'withdrawals',
      title: 'Lệnh rút tiền gia sư chờ xử lý',
      count: `${actionQueue.pendingWithdrawalsCount} lệnh`,
      urgent: actionQueue.pendingWithdrawalsCount > 0,
      desc:
        actionQueue.pendingWithdrawalsCount > 0
          ? 'Gia sư yêu cầu rút thu nhập khả dụng về tài khoản ngân hàng đã liên kết (DEC-WD-001).'
          : 'Không có yêu cầu rút tiền mới chờ đối soát.',
      link: '/admin/withdrawals',
      btnText: 'Duyệt lệnh rút tiền',
      tone: 'holding',
      icon: 'payments',
    },
    {
      id: 'applications',
      title: 'Hồ sơ gia sư chờ xác minh bằng cấp',
      count: `${actionQueue.pendingTutorsCount} hồ sơ`,
      urgent: actionQueue.pendingTutorsCount > 0,
      desc:
        actionQueue.pendingTutorsCount > 0
          ? 'Ứng viên gia sư đã tải lên bằng đại học, chứng chỉ sư phạm và giấy tờ định danh KYC.'
          : 'Toàn bộ hồ sơ gia sư mới đã được thẩm định.',
      link: '/admin/tutor-applications',
      btnText: 'Kiểm duyệt hồ sơ',
      tone: 'success',
      icon: 'verified_user',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều hành quản trị sàn & Giám sát dòng tiền"
        subtitle="Trung tâm chỉ huy vận hành, đối soát ký quỹ Escrow và thanh khoản thị trường theo thời gian thực"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              loading={refreshing}
              onClick={() => loadStats(true)}
              icon={!refreshing && <Icon name="refresh" size="sm" />}
            >
              Làm mới
            </Button>
            <Badge variant="success" dot size="md">
              Hệ thống: Live (Sẵn sàng)
            </Badge>
          </div>
        }
      />

      {/* Sovereign Platform Governance Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-caption">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100 mt-0.5 md:mt-0">
            <Icon name="shield" size="sm" filled />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block text-body-reg">
              Bộ ba trụ cột bảo chứng giao dịch nền tảng (Platform Invariants)
            </span>
            <p className="text-fg-secondary text-[12px] m-0 leading-relaxed">
              <strong>100% Escrow bảo toàn</strong> cho từng buổi học • <strong>Công thức cân đối DEC-S8-025</strong> bảo vệ quyền tài chính các bên • <strong>Sổ cái Append-Only (INV-LEDGER-006)</strong> lưu trữ bất biến.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <Badge variant="primary" size="md">
            Sovereign Ledger Active
          </Badge>
        </div>
      </div>

      {/* Top 4 Primary Financial & Volume KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng GMV Giao dịch sàn"
          value={formatCurrency(financials.totalGmv)}
          mono={false}
          hint={`Net GMV thực: ${formatCurrency(financials.netGmv)}`}
          icon={<Icon name="payments" size="md" />}
          tone="primary"
        />
        <StatCard
          label="Doanh thu phí sàn đã thu"
          value={formatCurrency(financials.totalPlatformRevenue)}
          mono={false}
          hint={`Hiệu suất thu phí: ~${feeRate}% tổng GMV`}
          icon={<Icon name="account_balance" size="md" />}
          tone="success"
        />
        <StatCard
          label="Đã giải ngân cho Gia sư"
          value={formatCurrency(financials.totalTutorPayouts)}
          mono={false}
          hint={`Tỷ trọng giải ngân: ~${payoutRate}% GMV`}
          icon={<Icon name="currency_exchange" size="md" />}
          tone="info"
        />
        <StatCard
          label="Tổng bồi hoàn / Hoàn tiền"
          value={formatCurrency(financials.totalRefundedAmount)}
          mono={false}
          hint={`Tỷ lệ hoàn tiền: ~${refundRate}% (Bảo chứng)`}
          icon={<Icon name="replay" size="md" />}
          tone="holding"
        />
      </div>

      {/* Action Queue: Urgent Operational Tasks */}
      <Card padding="lg" className="space-y-4 shadow-brand-sm border border-border">
        <CardHeader
          title="Hàng đợi nghiệp vụ & Tác vụ cần xử lý ngay"
          subtitle="Giám sát khiếu nại phát sinh từ đối soát 24h và yêu cầu thanh khoản của thành viên"
          icon={<Icon name="emergency" size="sm" className="text-danger" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionCards.map((q) => (
            <div
              key={q.id}
              className={cn(
                'p-5 rounded-brand-md border border-border border-l-4 space-y-3 flex flex-col justify-between transition-shadow hover:shadow-brand-sm',
                q.tone === 'danger' && 'border-l-danger bg-danger-50/10',
                q.tone === 'holding' && 'border-l-holding bg-amber-50/10',
                q.tone === 'success' && 'border-l-success bg-emerald-50/10'
              )}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-caption font-bold text-fg leading-snug">
                    {q.title}
                  </span>
                  <Badge variant={q.tone} size="sm" className="shrink-0 font-mono">
                    {q.count}
                  </Badge>
                </div>
                <p className="text-caption text-fg-secondary leading-relaxed m-0">
                  {q.desc}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  as={Link}
                  to={q.link}
                  variant={q.urgent ? 'primary' : 'outline'}
                  size="sm"
                  fullWidth
                  iconRight={<Icon name="arrow_forward" size="sm" />}
                >
                  {q.btnText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Ecosystem & Balance Panels: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Financial Stream Settlement Matrix */}
        <Card padding="lg" className="space-y-4 shadow-brand-sm border border-border">
          <CardHeader
            title="Dòng tiền & Cơ chế phân bổ tài chính"
            subtitle="Phân rã GMV sàn thành thu nhập gia sư, phí sàn và dự phòng hoàn tiền"
            icon={<Icon name="pie_chart" size="sm" className="text-brand-primary-600" />}
          />

          {/* Visual Distribution Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-fg-muted">
              <span>Cơ cấu GMV sàn ({formatCurrency(totalGmv)})</span>
              <span>100% Khép kín</span>
            </div>
            <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden flex" role="progressbar" aria-label="Cơ cấu GMV sàn">
              <div
                style={{ width: `${Math.max(5, Number(payoutRate))}%` }}
                className="bg-brand-primary-600 h-full transition-all"
                title={`Thu nhập gia sư: ${payoutRate}%`}
              />
              <div
                style={{ width: `${Math.max(3, Number(feeRate))}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Phí sàn: ${feeRate}%`}
              />
              <div
                style={{ width: `${Math.max(2, Number(refundRate))}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Hoàn trả: ${refundRate}%`}
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] text-fg-muted pt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />
                <span>Thu nhập Gia sư ({payoutRate}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Phí sàn ({feeRate}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Hoàn tiền ({refundRate}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-caption">
            <div className="p-3 rounded-brand-md bg-neutral-50 border border-border space-y-1">
              <span className="text-[11px] text-fg-muted uppercase font-semibold block">
                Tổng giá trị GMV
              </span>
              <span className="text-body-bold text-fg font-mono block">
                {formatCurrency(financials.totalGmv)}
              </span>
              <span className="text-[10px] text-fg-muted block">
                Bao gồm toàn bộ gói dịch vụ đã kích hoạt
              </span>
            </div>

            <div className="p-3 rounded-brand-md bg-neutral-50 border border-border space-y-1">
              <span className="text-[11px] text-fg-muted uppercase font-semibold block">
                Net GMV Quyết toán
              </span>
              <span className="text-body-bold text-brand-primary-700 font-mono block">
                {formatCurrency(financials.netGmv)}
              </span>
              <span className="text-[10px] text-fg-muted block">
                GMV sau khi trừ phần hoàn tiền tranh chấp
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Bookings & User Health Matrix */}
        <Card padding="lg" className="space-y-4 shadow-brand-sm border border-border">
          <CardHeader
            title="Quy mô cộng đồng & Chuyển đổi đặt gói"
            subtitle="Hiệu suất đặt chỗ 15 phút và mức độ thẩm định hồ sơ giảng dạy"
            icon={<Icon name="group" size="sm" className="text-emerald-600" />}
          />

          <div className="space-y-4 pt-1">
            {/* Booking Conversion Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-fg">
                <span>Tỷ lệ thanh toán thành công ({bookings.paidBookings}/{totalBookingsCount})</span>
                <span className="font-mono text-emerald-600">{paidRatio}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  style={{ width: `${paidRatio}%` }}
                  className="bg-emerald-600 h-full rounded-full transition-all"
                />
              </div>
              <div className="flex justify-between text-[10px] text-fg-muted">
                <span>Đang giữ chỗ 15p: <strong>{bookings.holdingBookings}</strong></span>
                <span>Hết hạn / Hủy: <strong>{bookings.expiredBookings + bookings.cancelledBookings}</strong></span>
              </div>
            </div>

            {/* Tutor Verification Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-fg">
                <span>Tỷ lệ gia sư đã cấp Verified Badge ({tutors.verifiedTutors}/{totalTutorsCount})</span>
                <span className="font-mono text-brand-primary-700">{verifiedTutorRatio}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  style={{ width: `${verifiedTutorRatio}%` }}
                  className="bg-brand-primary-600 h-full rounded-full transition-all"
                />
              </div>
              <div className="flex justify-between text-[10px] text-fg-muted">
                <span>Chờ thẩm định bằng cấp: <strong>{tutors.pendingReviewTutors}</strong></span>
                <span>Tạm đình chỉ: <strong>{tutors.suspendedTutors}</strong></span>
              </div>
            </div>

            {/* Quick Community Stats Chips */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-caption">
              <div className="p-2 rounded-brand-md bg-neutral-50 border border-border">
                <span className="text-[10px] text-fg-muted block uppercase font-semibold">Học viên</span>
                <span className="text-body-bold text-fg font-mono">{users.totalStudents}</span>
              </div>
              <div className="p-2 rounded-brand-md bg-neutral-50 border border-border">
                <span className="text-[10px] text-fg-muted block uppercase font-semibold">Gia sư</span>
                <span className="text-body-bold text-fg font-mono">{users.totalTutors}</span>
              </div>
              <div className="p-2 rounded-brand-md bg-neutral-50 border border-border">
                <span className="text-[10px] text-fg-muted block uppercase font-semibold">Đang hoạt động</span>
                <span className="text-body-bold text-emerald-600 font-mono">{users.activeUsers}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Governance Quick Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/disputes"
          className="p-4 rounded-brand-lg bg-surface border border-border hover:border-brand-primary-500 hover:shadow-brand-md transition-all group block text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-brand-md bg-danger-50 text-danger flex items-center justify-center shrink-0 border border-danger-100 group-hover:scale-105 transition-transform">
              <Icon name="gavel" size="sm" />
            </div>
            <div>
              <span className="font-bold text-caption text-fg group-hover:text-brand-primary-700 block">
                Bàn trọng tài tranh chấp
              </span>
              <span className="text-[11px] text-fg-muted block">
                Phân xử bồi hoàn theo DEC-S8-025
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/tutor-applications"
          className="p-4 rounded-brand-lg bg-surface border border-border hover:border-brand-primary-500 hover:shadow-brand-md transition-all group block text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-brand-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
              <Icon name="verified_user" size="sm" />
            </div>
            <div>
              <span className="font-bold text-caption text-fg group-hover:text-brand-primary-700 block">
                Xác minh hồ sơ Gia sư
              </span>
              <span className="text-[11px] text-fg-muted block">
                Thẩm định văn bằng & cấp badge
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="p-4 rounded-brand-lg bg-surface border border-border hover:border-brand-primary-500 hover:shadow-brand-md transition-all group block text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100 group-hover:scale-105 transition-transform">
              <Icon name="group" size="sm" />
            </div>
            <div>
              <span className="font-bold text-caption text-fg group-hover:text-brand-primary-700 block">
                Người dùng & Absent Strikes
              </span>
              <span className="text-[11px] text-fg-muted block">
                Quản lý kỷ luật & khóa tài khoản
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-4 rounded-brand-lg bg-surface border border-border hover:border-brand-primary-500 hover:shadow-brand-md transition-all group block text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-brand-md bg-neutral-100 text-fg-secondary flex items-center justify-center shrink-0 border border-neutral-200 group-hover:scale-105 transition-transform">
              <Icon name="receipt_long" size="sm" />
            </div>
            <div>
              <span className="font-bold text-caption text-fg group-hover:text-brand-primary-700 block">
                Sổ cái kiểm toán Append-Only
              </span>
              <span className="text-[11px] text-fg-muted block">
                Tra cứu CorrelationId bất biến
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
