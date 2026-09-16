import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginWithCredentials(email, password);
      const loggedUser = res.user;
      if (loggedUser.role === 'Admin') navigate('/admin/dashboard');
      else if (loggedUser.role === 'Tutor') navigate('/tutor/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border-light p-8 sm:p-10 shadow-xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo-50 flex items-center justify-center border border-brand-indigo-100 shadow-xs">
              <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <span className="text-2xl font-extrabold text-brand-indigo-600 tracking-tight">
              Tutor<span className="text-brand-navy-900">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-text-muted">
            Học tập & quản trị bảo chứng an toàn với cơ chế Dual-Escrow
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-bold text-slate-700 block">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                mail
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 focus:border-brand-indigo-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => message.info('Vui lòng liên hệ ban hỗ trợ TutorHub để được hướng dẫn đặt lại mật khẩu.')}
                className="text-[11px] font-semibold text-brand-indigo-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                lock
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 focus:border-brand-indigo-500 outline-hidden transition-all"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-indigo-600 focus:ring-brand-indigo-500 border-border-light"
              />
              <span className="text-xs text-slate-600">Ghi nhớ phiên đăng nhập (30 ngày)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng Nhập Ngay</span>
                <span className="material-symbols-outlined text-base">login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-border-light text-center space-y-2">
          <p className="text-xs text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" className="font-bold text-brand-indigo-600 hover:underline">
              Đăng ký học viên
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Bạn là gia sư?{' '}
            <Link to="/auth/register" className="font-bold text-financial-available hover:underline">
              Đăng ký gia sư bảo chứng
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
