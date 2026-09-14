import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function StudentDashboard() {
  const student = {
    name: 'Phạm Minh Tuấn',
    target: 'Đạt 9+ Môn Toán Kỳ Thi THPT QG 2026',
    strikes: 0,
    escrowBalance: 1600000,
    activeContractsCount: 1,
    nextSession: {
      id: 'sess-003',
      sessionNumber: 3,
      subject: 'Toán THPT (Chuyên đề Hình Không Gian Oxyz)',
      tutorName: 'ThS. Nguyễn Văn An',
      time: 'Ngày mai • 18:00 - 19:00',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
    },
    actionableSession: {
      id: 'sess-002',
      sessionNumber: 2,
      subject: 'Toán THPT (Tích phân & Ứng dụng)',
      hoursLeft: 16,
      amount: 200000,
    },
    activeContract: {
      id: 'e1e1e1e1-0001',
      subject: 'Luyện thi THPT Toán 10 buổi',
      tutorName: 'ThS. Nguyễn Văn An',
      completedSessions: 2,
      totalSessions: 10,
      totalAmount: 2000000,
      usedAmount: 400000,
      remainingAmount: 1600000,
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng trở lại, {student.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Mục tiêu học tập: <span className="font-bold text-brand-indigo-600">{student.target}</span>
          </p>
        </div>
        <Link
          to="/tutors"
          className="px-4 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">search</span>
          Tìm Thêm Gia Sư
        </Link>
      </div>

      {/* 4 Signature Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gói Học Đang Học</span>
            <span className="w-8 h-8 rounded-xl bg-brand-indigo-50 text-brand-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-monospace-num">
            {student.activeContractsCount} <span className="text-xs font-normal text-text-muted">gói dịch vụ</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Tiến độ 2/10 buổi hoàn thành</p>
        </div>

        {/* Card 2: Escrow Protected */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Học Phí Trong Escrow</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-financial-available font-monospace-num">
            {formatCurrency(student.escrowBalance)}
          </div>
          <p className="text-[11px] text-text-muted">Bảo chứng an toàn cho 8 buổi còn lại</p>
        </div>

        {/* Card 3: Next Session */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Buổi Học Sắp Tới</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">calendar_clock</span>
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            Ngày mai 18:00
          </div>
          <p className="text-[11px] text-brand-indigo-600 font-semibold line-clamp-1">{student.nextSession.tutorName}</p>
        </div>

        {/* Card 4: Strike Metric */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chỉ Số Tín Nhiệm</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-monospace-num">
            0 / 3 Strikes
          </div>
          <p className="text-[11px] text-text-muted">Uy tín 100% • Không vi phạm vắng mặt</p>
        </div>
      </div>

      {/* Actionable Urgent Attendance Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-2 border-amber-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950">
              Buổi học hôm qua #2 đã kết thúc — Vui lòng đối soát điểm danh!
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Cửa sổ đối soát 24h còn lại <strong>{student.actionableSession.hoursLeft} giờ</strong> trước khi tiền học ({formatCurrency(student.actionableSession.amount)}) tự động giải ngân cho gia sư.
            </p>
          </div>
        </div>
        <Link
          to={`/student/sessions/${student.actionableSession.id}`}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          Xác Nhận Điểm Danh Ngay
        </Link>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Sessions & Next Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-indigo-600">event_available</span>
                Lịch Học Trong Tuần Này
              </h3>
              <span className="text-xs font-bold text-brand-indigo-600">Thời gian thực (UTC+7)</span>
            </div>

            {/* Next session card */}
            <div className="p-5 rounded-2xl bg-brand-indigo-50/50 border border-brand-indigo-100/80 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-indigo-600 text-white text-[10px] font-extrabold uppercase">
                    Buổi #{student.nextSession.sessionNumber} Sắp Diễn Ra
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{student.nextSession.subject}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Gia sư: <strong>{student.nextSession.tutorName}</strong></p>
                </div>
                <span className="text-xs font-bold text-brand-indigo-700 font-monospace-num">
                  {student.nextSession.time}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-indigo-100">
                <a
                  href={student.nextSession.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">video_camera_front</span>
                  Vào Phòng Google Meet
                </a>
                <Link
                  to={`/student/sessions/${student.nextSession.id}`}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Xem Chi Tiết Buổi Học
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Active Contract Hub Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">assignment</span>
              Hợp Đồng Đang Hiệu Lực
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{student.activeContract.subject}</h4>
                <p className="text-[11px] text-text-muted">Gia sư: {student.activeContract.tutorName}</p>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Tiến độ khóa học:</span>
                  <span className="text-brand-indigo-600 font-bold font-monospace-num">
                    {student.activeContract.completedSessions}/{student.activeContract.totalSessions} buổi (20%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-indigo-600 h-full w-[20%] rounded-full"></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-text-muted">
                  <span>Đã giải ngân:</span>
                  <span className="font-monospace-num font-bold text-slate-800">{formatCurrency(student.activeContract.usedAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Còn lại trong Escrow:</span>
                  <span className="font-monospace-num">{formatCurrency(student.activeContract.remainingAmount)}</span>
                </div>
              </div>

              <Link
                to={`/student/enrollments/${student.activeContract.id}`}
                className="w-full py-2.5 rounded-xl bg-brand-indigo-50 hover:bg-brand-indigo-100 text-brand-indigo-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 block text-center"
              >
                Vào Trung Tâm Hợp Đồng
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
