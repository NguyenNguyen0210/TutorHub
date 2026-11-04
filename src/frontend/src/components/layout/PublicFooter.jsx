import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const footerLinkClass =
  'inline-flex min-h-10 items-center text-sm leading-5 text-slate-600 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50';

const footerHeadingClass =
  'mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-900';

export default function PublicFooter() {
  return (
    <footer className="relative mt-12 border-t border-slate-200/80 bg-gradient-to-b from-[#F0F7FF]/60 via-[#F8FAFC] to-[#F8FAFC] text-slate-600 sm:mt-16">
      <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid grid-cols-2 gap-x-7 gap-y-8 border-b border-slate-200/80 pb-9 md:grid-cols-4 lg:grid-cols-12 lg:gap-7">
          {/* Cột 1: Logo và mô tả thương hiệu */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4 lg:pr-6">
            <Link to="/" className="inline-flex" aria-label="TutorHub — trang chủ">
              <Logo variant="horizontal" size={34} tone="color" showSubtitle={false} />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Kết nối học viên với gia sư chất lượng trong một hành trình học tập minh bạch và an toàn.
            </p>
          </div>

          {/* Cột 2: Khám phá */}
          <nav className="col-span-1 md:col-span-1 lg:col-span-2" aria-labelledby="footer-discover">
            <h3 id="footer-discover" className={footerHeadingClass}>Khám phá</h3>
            <ul className="space-y-1">
              <li><Link to="/" className={footerLinkClass}>Tìm gia sư</Link></li>
              <li><Link to="/services" className={footerLinkClass}>Gói học</Link></li>
              <li><Link to="/become-tutor" className={footerLinkClass}>Trở thành gia sư</Link></li>
            </ul>
          </nav>

          {/* Cột 3: Hỗ trợ */}
          <nav className="col-span-1 md:col-span-1 lg:col-span-2" aria-labelledby="footer-support">
            <h3 id="footer-support" className={footerHeadingClass}>Hỗ trợ</h3>
            <ul className="space-y-1">
              <li><Link to="/how-it-works" className={footerLinkClass}>Cách hoạt động</Link></li>
              <li><Link to="/how-it-works" className={footerLinkClass}>Hỗ trợ học viên</Link></li>
              <li><Link to="/how-it-works" className={footerLinkClass}>Hoàn tiền &amp; tranh chấp</Link></li>
            </ul>
          </nav>

          {/* Cột 4: Về TutorHub */}
          <nav className="col-span-1 md:col-span-1 lg:col-span-2" aria-labelledby="footer-about">
            <h3 id="footer-about" className={footerHeadingClass}>Về TutorHub</h3>
            <ul className="space-y-1">
              <li><Link to="/how-it-works" className={footerLinkClass}>Về chúng tôi</Link></li>
              <li><Link to="/become-tutor" className={footerLinkClass}>Cộng đồng gia sư</Link></li>
              <li><Link to="/services" className={footerLinkClass}>Gói học nổi bật</Link></li>
            </ul>
          </nav>

          {/* Cột 5: Liên hệ */}
          <section className="col-span-1 md:col-span-1 lg:col-span-2" aria-labelledby="footer-contact">
            <h3 id="footer-contact" className={footerHeadingClass}>Liên hệ</h3>
            <a
              href="mailto:support@tutorhub.vn"
              className="inline-flex min-h-10 max-w-full items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Mail className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <span className="break-all font-medium">support@tutorhub.vn</span>
            </a>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Hỗ trợ học viên &amp; gia sư từ 8:00 đến 21:00 hàng ngày.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TutorHub. Bảo lưu mọi quyền.</p>
          <nav aria-label="Thông tin pháp lý">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <li>
                <Link to="/terms" className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
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
