import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';

export default function AuthHeader({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <header className="w-full max-w-[1360px] h-16 mx-auto px-6 sm:px-10 flex items-center justify-between">
      {/* Left: Brand Logo + Subtle Marketplace Exit Link */}
      <div className="flex items-center">
        <Link to="/" className="inline-flex items-center group" aria-label="TutorHub — trang chủ">
          <Logo variant="horizontal" size={34} showSubtitle={false} />
        </Link>

        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#2563EB] transition-colors ml-6 pl-6 border-l border-slate-200"
        >
          <Icon name="arrow_back" size="xs" />
          <span>Khám phá gia sư</span>
        </Link>
      </div>

      {/* Right: Auth Flow Switch Action */}
      <div className="text-[13px] sm:text-[13.5px] text-slate-600 font-medium">
        {isLogin ? (
          <>
            <span className="hidden xs:inline">Chưa có tài khoản?</span>{' '}
            <Link
              to="/auth/register"
              className="text-[#2563EB] font-semibold hover:underline transition-colors ml-1"
            >
              Đăng ký ngay
            </Link>
          </>
        ) : (
          <>
            <span className="hidden xs:inline">Đã có tài khoản?</span>{' '}
            <Link
              to="/auth/login"
              className="text-[#2563EB] font-semibold hover:underline transition-colors ml-1"
            >
              Đăng nhập ngay
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
