import React from 'react';
import Icon from '@/components/ui/Icon';

export default function HowItWorksHeroVisual() {
  return (
    <div className="relative flex w-full max-w-[580px] select-none items-center justify-center">
      {/* Vòng hào quang sáng mờ phía sau */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/50 blur-3xl"
        aria-hidden="true"
      />

      {/* Chữ nghệ thuật trang trí phía sau */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 left-4 -rotate-6 select-none font-serif text-sm font-semibold italic text-blue-900/20"
      >
        Connect · Learn · Succeed
      </p>

      {/* Đường nối SVG mô phỏng luồng kết nối quy trình */}
      <svg
        className="pointer-events-none absolute inset-0 -z-0 h-full w-full"
        viewBox="0 0 580 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M 120 75 C 180 75, 220 120, 290 140 C 360 160, 400 90, 460 90"
          stroke="#bfdbfe"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M 120 365 C 180 365, 220 320, 290 300 C 360 280, 400 350, 460 350"
          stroke="#bfdbfe"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
      </svg>

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Hàng trên: Bước 1 (Chọn gói học) & Bước 2 (Ký quỹ) */}
        <div className="flex w-full items-center justify-between gap-4 px-2 sm:px-4">
          {/* Card Bước 1 */}
          <div className="animate-float flex max-w-[220px] items-center gap-3 rounded-2xl border border-blue-200/90 bg-white/95 p-3.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-transform">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <Icon name="search" size="md" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-600">Bước 1</span>
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">Chọn gói học</p>
              <p className="line-clamp-1 text-[11px] text-slate-500">Thống nhất lộ trình</p>
            </div>
          </div>

          {/* Card Bước 2 */}
          <div
            className="animate-float flex max-w-[220px] items-center gap-3 rounded-2xl border border-blue-200/90 bg-white/95 p-3.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-transform"
            style={{ animationDelay: '0.8s' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
              <Icon name="shield" size="md" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600">Bước 2</span>
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">Ký quỹ an toàn</p>
              <p className="line-clamp-1 text-[11px] text-slate-500">Giữ chỗ 15 phút</p>
            </div>
          </div>
        </div>

        {/* Khối trung tâm: Lớp học trực tuyến 1:1 kết nối Học viên & Gia sư */}
        <div className="my-5 w-full max-w-[440px] rounded-3xl border border-blue-200 bg-white/95 p-5 shadow-[0_24px_50px_-15px_rgba(37,99,235,0.2)] backdrop-blur-md">
          {/* Header phiên học */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wide text-slate-700">Lớp học trực tuyến 1:1</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              <Icon name="videocam" size="xs" />
              Tương tác trực tiếp
            </span>
          </div>

          {/* Thân phiên học: Học viên kết nối Gia sư */}
          <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Học viên */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-500/20">
                MA
              </div>
              <p className="mt-2 text-[13px] font-bold text-slate-900">Học viên</p>
              <span className="text-[11px] text-slate-500">Minh Anh</span>
            </div>

            {/* Cầu nối trung tâm */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                <Icon name="arrow_forward" size="xs" />
              </div>
              <span className="mt-1 text-[10px] font-bold text-blue-600">Buổi 01/10</span>
            </div>

            {/* Gia sư */}
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white shadow-md shadow-emerald-500/20">
                ĐN
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Icon name="verified" size="xs" />
                </span>
              </div>
              <p className="mt-2 text-[13px] font-bold text-slate-900">Gia sư</p>
              <span className="text-[11px] text-slate-500">Thầy Đức Nam</span>
            </div>
          </div>

          {/* Thanh tiến độ & bảo chứng */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">Tiến độ buổi học</span>
              <span className="font-bold text-blue-600">Hoàn thành 100%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Icon name="shield" size="xs" className="text-emerald-600" />
                Học phí được giữ an toàn
              </span>
              <span className="font-medium">Dời lịch trước 2h</span>
            </div>
          </div>
        </div>

        {/* Hàng dưới: Bước 3 (Xếp lịch) & Bước 4 (Giải ngân) */}
        <div className="flex w-full items-center justify-between gap-4 px-2 sm:px-4">
          {/* Card Bước 3 */}
          <div
            className="animate-float flex max-w-[220px] items-center gap-3 rounded-2xl border border-blue-200/90 bg-white/95 p-3.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-transform"
            style={{ animationDelay: '1.4s' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Icon name="calendar_month" size="md" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-600">Bước 3</span>
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">Xếp lịch linh hoạt</p>
              <p className="line-clamp-1 text-[11px] text-slate-500">Dời lịch trước 2h</p>
            </div>
          </div>

          {/* Card Bước 4 */}
          <div
            className="animate-float flex max-w-[220px] items-center gap-3 rounded-2xl border border-blue-200/90 bg-white/95 p-3.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-transform"
            style={{ animationDelay: '2.1s' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm">
              <Icon name="verified" size="md" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-600">Bước 4</span>
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">12 giờ phản hồi</p>
              <p className="line-clamp-1 text-[11px] text-slate-500">Giải ngân minh bạch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
