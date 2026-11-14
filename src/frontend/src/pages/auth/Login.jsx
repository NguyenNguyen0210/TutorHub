import React, { useRef, useState } from 'react';
import PendingLabel from '@/components/ui/PendingLabel';
import { userFacingError } from '@/utils/userFacingError';
import { useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { getAuthReturnUrl } from '@/utils/authRedirect';
import { externalAuthService } from '@/services/externalAuth.service';
import AuthHeader from '@/components/layout/AuthHeader';

function GoogleSvg() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}


export default function Login() {
  const location = useLocation();
  const authLinkState = { returnUrl: getAuthReturnUrl(location) };
  const toast = useToast();
  const { loginWithCredentials } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || loading || socialLoading) return;
    if (!email || !email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu.');
      return;
    }

    submitting.current = true;
    setSubmitError('');
    try {
      setLoading(true);
      const res = await loginWithCredentials(email, password, rememberMe);
      const user = res.user;

      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName || user.email}.`);

      // GuestGuard owns the redirect after authentication, avoiding competing navigations.
    } catch (err) {
      const displayError = userFacingError(err, 'Chưa đăng nhập được. Vui lòng thử lại.');
      setSubmitError(displayError);
      toast.error(displayError);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    try {
      setSocialLoading(true);
      const { authorizeUrl } = await externalAuthService.startGoogleLogin(authLinkState.returnUrl);
      window.location.href = authorizeUrl;
    } catch {
      toast.error('Đăng nhập bằng Google tạm thời chưa khả dụng. Vui lòng đăng nhập bằng email và mật khẩu.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg selection:bg-brand-primary-100 selection:text-brand-primary-800">
      {/* Minimal Focused Auth Header */}
      <AuthHeader mode="login" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 sm:px-10 pt-4 sm:pt-6 pb-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-12 items-center">
          {/* Left Column: Marketing Message, Pillars & Seamless Illustration */}
          <section className="flex flex-col justify-center">
            {/* 1. Tag Pill */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary-50 text-brand-primary-700 text-[11px] sm:text-[11.5px] font-semibold mb-3.5 border border-brand-primary-100/60 w-fit">
              Học tốt hơn mỗi ngày
            </div>

            {/* 2. Headline */}
            <h1 className="text-[36px] sm:text-[42px] font-bold text-fg leading-[1.14] tracking-[-1px]">
              Kết nối tri thức, <br />
              <span className="text-brand-primary-600">mở lối tương lai</span>
            </h1>

            {/* 3. Description */}
            <p className="mt-3 text-[14px] sm:text-[14.5px] text-neutral-500 max-w-lg leading-relaxed">
              TutorHub là nền tảng kết nối học viên với những gia sư chất lượng, giúp việc học hiệu quả hơn, dễ dàng hơn và an toàn hơn.
            </p>

            {/* 4. 3D Seamless Illustration without borders */}
            <div className="relative mt-5 max-w-[560px] w-full select-none">
              <img
                src="/images/auth-classroom-workspace.png"
                alt="Không gian học trực tuyến 1 kèm 1 TutorHub"
                className="w-full h-auto object-contain select-none pointer-events-none mix-blend-multiply"
                loading="eager"
              />
            </div>
          </section>

          {/* Right Column: Login Card */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] bg-white rounded-brand-xl p-7 sm:px-[34px] sm:py-[32px] border border-neutral-100 shadow-brand-lg">
              {/* Card Header */}
              <div className="text-left">
                <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                  Đăng nhập vào TutorHub
                </h2>
                <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                  Chào mừng bạn trở lại! Hãy đăng nhập để tiếp tục hành trình học tập.
                </p>
              </div>

              {/* Login Form */}
              <form noValidate onSubmit={handleSubmit} className="mt-5 text-left space-y-3">
                {/* 1. Email */}
                <div>
                  <label htmlFor="login-email" className="block text-[13px] font-bold text-fg mb-1">
                    Email
                  </label>
                  <div className="relative flex items-center h-12 bg-white border border-border rounded-brand-md px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                    <Mail className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      inputMode="email"
                      required
                      autoComplete="username"
                      aria-label="Địa chỉ email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email của bạn"
                      className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 2. Mật khẩu */}
                <div>
                  <label htmlFor="login-password" className="block text-[13px] font-bold text-fg mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative flex items-center h-12 bg-white border border-border rounded-brand-md px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                    <Lock className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      aria-label="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full h-full pr-8 text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 inline-flex h-10 w-10 items-center justify-center text-fg-muted hover:text-neutral-700 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Remember session & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[12.5px] text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      aria-label="Ghi nhớ đăng nhập"
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer shrink-0"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <Link
                    to="/auth/forgot-password"
                    className="text-[12.5px] font-semibold text-brand-primary-600 hover:text-brand-primary-700 hover:underline transition-colors select-none"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* 4. Primary CTA Button */}
                {submitError && <p role="alert" className="rounded-xl border border-danger/30 bg-danger-subtle p-3 text-sm text-danger-strong">{submitError}</p>}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading || undefined}
                    className="w-full h-12 rounded-brand-md bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 disabled:opacity-60 text-white font-semibold text-[15px] shadow-brand-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
                  >
                    {loading ? (
                      <><span aria-hidden="true" className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><PendingLabel label="Đang đăng nhập…" /></>
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 5. Social Login (Google only) */}
              <div className="relative flex items-center justify-center mt-4">
                <div className="border-t border-border w-full" />
                <span className="absolute bg-white px-2.5 text-[11.5px] text-fg-muted">
                  Hoặc đăng nhập bằng
                </span>
              </div>

              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={handleSocialLogin}
                  disabled={socialLoading}
                  className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-brand-md border border-border bg-white hover:bg-neutral-50 transition-colors text-[13px] font-medium text-neutral-700 cursor-pointer shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <GoogleSvg />
                  <span>Google</span>
                </button>
              </div>

              {/* 7. Bottom Register Link */}
              <p className="text-[13px] text-fg-secondary text-center mt-4">
                Chưa có tài khoản?{' '}
                <Link to="/auth/register" state={authLinkState} className="text-brand-primary-600 font-bold hover:underline ml-1">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
