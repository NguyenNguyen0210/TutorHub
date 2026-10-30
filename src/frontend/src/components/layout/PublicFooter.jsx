import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const footerLinkClass =
  'inline-flex min-h-10 items-center text-sm leading-5 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const footerHeadingClass =
  'mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-white';

export default function PublicFooter() {
  return (
    <footer className="relative mt-12 bg-brand-navy-950 text-slate-400 sm:mt-14">
      <div className="relative z-10 mx-auto -mt-6 max-w-[1280px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-7 shadow-2xl shadow-blue-950/40 sm:px-9 sm:py-8 lg:px-10">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                Học đúng người, tiến bộ đúng hướng
              </span>
              <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[34px]">
                Sẵn sàng tìm gia sư phù hợp?
              </h2>
              <p className="mt-2 max-w-xl text-base leading-7 text-blue-50/90 sm:text-[17px]">
                Khám phá hồ sơ đã xác minh hoặc bắt đầu hành trình giảng dạy cùng TutorHub.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 motion-reduce:transform-none motion-reduce:transition-none"
              >
                Tìm gia sư
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/become-tutor"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-blue-950/25 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Trở thành gia sư
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pb-5 pt-10 sm:px-8 sm:pt-12">
        <div className="grid grid-cols-2 gap-x-7 gap-y-8 border-b border-slate-800/80 pb-9 md:grid-cols-4 lg:grid-cols-12 lg:gap-7">
          <div className="col-span-2 md:col-span-4 lg:col-span-3 lg:pr-4">
            <Link to="/" className="inline-flex" aria-label="TutorHub — trang chủ">
              <Logo variant="horizontal" size={34} tone="light" showSubtitle={false} />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Kết nối học viên với gia sư chất lượng trong một hành trình học tập minh bạch và an toàn.
            </p>
          </div>

          <nav className="lg:col-span-2" aria-labelledby="footer-discover">
            <h3 id="footer-discover" className={footerHeadingClass}>Khám phá</h3>
            <ul className="space-y-1">
              <li><Link to="/" className={footerLinkClass}>Tìm gia sư</Link></li>
              <li><Link to="/services" className={footerLinkClass}>Dịch vụ học tập</Link></li>
              <li><Link to="/become-tutor" className={footerLinkClass}>Trở thành gia sư</Link></li>
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-labelledby="footer-support">
            <h3 id="footer-support" className={footerHeadingClass}>Hỗ trợ</h3>
            <ul className="space-y-1">
              <li><Link to="/how-it-works" className={footerLinkClass}>Cách hoạt động</Link></li>
              <li><Link to="/how-it-works" className={footerLinkClass}>Hỗ trợ học viên</Link></li>
              <li><Link to="/how-it-works" className={footerLinkClass}>Hoàn tiền &amp; tranh chấp</Link></li>
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-labelledby="footer-about">
            <h3 id="footer-about" className={footerHeadingClass}>Về TutorHub</h3>
            <ul className="space-y-1">
              <li><Link to="/how-it-works" className={footerLinkClass}>Về chúng tôi</Link></li>
              <li><Link to="/become-tutor" className={footerLinkClass}>Cộng đồng gia sư</Link></li>
              <li><Link to="/services" className={footerLinkClass}>Dịch vụ nổi bật</Link></li>
            </ul>
          </nav>

          <section className="col-span-2 md:col-span-1 lg:col-span-3" aria-labelledby="footer-contact">
            <h3 id="footer-contact" className={footerHeadingClass}>Liên hệ</h3>
            <a
              href="mailto:support@tutorhub.vn"
              className="inline-flex min-h-10 max-w-full items-center gap-2 text-sm text-slate-300 transition-colors hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Mail className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
              <span className="break-all">support@tutorhub.vn</span>
            </a>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                Bảo chứng TutorHub
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                VNPay và ví học viên được bảo vệ xuyên suốt giao dịch.
              </p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                <span className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Thanh toán bảo vệ
                </span>
                <span className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Đối soát hai chiều
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TutorHub. Bảo lưu mọi quyền.</p>
          <nav aria-label="Thông tin pháp lý">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <li>
                <Link to="/terms" className="transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
