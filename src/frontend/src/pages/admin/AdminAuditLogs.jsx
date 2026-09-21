import React, { useState, useEffect, useCallback } from 'react';
import adminService from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatters';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { PageHeader } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';

function formatJson(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(raw);
  }
}

export default function AdminAuditLogs() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: page,
        pageSize,
      };

      if (debouncedSearch.trim()) {
        const query = debouncedSearch.trim();
        if (query.toLowerCase().startsWith('corr-')) {
          params.correlationId = query;
        } else {
          params.entityName = query;
        }
      }

      if (entityFilter !== 'All') {
        params.entityName = entityFilter;
      }

      const res = await adminService.getAuditLogs(params);
      setLogs(res?.items || []);
      setTotalCount(res?.totalCount || 0);
      setTotalPages(res?.totalPages || 1);
      setHasPrev(res?.hasPreviousPage || false);
      setHasNext(res?.hasNextPage || false);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error(err?.message || 'Không thể tải dữ liệu sổ cái kiểm toán.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, entityFilter, page, pageSize, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép Correlation ID');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeVariant = (action) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('resolve') || lower.includes('approve') || lower.includes('complete')) return 'success';
    if (lower.includes('reject') || lower.includes('ban') || lower.includes('suspend')) return 'danger';
    if (lower.includes('update') || lower.includes('process')) return 'primary';
    return 'neutral';
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sổ cái kiểm toán bất biến trung tâm (Central Audit Log)"
        subtitle="Hệ thống sổ cái Append-Only ghi nhận vĩnh viễn mọi biến động Escrow, hợp đồng và phán quyết trọng tài"
      />

      {/* Invariant Trust Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100">
            <Icon name="verified_user" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Bất biến sổ cái kiểm toán (INV-LEDGER-006 & INV-LEDGER-007)
            </span>
            <p className="text-fg-secondary text-[12px] m-0">
              Mọi bản ghi kiểm toán được interceptor của cơ sở dữ liệu khóa chặt: cấm sửa đổi (UPDATE) hoặc xóa (DELETE), đảm bảo tính toàn vẹn pháp lý và đối soát tài chính.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="primary" size="md">
            Append-Only Ledger
          </Badge>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <Icon name="search" size="sm" />
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo CorrelationId (corr-...) hoặc tên thực thể..."
            aria-label="Tìm kiếm sổ kiểm toán"
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <Tabs
            value={entityFilter}
            onChange={(val) => {
              setEntityFilter(val);
              setPage(1);
            }}
            tabs={[
              { key: 'All', label: 'Tất cả thực thể' },
              { key: 'Dispute', label: 'Dispute' },
              { key: 'TutorProfile', label: 'TutorProfile' },
              { key: 'TutorApplication', label: 'TutorApplication' },
              { key: 'PlatformSetting', label: 'PlatformSetting' },
              { key: 'Withdrawal', label: 'Withdrawal' },
            ]}
          />
        </div>
      </div>

      {error && (
        <ErrorState
          error={error}
          title="Không thể tải sổ cái kiểm toán"
          onRetry={fetchLogs}
        />
      )}

      <Card padding="none" className="overflow-x-auto shadow-brand-sm">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon="receipt_long"
              title="Không tìm thấy bản ghi kiểm toán nào"
              description="Thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc thực thể khác."
              actionLabel="Đặt lại bộ lọc"
              onAction={() => {
                setSearch('');
                setEntityFilter('All');
                setPage(1);
              }}
            />
          </div>
        ) : (
          <>
            <table className="w-full min-w-[840px] text-caption text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-border">
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Thời gian (UTC)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    CorrelationId
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Hành động
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Thực thể
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Người thực hiện
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">
                    Chi tiết thay đổi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const isCopied = copiedId === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap text-[12px]">
                        {formatDateTime(log.createdAt, 'DD/MM/YYYY HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-brand-primary-700 text-[12px]">
                            {log.correlationId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.correlationId, log.id);
                            }}
                            title="Sao chép Correlation ID"
                            aria-label={`Sao chép Correlation ID ${log.correlationId}`}
                            className="text-fg-muted hover:text-brand-primary-600 p-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Icon name={isCopied ? 'check' : 'content_copy'} size="xs" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-fg">
                        <span className="block">{log.entityName}</span>
                        {log.entityId && (
                          <span className="block text-[10px] font-mono text-fg-muted font-normal">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-secondary">
                        <span className="block font-medium">{log.userName || log.userId || 'Hệ thống'}</span>
                        {log.ipAddress && (
                          <span className="text-[10px] text-fg-muted font-mono block">
                            IP: {log.ipAddress}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          icon={<Icon name="visibility" size="xs" />}
                        >
                          Kiểm tra JSON
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
                <span className="text-caption text-fg-muted font-mono">
                  Trang <strong>{page}</strong> / {totalPages} (Tổng {totalCount} bản ghi)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<Icon name="chevron_left" size="sm" />}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                    iconRight={<Icon name="chevron_right" size="sm" />}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* JSON State Diff Inspector Modal */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-log-inspector-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs cursor-default"
            onClick={() => setSelectedLog(null)}
            tabIndex={-1}
          />
          <div className="relative z-10 bg-surface rounded-brand-xl shadow-brand-xl border border-border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center">
                  <Icon name="code" size="sm" />
                </div>
                <div>
                  <h3 id="audit-log-inspector-title" className="font-bold text-body-bold text-fg m-0">
                    Chi tiết thay đổi bản ghi kiểm toán
                  </h3>
                  <p className="text-[12px] text-fg-muted m-0 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Đóng cửa sổ chi tiết"
                className="w-8 h-8 rounded-brand-md hover:bg-neutral-200 text-fg-muted hover:text-fg flex items-center justify-center cursor-pointer transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-brand-md bg-neutral-50 border border-border text-caption">
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">Correlation ID</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-brand-primary-700">
                      {selectedLog.correlationId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedLog.correlationId, 'modal')}
                      title="Sao chép"
                      className="text-fg-muted hover:text-brand-primary-600 cursor-pointer"
                    >
                      <Icon name="content_copy" size="xs" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">Thời gian ghi nhận</span>
                  <span className="font-mono text-fg font-medium">
                    {formatDateTime(selectedLog.createdAt, 'DD/MM/YYYY HH:mm:ss')} (UTC)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">Hành động & Thực thể</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} size="sm">
                      {selectedLog.action}
                    </Badge>
                    <span className="font-semibold text-fg font-mono">
                      {selectedLog.entityName} #{selectedLog.entityId?.slice(0, 8) || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">Người thực hiện</span>
                  <span className="font-medium text-fg">
                    {selectedLog.userName || selectedLog.userId || 'Hệ thống'}
                  </span>
                  {selectedLog.ipAddress && (
                    <span className="text-[11px] text-fg-muted block font-mono">
                      IP: {selectedLog.ipAddress}
                    </span>
                  )}
                </div>
              </div>

              {/* JSON Diff Blocks */}
              <div className="space-y-3">
                {selectedLog.oldValuesJson && (
                  <div>
                    <span className="text-caption font-bold text-danger-strong flex items-center gap-1.5 mb-1.5">
                      <Icon name="history" size="xs" /> Giá trị trước khi thay đổi (Old Values)
                    </span>
                    <pre className="p-3.5 rounded-brand-md bg-neutral-900 text-neutral-100 font-mono text-[12px] overflow-x-auto max-h-56 leading-relaxed border border-neutral-800">
                      {formatJson(selectedLog.oldValuesJson)}
                    </pre>
                  </div>
                )}

                <div>
                  <span className="text-caption font-bold text-success-strong flex items-center gap-1.5 mb-1.5">
                    <Icon name="done_all" size="xs" /> Giá trị ghi nhận mới (New Values)
                  </span>
                  <pre className="p-3.5 rounded-brand-md bg-neutral-900 text-neutral-100 font-mono text-[12px] overflow-x-auto max-h-64 leading-relaxed border border-neutral-800">
                    {selectedLog.newValuesJson ? formatJson(selectedLog.newValuesJson) : 'Không có payload dữ liệu mới.'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-neutral-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
