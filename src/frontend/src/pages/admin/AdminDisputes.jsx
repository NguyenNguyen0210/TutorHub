import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';

const STATUS_CONFIG = {
  Open: { label: 'Mới mở', variant: 'danger', icon: 'error_outline' },
  UnderReview: { label: 'Đang điều tra', variant: 'info', icon: 'search' },
  Resolved: { label: 'Đã phân xử', variant: 'success', icon: 'check_circle' },
  Dismissed: { label: 'Đã bác bỏ', variant: 'neutral', icon: 'cancel' },
  RequiresAdminFinancialIntervention: {
    label: 'Cần can thiệp tài chính',
    variant: 'holding',
    icon: 'warning',
  },
};

const REASON_TRANSLATIONS = {
  TutorNoShow: 'Gia sư vắng mặt (No-Show)',
  TutorLate: 'Gia sư vào muộn / Về sớm',
  QualityIssue: 'Chất lượng không đạt cam kết',
  IncompleteSession: 'Buổi học bị gián đoạn / Thiếu giờ',
  StudentNoShow: 'Học viên vắng mặt',
  Other: 'Lý do khác',
};

export default function AdminDisputes() {
  const toast = useToast();
  const [disputes, setDisputes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDisputes({
        pageNumber,
        pageSize,
        status: statusFilter || null,
      });
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setDisputes(items);
      setTotalCount(res?.totalCount ?? items.length);
    } catch (err) {
      setError(err);
      toast.error(err?.message || 'Không thể tải danh sách khiếu nại tranh chấp.');
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, statusFilter, toast]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Đã sao chép mã tranh chấp');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDisputes = disputes.filter((d) => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase().trim();
    return (
      (d.id || '').toLowerCase().includes(q) ||
      (d.reason || '').toLowerCase().includes(q) ||
      (d.initiatorName || '').toLowerCase().includes(q) ||
      (d.respondentName || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const hasPrev = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  // Counters for quick triage
  const openCount = disputes.filter((d) => d.status === 'Open').length;
  const underReviewCount = disputes.filter((d) => d.status === 'UnderReview').length;
  const interventionCount = disputes.filter(
    (d) => d.status === 'RequiresAdminFinancialIntervention'
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bàn trọng tài — Phân xử tranh chấp buổi học"
        subtitle="Giám sát chứng cứ đối soát 24h, phân bổ bồi hoàn và thực thi phán quyết trọng tài theo chuẩn DEC-S8-025"
      />

      {/* Trust & Invariant Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100">
            <Icon name="gavel" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Quy chế phân xử & Cân đối tài chính bất biến (DEC-S8-025 & INV-DISP-008)
            </span>
            <p className="text-fg-secondary text-[12px] m-0">
              Công thức bảo toàn: <code className="font-mono text-brand-primary-700 bg-brand-primary-50 px-1 py-0.5 rounded">StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal</code>. Trong tranh chấp sau giải ngân, nếu số dư khả dụng của gia sư không đủ, hệ thống giữ 0₫ để bảo vệ hạn mức và chuyển sang diện can thiệp tài chính.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="primary" size="md">
            DEC-S8-025 Sovereign
          </Badge>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Tổng số vụ việc"
          value={String(totalCount)}
          mono={false}
          icon={<Icon name="folder" size="md" />}
          tone="neutral"
        />
        <StatCard
          label="Mới mở (Cần tiếp nhận)"
          value={String(openCount)}
          mono={false}
          icon={<Icon name="error_outline" size="md" />}
          tone="danger"
        />
        <StatCard
          label="Đang điều tra"
          value={String(underReviewCount)}
          mono={false}
          icon={<Icon name="search" size="md" />}
          tone="info"
        />
        <StatCard
          label="Cần can thiệp ví"
          value={String(interventionCount)}
          mono={false}
          icon={<Icon name="account_balance_wallet" size="md" />}
          tone="holding"
        />
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <Icon name="search" size="sm" />
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vụ việc, lý do hoặc tên học viên/gia sư..."
            aria-label="Tìm kiếm khiếu nại"
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-1 cursor-pointer"
            >
              <Icon name="close" size="xs" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-brand-md" role="group" aria-label="Lọc theo trạng thái">
          {[
            { key: '', label: 'Tất cả' },
            { key: 'Open', label: 'Mới mở' },
            { key: 'UnderReview', label: 'Đang điều tra' },
            { key: 'RequiresAdminFinancialIntervention', label: 'Cần can thiệp ví' },
            { key: 'Resolved', label: 'Đã phân xử' },
            { key: 'Dismissed', label: 'Đã bác bỏ' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={statusFilter === tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPageNumber(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-brand-sm font-semibold text-caption cursor-pointer transition-colors',
                statusFilter === tab.key
                  ? 'bg-brand-primary-600 text-white shadow-brand-sm'
                  : 'text-fg-secondary hover:text-fg hover:bg-neutral-200/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <TableSkeleton rows={6} />}

      {error && (
        <ErrorState
          error={error}
          title="Không thể tải danh sách khiếu nại"
          onRetry={loadDisputes}
        />
      )}

      {!loading && !error && filteredDisputes.length === 0 && (
        <EmptyState
          icon="gavel"
          title="Không tìm thấy vụ việc tranh chấp nào"
          description={
            statusFilter || debouncedSearch
              ? 'Không tìm thấy khiếu nại nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc.'
              : 'Hiện tại hệ thống không có vụ việc khiếu nại tranh chấp nào.'
          }
          actionLabel={statusFilter || debouncedSearch ? 'Đặt lại bộ lọc' : undefined}
          onAction={
            statusFilter || debouncedSearch
              ? () => {
                  setStatusFilter('');
                  setSearch('');
                  setPageNumber(1);
                }
              : undefined
          }
        />
      )}

      {!loading && !error && filteredDisputes.length > 0 && (
        <Card padding="none" className="overflow-hidden shadow-brand-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-caption">
              <thead>
                <tr className="bg-neutral-50 border-b border-border">
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Mã vụ việc
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Lý do & Tóm tắt
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Các bên liên quan
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">
                    Số tiền ký quỹ giữ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Thời điểm mở
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDisputes.map((d) => {
                  const statusInfo = STATUS_CONFIG[d.status] || {
                    label: d.status,
                    variant: 'neutral',
                    icon: 'info',
                  };
                  const isCopied = copiedId === d.id;

                  return (
                    <tr key={d.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-fg">
                            #{d.id.substring(0, 8)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(d.id, e)}
                            title="Sao chép toàn bộ mã tranh chấp"
                            aria-label={`Sao chép mã tranh chấp ${d.id}`}
                            className="text-fg-muted hover:text-brand-primary-600 p-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Icon name={isCopied ? 'check' : 'content_copy'} size="xs" />
                          </button>
                        </div>
                        <span className="text-[11px] text-fg-muted font-mono block mt-0.5">
                          Buổi #{d.sessionNumber || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-fg block">
                          {REASON_TRANSLATIONS[d.reason] || d.reason}
                        </span>
                        {d.description && (
                          <p className="text-[12px] text-fg-secondary line-clamp-1 m-0 mt-0.5 max-w-xs">
                            {d.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1 text-[12px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-fg-muted font-semibold text-[11px] w-6">HV:</span>
                            <span className="font-medium text-fg">{d.initiatorName || 'Học viên'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-fg-muted font-semibold text-[11px] w-6">GS:</span>
                            <span className="font-medium text-fg">{d.respondentName || 'Gia sư'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-success-strong tabular-nums block text-body-reg">
                          {formatCurrency(d.heldAmount || 0)}
                        </span>
                        <span className="text-[10px] text-fg-muted block uppercase">
                          {d.holdType || 'Escrow Hold'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-fg-muted font-mono text-[11px]">
                        {d.createdAt ? formatDateTime(d.createdAt, 'DD/MM HH:mm') : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Button
                          as={Link}
                          to={`/admin/disputes/${d.id}`}
                          variant="primary"
                          size="sm"
                          iconRight={<Icon name="arrow_forward" size="sm" />}
                        >
                          Phân xử
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
              <span className="text-caption text-fg-muted font-mono">
                Trang <strong>{pageNumber}</strong> / {totalPages} (Tổng {totalCount} vụ việc)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev || loading}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  icon={<Icon name="chevron_left" size="sm" />}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || loading}
                  onClick={() => setPageNumber((p) => p + 1)}
                  iconRight={<Icon name="chevron_right" size="sm" />}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
