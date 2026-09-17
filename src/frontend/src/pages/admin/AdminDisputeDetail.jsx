import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import adminService from '@/services/admin.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { message, Modal } from 'antd';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function AdminDisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investigation, setInvestigation] = useState(null);

  const [refundAmount, setRefundAmount] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchInvestigation() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getDisputeDetail(id);
        if (!cancelled) {
          setInvestigation(data);
          const gross = Number(data?.financialSummary?.disputedGrossAmount ?? data?.dispute?.heldAmount ?? 0);
          setRefundAmount(gross);
          setAdminNote(data?.dispute?.adminNotes || '');
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) {
      fetchInvestigation();
    } else {
      setError(new Error('Mã khiếu nại không hợp lệ.'));
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          error={error}
          title="Không thể tải hồ sơ điều tra tranh chấp"
          onRetry={() => window.location.reload()}
          backPath="/admin/disputes"
          backLabel="Quay lại danh sách tranh chấp"
        />
      </div>
    );
  }

  const { dispute, session, enrollment, financialSummary } = investigation;
  const originalSessionFee = Number(financialSummary?.disputedGrossAmount ?? session?.earningAmount ?? 0);
  const platformFeeRate = Number(enrollment?.platformFeeRate ?? 0.10);
  const tutorReceivedOriginal = Number(financialSummary?.originalTutorNet ?? Math.round(originalSessionFee * (1 - platformFeeRate)));

  // DEC-S8-025 Formula
  const refundRatio = originalSessionFee > 0 ? refundAmount / originalSessionFee : 0;
  const tutorClawback = Math.round(tutorReceivedOriginal * refundRatio);
  const platformFeeRefund = Math.max(0, refundAmount - tutorClawback);

  const handleResolve = (decisionType) => {
    if (!adminNote || adminNote.trim().length < 10) {
      message.error('Vui lòng nhập căn cứ trọng tài chi tiết (tối thiểu 10 ký tự).');
      return;
    }

    let decision;
    let customRefund = null;
    let confirmTitle = '';
    let confirmContent = '';

    if (decisionType === 'refund') {
      decision = refundAmount >= originalSessionFee ? 'StudentWinsFullRefund' : 'StudentWinsPartialRefund';
      customRefund = refundAmount < originalSessionFee ? refundAmount : null;
      confirmTitle = 'Xác nhận phán quyết hoàn tiền cho học viên';
      confirmContent = `Bạn có chắc chắn muốn hoàn ${formatCurrency(refundAmount)} cho học viên? Thu hồi từ gia sư: ${formatCurrency(tutorClawback)}, hoàn phí sàn: ${formatCurrency(platformFeeRefund)}.`;
    } else if (decisionType === 'release') {
      decision = 'TutorWinsReleaseEarning';
      confirmTitle = 'Xác nhận giải ngân cho gia sư (Gia sư thắng)';
      confirmContent = `Học phí buổi học (${formatCurrency(originalSessionFee)}) sẽ được giải ngân cho gia sư sau khi trừ phí sàn.`;
    } else {
      decision = 'DismissedNoFinancialChange';
      confirmTitle = 'Xác nhận bác bỏ khiếu nại (Không thay đổi tài chính)';
      confirmContent = 'Tiền học sẽ không được hoàn trả và khiếu nại sẽ được khép lại.';
    }

    Modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      okText: 'Xác nhận phán quyết',
      cancelText: 'Hủy bỏ',
      okButtonProps: { danger: decisionType === 'dismiss' },
      onOk: async () => {
        try {
          setResolving(true);
          await adminService.applyDisputeVerdict(id, {
            decision,
            customRefundAmount: customRefund,
            adminNotes: adminNote.trim(),
          });
          message.success('Đã ghi nhận phán quyết trọng tài thành công.');
          navigate('/admin/disputes');
        } catch (err) {
          message.error(err?.message || 'Không thể thực hiện phán quyết phân xử.');
        } finally {
          setResolving(false);
        }
      },
    });
  };

  const evidences = dispute?.evidences || investigation?.evidences || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/admin/disputes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bàn Trọng Tài
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Bàn Trọng Tài & Phân Xử Khiếu Nại Buổi Học
            </h1>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-extrabold border border-rose-500/30">
              {dispute?.status || 'Open'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Mã vụ việc: {id}
          </p>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Buổi học phát sinh:</span>
            <span className="text-white font-extrabold">
              Buổi #{session?.sessionNumber || '—'} • {formatCurrency(originalSessionFee)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Bên khiếu nại (Học viên):</span>
            <span className="text-white font-extrabold">
              {dispute?.initiatorName || dispute?.initiatorUserId || 'Học viên'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Bên giải trình (Gia sư):</span>
            <span className="text-white font-extrabold">
              {dispute?.respondentName || dispute?.respondentUserId || 'Gia sư'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2 text-xs">
          <span className="text-rose-400 font-extrabold block">
            Lý do khiếu nại: {dispute?.reason}
          </span>
          <p className="text-slate-300 leading-relaxed m-0">
            {dispute?.description || 'Không có mô tả chi tiết từ bên khiếu nại.'}
          </p>
          <div className="text-[11px] text-slate-500 pt-1">
            Thời điểm mở khiếu nại: {formatDateTime(dispute?.createdAt)}
          </div>
        </div>

        {/* Evidences list */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-brand-indigo-400">attachment</span>
            Tài liệu & Bằng chứng xác minh ({evidences.length})
          </h4>
          {evidences.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-xs text-amber-400">
              Chưa có tệp bằng chứng nào được tải lên cho vụ khiếu nại này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidences.map((ev, idx) => (
                <a
                  key={ev.id || idx}
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-brand-indigo-500 transition-colors flex items-center justify-between text-xs text-slate-300"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold block truncate text-white">{ev.fileName}</span>
                    <span className="text-[10px] text-slate-500">
                      {ev.fileSizeBytes ? `${Math.round(ev.fileSizeBytes / 1024)} KB` : ''} • {ev.contentType}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-base text-brand-indigo-400">open_in_new</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DEC-S8-025 Fee Balancing Calculator Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border-2 border-brand-indigo-500 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-indigo-400">calculate</span>
            Bộ Cân Bằng Tài Chính DEC-S8-025
          </h3>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-extrabold border border-emerald-500/30">
            Bảo Toàn Phí Sàn {(platformFeeRate * 100).toFixed(0)}%
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="dispute-refund-slider" className="font-extrabold text-slate-300">
              Số tiền hoàn trả học viên (₫):
            </label>
            <span className="text-2xl font-extrabold text-emerald-400 font-monospace-num">
              {formatCurrency(refundAmount)}
            </span>
          </div>

          <input
            id="dispute-refund-slider"
            type="range"
            aria-label="Số tiền hoàn trả học viên"
            min="0"
            max={Math.max(originalSessionFee, 10000)}
            step="10000"
            value={refundAmount}
            onChange={(e) => setRefundAmount(parseInt(e.target.value, 10) || 0)}
            className="w-full accent-brand-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />

          {/* Visual Distribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1">
              <span className="text-slate-400 block">
                Thu hồi từ gia sư (Max: {formatCurrency(tutorReceivedOriginal)}):
              </span>
              <span className="text-lg font-extrabold text-rose-400 font-monospace-num">
                -{formatCurrency(tutorClawback)}
              </span>
              <p className="text-[10px] text-slate-500">Khấu trừ thu nhập thực nhận của buổi học</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1">
              <span className="text-slate-400 block">
                Hoàn phí sàn TutorHub ({(platformFeeRate * 100).toFixed(0)}%):
              </span>
              <span className="text-lg font-extrabold text-blue-400 font-monospace-num">
                -{formatCurrency(platformFeeRefund)}
              </span>
              <p className="text-[10px] text-slate-500">Sàn hoàn trả phí dịch vụ theo tỷ lệ snapshot</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-center font-mono text-xs text-slate-400">
            {formatCurrency(tutorClawback)} (Gia sư) + {formatCurrency(platformFeeRefund)} (Phí sàn) ≡{' '}
            <strong className="text-emerald-400">{formatCurrency(refundAmount)}</strong> (Học viên nhận)
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="dispute-admin-note" className="text-xs font-bold text-slate-300 block">
            Căn cứ phán quyết trọng tài (bắt buộc)
          </label>
          <textarea
            id="dispute-admin-note"
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Ghi rõ lý do căn cứ theo biên bản đối soát và bằng chứng xác minh..."
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-brand-indigo-500 outline-none leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('refund')}
            className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <span className="material-symbols-outlined text-base">verified</span>
            Phán Quyết Hoàn Tiền ({formatCurrency(refundAmount)})
          </button>

          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('release')}
            className="py-3 px-5 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Giải Ngân Cho Gia Sư (Gia Sư Thắng)
          </button>

          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('dismiss')}
            className="py-3 px-5 rounded-2xl bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-extrabold text-xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Bác Bỏ Khiếu Nại (Không Đổi Tiền)
          </button>
        </div>
      </div>
    </div>
  );
}
