import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function AdminDisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseId = id || 'ba07ba07-0001';

  const [refundAmount, setRefundAmount] = useState(200000);
  const [adminNote, setAdminNote] = useState('Qua kiểm tra log Google Meet, gia sư không tham gia phòng học. Chấp thuận hoàn 100% học phí buổi cho học viên.');
  const [resolving, setResolving] = useState(false);

  // DEC-S8-025 Formula
  const originalSessionFee = 200000;
  const platformFeeRate = 0.10; // 10%
  const tutorReceivedOriginal = originalSessionFee * (1 - platformFeeRate); // 180,000

  // Calculate proportional clawback
  const refundRatio = refundAmount / originalSessionFee;
  const tutorClawback = Math.round(tutorReceivedOriginal * refundRatio); // max 180,000
  const platformFeeRefund = refundAmount - tutorClawback; // 20,000

  const handleResolve = (isApproved) => {
    setResolving(true);
    setTimeout(() => {
      setResolving(false);
      if (isApproved) {
        message.success(`Đã phê duyệt hoàn tiền ${formatCurrency(refundAmount)} cho học viên. Tiền đã giải phóng khỏi Escrow.`);
      } else {
        message.info('Đã bác bỏ khiếu nại. Học phí giải ngân cho gia sư.');
      }
      navigate('/admin/dashboard');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bảng Điều Hành Admin
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Bàn Trọng Tài & Phân Xử Khiếu Nại Buổi Học
            </h1>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-extrabold border border-rose-500/30">
              Vụ #{caseId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình giải quyết tranh chấp theo bất biến tài chính DEC-S8-025
          </p>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Buổi học phát sinh:</span>
            <span className="text-white font-extrabold">Buổi #3 • Môn Toán THPT</span>
          </div>
          <div>
            <span className="text-slate-400 block">Bên khiếu nại (Học viên):</span>
            <span className="text-white font-extrabold">Phạm Minh Tuấn (0 Strikes)</span>
          </div>
          <div>
            <span className="text-slate-400 block">Bên giải trình (Gia sư):</span>
            <span className="text-white font-extrabold">ThS. Nguyễn Văn An (0 Strikes)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2 text-xs">
          <span className="text-rose-400 font-extrabold block">Lý do khiếu nại: TutorNoShow (Gia sư vắng mặt không báo trước)</span>
          <p className="text-slate-300 leading-relaxed">
            "Em vào phòng học Google Meet lúc 18:00 và chờ 30 phút đến 18:30 nhưng thầy An không vào lớp và không trả lời tin nhắn của em."
          </p>
          <div className="pt-2 flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-base">attachment</span>
            <span>Bằng chứng đính kèm: <strong>meet-waiting-18h25.png</strong> (854 KB)</span>
          </div>
        </div>
      </div>

      {/* DEC-S8-025 Fee Balancing Calculator Card with Glow */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border-2 border-brand-indigo-500 shadow-2xl space-y-6 glow-indigo">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-indigo-400">calculate</span>
            Bộ Cân Bằng Tài Chính DEC-S8-025 (Financial Invariant Calculator)
          </h3>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-extrabold border border-emerald-500/30">
            Bất Biến Bảo Toàn ✅
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <label className="font-extrabold text-slate-300">
              Số tiền hoàn trả học viên (₫):
            </label>
            <span className="text-2xl font-extrabold text-emerald-400 font-monospace-num">
              {formatCurrency(refundAmount)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={originalSessionFee}
            step="10000"
            value={refundAmount}
            onChange={(e) => setRefundAmount(parseInt(e.target.value))}
            className="w-full accent-brand-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />

          {/* Visual Distribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1">
              <span className="text-slate-400 block">Thu hồi từ ví gia sư (Max: 180.000 ₫):</span>
              <span className="text-lg font-extrabold text-rose-400 font-monospace-num">
                -{formatCurrency(tutorClawback)}
              </span>
              <p className="text-[10px] text-slate-500">Khấu trừ thu nhập thực nhận, không phạt âm ví</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1">
              <span className="text-slate-400 block">Hoàn phí sàn TutorHub (Tỷ lệ 10%):</span>
              <span className="text-lg font-extrabold text-blue-400 font-monospace-num">
                -{formatCurrency(platformFeeRefund)}
              </span>
              <p className="text-[10px] text-slate-500">Sàn TutorHub hoàn trả phí dịch vụ tương ứng</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-center font-mono text-xs text-slate-400">
            {formatCurrency(tutorClawback)} (Gia sư) + {formatCurrency(platformFeeRefund)} (Phí sàn) ≡ <strong className="text-emerald-400">{formatCurrency(refundAmount)}</strong> (Học viên nhận)
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Phán quyết & Căn cứ trọng tài</label>
          <textarea
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-brand-indigo-500 outline-hidden leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve(true)}
            className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 sheen-btn"
          >
            <span className="material-symbols-outlined text-base">verified</span>
            Phê Duyệt Hoàn Tiền {formatCurrency(refundAmount)}
          </button>
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve(false)}
            className="py-3 px-6 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors"
          >
            Bác Bỏ Khiếu Nại
          </button>
        </div>
      </div>
    </div>
  );
}
