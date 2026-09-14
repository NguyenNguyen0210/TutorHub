import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function TutorDashboard() {
  const tutorData = {
    fullName: 'ThS. Nguyễn Văn An',
    rating: 4.90,
    reviewCount: 28,
    activeStudents: 5,
    weeklySessions: 6,
    pendingBalance: 3600000,
    availableBalance: 900000,
    strikes: 0,
    upcomingClass: {
      studentName: 'Phạm Minh Tuấn',
      subject: 'Toán THPT (Buổi #3/10: Khối Đa Diện & Oxyz)',
      time: '18:00 - 19:00',
      minutesLeft: 25,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
    },
    actionItems: [
      { id: 'act-1', text: 'Nhập Nhật ký buổi học cho Buổi #2 (Học viên Phạm Minh Tuấn)', link: '/tutor/dashboard' },
      { id: 'act-2', text: 'Đề xuất thỏa thuận riêng Custom Agreement 5 buổi đang chờ học viên duyệt', link: '/app/messages' },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tutorData.fullName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-financial-available-bg text-financial-available text-xs font-bold border border-financial-available/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Master Tutor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Đánh giá: <span className="font-bold text-amber-500">★ {tutorData.rating.toFixed(2)}</span> ({tutorData.reviewCount} nhận xét từ học viên)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tutor/availability"
            className="px-4 py-2.5 rounded-xl border border-border-light bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Thời Khóa Biểu
          </Link>
          <Link
            to="/tutor/wallet/withdraw"
            className="px-4 py-2.5 rounded-xl bg-financial-available hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Rút Tiền Ví
          </Link>
        </div>
      </div>

      {/* 4 Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Học Viên Đang Dạy</span>
            <span className="w-8 h-8 rounded-xl bg-brand-indigo-50 text-brand-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">group</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-monospace-num">
            {tutorData.activeStudents} <span className="text-xs font-normal text-text-muted">học viên</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">8 hợp đồng đang học</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Lịch Dạy Tuần Này</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-monospace-num">
            {tutorData.weeklySessions} <span className="text-xs font-normal text-text-muted">buổi dạy</span>
          </div>
          <p className="text-[11px] text-brand-indigo-600 font-semibold">Buổi gần nhất: Hôm nay 18:00</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ví Ký Quỹ Escrow</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-monospace-num">
            {formatCurrency(tutorData.availableBalance)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold">
            {formatCurrency(tutorData.pendingBalance)} chờ giải ngân
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chỉ Số Tín Nhiệm Sàn</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">military_tech</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-monospace-num">
            0 / 2 Strikes
          </div>
          <p className="text-[11px] text-text-muted">Huy hiệu Gia Sư Uy Tín Vàng 🌟</p>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Class & Pending Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Class Card */}
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">play_circle</span>
                Lớp Học Tiếp Theo Hôm Nay
              </h3>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold font-monospace-num">
                Còn {tutorData.upcomingClass.minutesLeft} phút nữa bắt đầu
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div>
                <span className="text-xs text-text-muted font-bold block">Học viên: {tutorData.upcomingClass.studentName}</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">{tutorData.upcomingClass.subject}</h4>
                <p className="text-xs text-brand-indigo-600 font-semibold mt-0.5">Thời gian: {tutorData.upcomingClass.time}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={tutorData.upcomingClass.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">video_camera_front</span>
                  Vào Phòng Google Meet (Tích Hợp Điểm Danh)
                </a>
                <button
                  type="button"
                  className="px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  Xem Lộ Trình & Nhật Ký
                </button>
              </div>
            </div>
          </div>

          {/* Pending Action Items */}
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">notification_important</span>
              Việc Cần Xử Lý Ngay
            </h3>

            <div className="space-y-2.5">
              {tutorData.actionItems.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-slate-800 font-medium">{act.text}</span>
                  <Link
                    to={act.link}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Xử lý
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Access Cards */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">bolt</span>
              Lối Tắt Nhanh
            </h3>

            <div className="space-y-2.5">
              <Link
                to="/tutor/services"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-indigo-600">inventory_2</span>
                  3 Gói Dịch Vụ Đang Mở
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
              <Link
                to="/tutor/availability"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">calendar_month</span>
                  Cài Đặt Lịch Rảnh Tuần
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
              <Link
                to="/tutor/wallet"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">account_balance_wallet</span>
                  Sao Kê & Ví Bảo Chứng
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
