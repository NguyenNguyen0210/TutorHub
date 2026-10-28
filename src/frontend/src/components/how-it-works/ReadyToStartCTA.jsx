import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

export default function ReadyToStartCTA() {
  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-brand-xl bg-brand-primary-50/80 border border-brand-primary-100/90 p-6 sm:p-8 lg:p-10">
          {/* Subtle loop / doodle background decoration */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 hidden md:block"
            aria-hidden="true"
          >
            <svg
              width="160"
              height="80"
              viewBox="0 0 160 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-brand-primary-300 stroke-current"
            >
              <path
                d="M10 50 C 40 70, 70 20, 80 40 C 90 60, 110 70, 130 35 C 140 20, 150 25, 155 30"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="155" cy="30" r="3" fill="currentColor" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Content */}
            <div className="max-w-xl">
              <h2 className="text-[22px] sm:text-[28px] font-bold text-fg leading-tight">
                Sẵn sàng bắt đầu hành trình học tập?
              </h2>
              <p className="text-[13.5px] sm:text-[14.5px] text-fg-secondary mt-2 leading-relaxed">
                Khám phá hồ sơ gia sư và chọn gói học có lộ trình, thời lượng và học phí rõ ràng.
              </p>
            </div>

            {/* Right Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 bg-brand-primary-600 hover:bg-brand-primary-700 text-white font-semibold px-5 sm:px-6 py-2.5 rounded-brand-md shadow-brand-sm transition-all text-[13.5px] sm:text-[14px]"
              >
                <span>Tìm gia sư ngay</span>
                <Icon name="arrow_forward" size="xs" />
              </Link>

              <Link
                to="/tutor/application"
                className="inline-flex min-h-11 items-center gap-2 bg-white hover:bg-neutral-50 text-fg hover:text-fg border border-border/90 font-semibold px-5 sm:px-6 py-2.5 rounded-brand-md transition-all text-[13.5px] sm:text-[14px]"
              >
                <span>Trở thành gia sư</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
