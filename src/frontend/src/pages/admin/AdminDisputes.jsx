import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '@/services/admin.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDisputes() {
      try {
        setLoading(true);
        setError(null);
        const res = await adminService.getDisputes({
          pageNumber,
          pageSize,
          status: statusFilter || null,
        });
        if (!cancelled) {
          const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
          setDisputes(items);
          setTotalCount(res?.totalCount ?? items.length);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDisputes();
    return () => {
      cancelled = true;
    };
  }, [pageNumber, pageSize, statusFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'UnderReview':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Dismissed':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'RequiresAdminFinancialIntervention':
        return 'bg-red-500/30 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bàn Trọng Tài — Danh Sách Khiếu Nại Tranh Chấp
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Giám sát, điều tra và phân xử các khiếu nại phát sinh từ đối soát điểm danh
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700 text-xs">
          {[
            { key: '', label: 'Tất cả' },
            { key: 'Open', label: 'Mới mở' },
            { key: 'UnderReview', label: 'Đang điều tra' },
            { key: 'Resolved', label: 'Đã hoàn tiền' },
            { key: 'Dismissed', label: 'Đã bác bỏ' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPageNumber(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === tab.key
                  ? 'bg-brand-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
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
          onRetry={() => window.location.reload()}
        />
      )}

      {!loading && !error && disputes.length === 0 && (
        <EmptyState
          title="Không có vụ khiếu nại nào"
          description={
            statusFilter
              ? 'Không tìm thấy khiếu nại nào phù hợp với bộ lọc đã chọn.'
              : 'Hiện tại hệ thống không có khiếu nại tranh chấp nào đang mở.'
          }
        />
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Mã Vụ Việc</th>
                  <th className="py-3.5 px-4">Lý Do Khiếu Nại</th>
                  <th className="py-3.5 px-4">Học Viên / Gia Sư</th>
                  <th className="py-3.5 px-4 text-right">Số Tiền Giữ</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white truncate max-w-[120px]">
                      #{d.id.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {d.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>HV: <span className="text-slate-200 font-medium">{d.initiatorName || d.initiatorUserId?.substring(0, 8)}</span></div>
                      <div>GS: <span className="text-slate-200 font-medium">{d.respondentName || d.respondentUserId?.substring(0, 8)}</span></div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-monospace-num font-bold text-financial-available">
                      {formatCurrency(d.heldAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {d.createdAt ? formatDateTime(d.createdAt, 'DD/MM HH:mm') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/admin/disputes/${d.id}`}
                        className="py-1.5 px-3 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        Phân Xử
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span>
                Hiển thị trang <strong>{pageNumber}</strong> / {totalPages} (Tổng {totalCount} vụ việc)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  className="py-1.5 px-3 rounded-xl border border-slate-600 bg-slate-800 disabled:opacity-40 font-bold hover:bg-slate-700 transition-colors"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="py-1.5 px-3 rounded-xl border border-slate-600 bg-slate-800 disabled:opacity-40 font-bold hover:bg-slate-700 transition-colors"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
