import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';

export default function EscrowVaultSimulator() {
  const [activeStep, setActiveStep] = useState(2); // 1: Completed, 2: In-verification, 3: Dispute demo, 4: Locked
  const [dualConfirmed, setDualConfirmed] = useState({ student: false, tutor: false });

  // Calculate simulated balances based on state
  let releasedAmount = 200000;
  let inProgressAmount = 200000;
  let lockedAmount = 1600000;
  let heldDisputeAmount = 0;

  if (activeStep === 1) {
    releasedAmount = 400000;
    inProgressAmount = 0;
    lockedAmount = 1600000;
  } else if (activeStep === 3) {
    heldDisputeAmount = 200000;
    inProgressAmount = 0;
    lockedAmount = 1600000;
  }

  const handleStudentConfirm = () => {
    setDualConfirmed(prev => ({ ...prev, student: !prev.student }));
  };

  const handleTutorConfirm = () => {
    setDualConfirmed(prev => ({ ...prev, tutor: !prev.tutor }));
  };

  const isFullyConfirmed = dualConfirmed.student && dualConfirmed.tutor;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-brand-navy-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden my-8">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Concept */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cơ chế độc quyền: Ký quỹ học phí 2 chiều
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Học tập an tâm: Tiền luôn được bảo vệ trong két Escrow
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Học phí cả khóa được khóa trong tài khoản ký quỹ độc lập. Chỉ giải ngân cho gia sư sau mỗi buổi học khi cả học viên và gia sư cùng bấm xác nhận có mặt.
          </p>
        </div>

        {/* Live Metrics Pill */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <div className="px-3 py-1.5 text-center">
            <span className="block text-[11px] text-slate-400">Đang giữ trong két</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">
              {formatCurrency(lockedAmount + (activeStep === 3 ? heldDisputeAmount : inProgressAmount))}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
          <div className="px-3 py-1.5 text-center">
            <span className="block text-[11px] text-slate-400">Đã giải ngân</span>
            <span className="text-sm font-extrabold text-indigo-400 font-mono">
              {formatCurrency(releasedAmount)}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
          <div className="px-3 py-1.5 text-center">
            <span className="block text-[11px] text-slate-400">Rủi ro mất tiền</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">0 đ (100% An toàn)</span>
          </div>
        </div>
      </div>

      {/* Interactive 10-Session Roadmap */}
      <div className="relative z-10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-300">
            Trải nghiệm lộ trình hợp đồng 10 buổi học (Bấm vào từng buổi để xem dòng tiền):
          </span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
            Mô phỏng Hợp đồng #CTR-2026-THB
          </span>
        </div>

        {/* 10 Session Interactive Nodes */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            let stateStyle = "bg-slate-800/80 border-slate-700 text-slate-400";
            let stateText = "Khóa trong Escrow";
            let icon = "lock";

            if (num === 1) {
              stateStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 ring-2 ring-emerald-500/30";
              stateText = "Đã giải ngân";
              icon = "verified";
            } else if (num === 2) {
              stateStyle = "bg-amber-500/20 border-amber-500/40 text-amber-300 ring-2 ring-amber-500/30 animate-pulse";
              stateText = "Đang đối soát 24h";
              icon = "schedule";
            } else if (num === 3) {
              stateStyle = "bg-rose-500/20 border-rose-500/40 text-rose-300";
              stateText = "Khiếu nại No-show";
              icon = "gavel";
            }

            const isSelected = activeStep === (num <= 3 ? num : 4);

            return (
              <button
                key={num}
                type="button"
                onClick={() => setActiveStep(num <= 3 ? num : 4)}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center group cursor-pointer ${stateStyle} ${
                  isSelected ? 'scale-105 shadow-lg border-white/40' : 'hover:scale-102 hover:border-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-base mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {icon}
                </span>
                <span className="text-xs font-bold font-mono">Buổi {num}</span>
                <span className="text-[9px] mt-1 opacity-80 line-clamp-1">{stateText}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Detail Box based on activeStep */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800">
          {activeStep === 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Buổi 1: Học viên & Gia sư đã cùng xác nhận có mặt
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Hệ thống lập tức kích hoạt lệnh giải ngân <strong className="text-white">180.000 ₫</strong> (90%) vào ví khả dụng của gia sư. Phí sàn <strong className="text-white">20.000 ₫</strong> (10%) được trích tự động.
                </p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                Giải ngân thành công
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">timer</span>
                      Buổi 2: Buổi học vừa kết thúc • Đang mở cửa sổ đối soát 24 giờ
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Bấm thử xác nhận điểm danh 2 chiều bên dưới để xem tiền giải ngân như thế nào:
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Còn 18h 45m
                </span>
              </div>

              {/* Two-way action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStudentConfirm}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dualConfirmed.student
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {dualConfirmed.student ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  Học viên: {dualConfirmed.student ? 'Đã điểm danh có mặt' : 'Bấm xác nhận có mặt'}
                </button>

                <button
                  type="button"
                  onClick={handleTutorConfirm}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dualConfirmed.tutor
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {dualConfirmed.tutor ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  Gia sư: {dualConfirmed.tutor ? 'Đã điểm danh có mặt' : 'Bấm xác nhận có mặt'}
                </button>

                {isFullyConfirmed ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-base">done_all</span>
                    Cả hai bên đã xác nhận! Tiền lập tức mở khóa giải ngân.
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    (Cần cả 2 bên cùng xác nhận để mở két giải ngân)
                  </span>
                )}
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">shield</span>
                    Buổi 3: Thử nghiệm Khiếu nại vắng mặt (Gia sư No-show)
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Hệ thống phong tỏa ngay lập tức <strong className="text-rose-300">200.000 ₫</strong> trong Escrow. Ban trọng tài kích hoạt công thức chuẩn <strong>DEC-S8-025</strong> hoàn 100% cho học viên, gia sư bị phạt 1 strike vắng mặt.
                </p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold font-mono">
                Bảo vệ học viên 100%
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">lock</span>
                    Các buổi 4 đến 10: Đang được phong tỏa an toàn trong Két Escrow
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Tổng cộng <strong className="text-white">1.400.000 ₫</strong> còn lại chưa học. Bạn có quyền dừng khóa học bất kỳ lúc nào để nhận lại số tiền này theo chính sách Pro-rata Refund minh bạch.
                </p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold font-mono">
                Ký quỹ an toàn
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
