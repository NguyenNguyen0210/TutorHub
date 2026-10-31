import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

export default function ReadyToStartCTA() {
  return (
    <section className="py-12 sm:py-16 bg-white" aria-label="Bắt đầu cùng TutorHub">
      <div className="page-shell">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/80 p-8 sm:p-10 lg:p-12 shadow-sm">
          {/* Vầng sáng nền mờ không đè lên chữ */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Nội dung bên trái */}
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[12px] font-bold text-blue-700">
                <Icon name="verified" size="xs" />
                Học tập an tâm cùng TutorHub
              </span>
              <h2 className="mt-3 text-[26px] sm:text-[34px] font-extrabold text-slate-900 leading-[1.2] tracking-[-0.02em]">
                Sẵn sàng bắt đầu hành trình học tập?
              </h2>
              <p className="mt-2.5 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
                Khám phá hồ sơ gia sư uy tín và lựa chọn các gói học với lộ trình, thời lượng và mức học phí rõ ràng từ đầu.
              </p>
            </div>

            {/* Cụm nút CTA bên phải */}
            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              <Link
                to="/"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-3 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] text-[14px]"
              >
                <span>Tìm gia sư ngay</span>
                <Icon name="arrow_forward" size="sm" />
              </Link>

              <Link
                to="/tutor/application"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200/90 font-bold px-6 py-3 shadow-sm transition-all active:scale-[0.98] text-[14px]"
              >
                <span>Trở thành gia sư</span>
                <Icon name="arrow_forward" size="sm" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
