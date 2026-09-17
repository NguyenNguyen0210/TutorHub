import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import disputeService from '@/services/dispute.service';
import sessionService from '@/services/session.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { message } from 'antd';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function DisputeNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(sessionId));
  const [sessionError, setSessionError] = useState(null);

  const [reason, setReason] = useState('TutorNoShow');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const reasonsList = [
    { key: 'TutorNoShow', title: 'Gia sư vắng mặt không báo trước', desc: 'Học viên vào lớp đúng giờ nhưng gia sư không xuất hiện.' },
    { key: 'IncompleteSession', title: 'Buổi học không trọn vẹn thời lượng', desc: 'Gia sư kết thúc buổi học sớm hơn thời gian quy định.' },
    { key: 'QualityIssue', title: 'Nội dung không đúng cam kết', desc: 'Gia sư không chuẩn bị bài hoặc dạy không đúng lộ trình.' },
    { key: 'TutorLate', title: 'Gia sư vào lớp muộn quá 15 phút', desc: 'Không bù giờ hoặc làm ảnh hưởng nghiêm trọng đến việc học.' },
    { key: 'InappropriateBehavior', title: 'Hành vi không phù hợp', desc: 'Gia sư có thái độ, lời nói hoặc hành vi thiếu chuẩn mực.' },
    { key: 'TechnicalFailure', title: 'Sự cố kỹ thuật từ gia sư', desc: 'Mất kết nối hoặc thiết bị hỏng khiến buổi học bị gián đoạn kéo dài.' },
    { key: 'Other', title: 'Lý do khác', desc: 'Các vấn đề phát sinh khác cần ban trọng tài can thiệp đối soát.' },
  ];

  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      if (!sessionId) return;
      try {
        setSessionLoading(true);
        setSessionError(null);
        const data = await sessionService.getSessionById(sessionId);
        if (!cancelled) setSession(data);
      } catch (err) {
        if (!cancelled) setSessionError(err);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState
          title="Không tìm thấy thông tin buổi học"
          error={new Error('Đường dẫn thiếu mã buổi học (sessionId). Vui lòng chọn buổi học từ trang chi tiết khóa học.')}
          backPath="/student/dashboard"
          backLabel="Quay lại Bàn Học"
        />
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState
          error={sessionError}
          title="Không tải được thông tin buổi học"
          onRetry={() => window.location.reload()}
          backPath="/student/dashboard"
          backLabel="Quay lại Bàn Học"
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 20) {
      message.error('Mô tả chi tiết phải từ 20 ký tự trở lên để trọng tài có đủ căn cứ.');
      return;
    }

    try {
      setLoading(true);
      const created = await disputeService.createDispute({
        sessionId,
        reason,
        description: description.trim(),
      });

      if (evidenceFile && created?.id) {
        try {
          await disputeService.uploadEvidence(created.id, evidenceFile);
        } catch (uploadErr) {
          console.warn('Lỗi tải tệp bằng chứng:', uploadErr);
          message.warning('Đã tạo đơn khiếu nại nhưng tệp bằng chứng tải lên thất bại. Bạn có thể bổ sung sau.');
        }
      }

      message.success('Đã gửi đơn khiếu nại thành công! Tiền học buổi này đã được bảo chứng trong Escrow.');
      navigate('/student/dashboard');
    } catch (err) {
      message.error(err?.message || 'Không thể gửi đơn khiếu nại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link to="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bàn Học
      </Link>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mở Đơn Khiếu Nại Tranh Chấp Buổi Học</h1>
          <p className="text-xs text-text-muted">
            Hệ thống Bàn Trọng Tài bảo vệ quyền lợi tài chính minh bạch cho cả học viên và gia sư
          </p>
        </div>

        {/* Real Session Snapshot */}
        {session && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 block">
                Buổi #{session.sessionNumber} {session.subjectName ? `• ${session.subjectName}` : ''}
              </span>
              <span className="text-text-muted">
                {session.tutorName ? `Gia sư: ${session.tutorName}` : ''}
                {session.startAt ? ` • Giờ học: ${formatDateTime(session.startAt)}` : ''}
              </span>
            </div>
            <span className="font-monospace-num font-extrabold text-financial-available text-sm">
              {formatCurrency(session.earningAmount || 0)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection Cards */}
          <div className="space-y-3" role="radiogroup" aria-label="Chọn lý do khiếu nại chính">
            <span className="text-xs font-bold text-slate-800 block">Chọn lý do khiếu nại chính</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reasonsList.map((r) => (
                <div
                  key={r.key}
                  role="radio"
                  aria-checked={reason === r.key}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setReason(r.key);
                    }
                  }}
                  onClick={() => setReason(r.key)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    reason === r.key
                      ? 'border-rose-500 bg-rose-50/50 text-rose-950 shadow-xs'
                      : 'border-border-light hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{r.title}</span>
                    {reason === r.key && (
                      <span className="material-symbols-outlined text-rose-600 text-lg">radio_button_checked</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 leading-normal m-0">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed description */}
          <div className="space-y-2">
            <label htmlFor="dispute-description" className="text-xs font-bold text-slate-800 block">
              Mô tả chi tiết vụ việc (Tối thiểu 20 ký tự, bắt buộc)
            </label>
            <textarea
              id="dispute-description"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả diễn biến cụ thể (thời gian vào lớp, sự cố phát sinh...) để trọng tài có đầy đủ cơ sở đối soát..."
              className="w-full p-4 rounded-2xl border border-border-light text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
            />
          </div>

          {/* Evidence Upload Box */}
          <div className="space-y-2">
            <label htmlFor="dispute-evidence-input" className="text-xs font-bold text-slate-800 block">
              Tệp bằng chứng minh họa (Ảnh chụp màn hình, tài liệu PDF, văn bản...)
            </label>
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
              <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
              <div>
                <input
                  id="dispute-evidence-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-indigo-50 file:text-brand-indigo-700 hover:file:bg-brand-indigo-100 cursor-pointer"
                />
              </div>
              {evidenceFile && (
                <p className="text-xs text-emerald-700 font-bold m-0">
                  ✓ Đã chọn: {evidenceFile.name} ({Math.round(evidenceFile.size / 1024)} KB)
                </p>
              )}
              <p className="text-[11px] text-text-muted m-0">
                Hỗ trợ JPG, PNG, WEBP, PDF, TXT (tối đa 10 MB)
              </p>
            </div>
          </div>

          {/* Escrow Freeze Warning */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-xl shrink-0">lock</span>
            <div>
              <span className="font-bold block">Quy tắc bảo chứng tài chính:</span>
              <span>Sau khi gửi khiếu nại thành công, học phí buổi học sẽ được bảo chứng trong Escrow và chỉ được giải ngân hoặc hoàn trả theo phán quyết phân xử của Admin.</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {loading ? 'Đang gửi...' : 'Gửi Đơn Khiếu Nại Lên Admin'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Hủy Bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
