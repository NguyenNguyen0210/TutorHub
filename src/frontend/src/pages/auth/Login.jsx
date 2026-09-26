import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/services/api';
import tutorService from '@/services/tutor.service';
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

function FacebookSvg() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="currentColor"
        className="text-white"
        d="M15.12 12.75l.48-3.15h-3.03V7.55c0-.86.42-1.7 1.77-1.7h1.37V3.17s-1.24-.21-2.43-.21c-2.48 0-4.09 1.5-4.09 4.22v2.42H6.43v3.15h2.79V20.8c.56.09 1.13.13 1.71.13.58 0 1.15-.04 1.71-.13v-8.05h2.48z"
      />
    </svg>
  );
}

function AppleSvg() {
  return (
    <svg className="w-4 h-4 shrink-0 text-fg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.77 1.42-.58.68-1.1 1.76-.96 2.81 1.06.08 2.11-.57 2.72-1.36z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { loginWithCredentials } = useAuthStore();

  // Không pre-fill tài khoản demo. Bản cũ đặt sẵn
  // `student.tuan@tutorhub.com` / `Test@123` và bật `rememberMe` — nghĩa là ai
  // mở /auth/login cũng đăng nhập được vào tài khoản có sẵn bằng một cú click,
  // và không ai từng chạy qua nhánh validate trường rỗng. Muốn thử thì gõ tay;
  // tài khoản seed vẫn nằm trong `src/backend/seedData.sql`.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Truy vấn dữ liệu gia sư thật từ Database (PostgreSQL)
  const [tutorStats, setTutorStats] = useState({
    totalCount: 55,
    topTutors: [],
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    api
      .get('/tutors?pageSize=3')
      .then((res) => {
        if (!isMounted) return;
        const items = res?.items || res?.data?.items || [];
        const count = res?.totalCount ?? res?.data?.totalCount ?? 55;
        setTutorStats({
          totalCount: count,
          topTutors: items,
          loading: false,
        });
      })
      .catch((err) => {
        console.warn('Lỗi kết nối API gia sư cho trang đăng nhập:', err);
        if (isMounted) {
          setTutorStats((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      const user = res.user;

      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName || user.email}.`);

      const redirectPath = location.state?.from?.pathname;
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }

      if (user.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'Tutor') {
        try {
          const app = await tutorService.getMyTutorApplication();
          if (!app) {
            navigate('/tutor/application', { replace: true });
            return;
          }
        } catch {
          // fallback to dashboard if API fails
        }
        navigate('/tutor/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`Đăng nhập với ${provider} sẽ sớm có mặt.`);
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
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary-50 text-brand-primary-600 text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider mb-3.5 border border-brand-primary-100/60 w-fit">
              HỌC TỐT HƠN MỖI NGÀY
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

            {/* 4. 3 Benefits Row */}
            <div className="mt-5 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6">
              {/* Benefit 1 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-info-subtle text-info flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-fg">Gia sư chất lượng</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Được xác thực kỹ càng</p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-success-subtle text-success-strong flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-fg">Thanh toán an toàn</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Bảo chứng qua Escrow</p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-fg">Học tập hiệu quả</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Đúng người, đúng mục tiêu</p>
                </div>
              </div>
            </div>

            {/* 5. Illustration with DYNAMIC Live Floating Badges (100% borderless) */}
            <div className="relative mt-4 max-w-[520px] w-full select-none">
              {/* Clean Transparent Illustration without any rectangular borders */}
              <img
                src="/images/transparent-student-clean.png"
                alt="TutorHub Student Illustration"
                className="w-full h-auto object-contain select-none pointer-events-none"
                loading="eager"
              />

              {/* Floating Badge 1: Top Right - Hơn 10.000+ học viên */}
              <div
                className="absolute top-4 sm:top-5 right-2 sm:right-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] shadow-brand-md border border-white/80 max-w-[140px] sm:max-w-[155px] text-left z-20 animate-float"
                style={{ animationDuration: '5s' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                    ↗
                  </div>
                </div>
                <p className="text-[12px] sm:text-[13px] font-bold text-fg leading-tight mt-1">
                  Hơn 10.000+
                </p>
                <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500 leading-snug mt-0.5">
                  học viên đã tìm được gia sư phù hợp
                </p>
              </div>

              {/* Floating Badge 2: Bottom Left - Dynamic PostgreSQL Query (55+ Gia sư chất lượng & Avatars) */}
              <Link
                to="/"
                className="absolute bottom-4 sm:bottom-6 left-2 sm:left-3 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl shadow-brand-md border border-white/80 flex items-center gap-2 sm:gap-3 z-20 group hover:shadow-brand-lg transition-all animate-float cursor-pointer"
                style={{ animationDuration: '4.5s', animationDelay: '0.8s' }}
                title="Khám phá danh sách gia sư chất lượng"
              >
                {/* Real Database Tutor Avatars */}
                <div className="flex -space-x-2 overflow-hidden py-0.5 pl-0.5">
                  {tutorStats.topTutors.length > 0 ? (
                    tutorStats.topTutors.slice(0, 3).map((tutor, idx) => (
                      <Avatar
              key={tutor.id || idx}
              src={tutor.avatarUrl}
              name={tutor.fullName}
              size="sm"
              title={tutor.fullName}
              className="inline-block h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-white shrink-0"
            />
                    ))
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary-100 text-brand-primary-600 font-bold text-xs flex items-center justify-center">
                      55+
                    </div>
                  )}
                </div>

                <div className="leading-tight text-left pr-0.5">
                  <p className="text-[12px] sm:text-[13px] font-bold text-fg group-hover:text-brand-primary-600 transition-colors">
                    {tutorStats.totalCount > 0 ? `${tutorStats.totalCount}+ gia sư chất lượng` : '55+ gia sư chất lượng'}
                  </p>
                  <p className="text-[10px] sm:text-[10.5px] text-neutral-500 mt-0.5">Sẵn sàng đồng hành cùng bạn</p>
                </div>

                <span className="w-5 h-5 rounded-full bg-neutral-100 text-fg-muted flex items-center justify-center group-hover:bg-brand-primary-50 group-hover:text-brand-primary-600 transition-colors shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </section>

          {/* Right Column: Login Card */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] bg-white rounded-[24px] p-7 sm:px-[34px] sm:py-[32px] border border-neutral-100 shadow-brand-lg">
              {/* Card Header */}
              <div className="text-left">
                <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                  Đăng nhập vào TutorHub
                </h2>
                <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                  Chào mừng bạn trở lại! Hãy đăng nhập để tiếp tục hành trình học tập.
                </p>
              </div>

              {/* Error Callout */}
              {errorMsg && (
                <div
                  role="alert"
                  className="mt-3 p-2.5 rounded-xl bg-danger-subtle border-danger/20 text-danger-strong text-[12px] flex items-center gap-2 animate-fadeIn"
                >
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-5 text-left space-y-3">
                {/* 1. Email hoặc số điện thoại */}
                <div>
                  <label htmlFor="login-email" className="block text-[13px] font-bold text-fg mb-1">
                    Email hoặc số điện thoại
                  </label>
                  <div className="relative flex items-center h-12 bg-white border border-border rounded-[12px] px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                    <Mail className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="login-email"
                      type="text"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email hoặc số điện thoại của bạn"
                      className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 2. Mật khẩu */}
                <div>
                  <label htmlFor="login-password" className="block text-[13px] font-bold text-fg mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative flex items-center h-12 bg-white border border-border rounded-[12px] px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                    <Lock className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full h-full pr-8 text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1 text-fg-muted hover:text-neutral-700 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Options: Ghi nhớ đăng nhập & Quên mật khẩu */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[12.5px] text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer shrink-0"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <Link
                    to="/"
                    className="text-[12.5px] font-medium text-brand-primary-600 hover:underline transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* 4. Primary CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-[12px] bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 disabled:opacity-60 text-white font-semibold text-[15px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 5. Social Divider */}
              <div className="relative flex items-center justify-center mt-4">
                <div className="border-t border-border w-full" />
                <span className="absolute bg-white px-2.5 text-[11.5px] text-fg-muted">
                  Hoặc đăng nhập bằng
                </span>
              </div>

              {/* 6. 3 Social Buttons */}
              <div className="grid grid-cols-3 gap-2.5 mt-3.5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-2 h-11 px-2 rounded-[10px] border border-border bg-white hover:bg-neutral-50 transition-colors text-[13px] font-medium text-neutral-700 cursor-pointer shadow-none"
                >
                  <GoogleSvg />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex items-center justify-center gap-2 h-11 px-2 rounded-[10px] border border-border bg-white hover:bg-neutral-50 transition-colors text-[13px] font-medium text-neutral-700 cursor-pointer shadow-none"
                >
                  <FacebookSvg />
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('Apple')}
                  className="flex items-center justify-center gap-2 h-11 px-2 rounded-[10px] border border-border bg-white hover:bg-neutral-50 transition-colors text-[13px] font-medium text-neutral-700 cursor-pointer shadow-none"
                >
                  <AppleSvg />
                  <span>Apple</span>
                </button>
              </div>

              {/* 7. Bottom Register Link */}
              <p className="text-[13px] text-fg-secondary text-center mt-4">
                Chưa có tài khoản?{' '}
                <Link to="/auth/register" className="text-brand-primary-600 font-bold hover:underline ml-1">
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
