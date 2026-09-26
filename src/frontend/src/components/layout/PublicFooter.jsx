import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { Check } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-brand-navy-950 text-neutral-300 mt-12">
      <div className="max-w-[1200px] mx-auto px-6 pt-12 sm:pt-14 pb-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-12">
          {/* Column 1: Brand & Trust Block */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex" aria-label="TutorHub — trang chủ">
              <Logo variant="horizontal" size={34} tone="light" showSubtitle={false} />
            </Link>

            <p className="text-[13.5px] text-neutral-400 leading-relaxed max-w-sm">
              Kết nối học viên với gia sư chất lượng.
              <br />
              Thanh toán an toàn, minh bạch xuyên suốt quá trình học.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[13px] text-success font-medium">
                <Check className="w-4 h-4 shrink-0 text-success" strokeWidth={2.5} />
                <span>Thanh toán được bảo vệ</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-success font-medium">
                <Check className="w-4 h-4 shrink-0 text-success" strokeWidth={2.5} />
                <span>Đối soát hai chiều</span>
              </div>
            </div>
          </div>

          {/* Column 2: Khám phá */}
          <div className="space-y-3">
            <span className="text-[13px] font-semibold text-neutral-50 uppercase tracking-wider block">
              Khám phá
            </span>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Tìm gia sư
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Dịch vụ học tập
                </Link>
              </li>
              <li>
                <Link to="/auth/register" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Trở thành gia sư
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ trợ */}
          <div className="space-y-3">
            <span className="text-[13px] font-semibold text-neutral-50 uppercase tracking-wider block">
              Hỗ trợ
            </span>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/how-it-works" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Cách hoạt động
                </Link>
              </li>
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Thanh toán & bảo chứng
                </Link>
              </li>
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Hoàn tiền
                </Link>
              </li>
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Tranh chấp
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: TutorHub */}
          <div className="space-y-3">
            <span className="text-[13px] font-semibold text-neutral-50 uppercase tracking-wider block">
              TutorHub
            </span>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <a href="mailto:support@tutorhub.vn" className="text-neutral-400 hover:text-white transition-colors leading-[2]">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-brand-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-neutral-400">
          <span>© 2026 TutorHub Platform. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white transition-colors">
              Điều khoản
            </Link>
            <span>·</span>
            <Link to="/" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <span>·</span>
            <a href="mailto:support@tutorhub.vn" className="hover:text-white transition-colors">
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
