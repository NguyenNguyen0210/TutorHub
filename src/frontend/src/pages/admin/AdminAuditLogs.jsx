import React, { useState, useEffect } from 'react';
import adminService from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatters';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        setLoading(true);
        const params = { pageSize: 50 };
        if (searchTerm.trim()) {
          // If search looks like a correlation ID
          if (searchTerm.startsWith('corr-') || searchTerm.startsWith('CORR-')) {
            params.correlationId = searchTerm.trim();
          } else {
            params.entityName = searchTerm.trim();
          }
        }
        const res = await adminService.getAuditLogs(params);
        if (isMounted) {
          setLogs(res?.items || []);
          setTotalCount(res?.totalCount || 0);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(loadLogs, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Sổ Cái Kiểm Toán Bất Biến Trung Tâm (Central Audit Log)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hệ thống sổ cái Append-Only ghi nhận vĩnh viễn mọi biến động Escrow, hợp đồng và phán quyết trọng tài
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo CorrelationId, EntityName (VD: corr-..., Dispute, Transaction)..."
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
        />
        <span className="text-xs text-slate-400 font-mono">
          Tổng bản ghi: <strong>{totalCount}</strong>
        </span>
      </div>

      {error && (
        <ErrorState
          error={error}
          title="Không thể tải sổ cái kiểm toán"
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Audit Table */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Không tìm thấy bản ghi kiểm toán nào"
            description="Thử xóa bộ lọc tìm kiếm để xem tất cả các giao dịch sổ cái đã lưu vết."
          />
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 font-bold border-b border-slate-700 pb-2">
              <tr>
                <th className="p-3">Thời gian (UTC)</th>
                <th className="p-3">CorrelationId</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Thực thể</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Thay đổi (Old / New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.createdAt, 'DD/MM/YYYY HH:mm:ss')}
                  </td>
                  <td className="p-3 font-mono font-bold text-brand-indigo-400 whitespace-nowrap">
                    {log.correlationId}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white">
                    {log.entityName}
                    {log.entityId && (
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        #{log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">{log.userName || log.userId || 'Hệ thống'}</td>
                  <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate font-mono">
                    {log.newValuesJson ? (
                      <span title={log.newValuesJson}>{log.newValuesJson}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
