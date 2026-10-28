import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BarChart3,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
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

export default function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const { registerWithCredentials } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // Truy vấn danh sách gia sư cho card minh họa
  const [tutorStats, setTutorStats] = useState({
    totalCount: 0,
    topTutors: [],
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    api
      .get('/tutors?pageSize=3', { signal: controller.signal })
      .then((res) => {
        const pagedData = res?.data ?? res;
        const items = Array.isArray(pagedData?.items) ? pagedData.items : [];
        const count = typeof pagedData?.totalCount === 'number' ? pagedData.totalCount : items.length;

        setTutorStats({
          totalCount: count,
          topTutors: items,
          loading: false,
        });
      })
      .catch((err) => {
        // Bỏ qua lỗi do hủy request khi component unmount
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.warn('Lỗi kết nối API gia sư cho trang đăng ký:', err);
        setTutorStats((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Xóa lỗi inline của trường khi người dùng nhập liệu lại
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Điều hướng bằng bàn phím cho Radio Group vai trò (WAI-ARIA Radio Group Pattern)
  const handleRoleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedRole((prev) => (prev === 'Student' ? 'Tutor' : 'Student'));
    }
  };

  // Chuẩn hóa và xác thực dữ liệu đầu vào
  const validateForm = () => {
    const errors = {};
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    const rawPhone = phoneNumber.trim().replace(/[\s\-.]/g, '');

    if (!normalizedName) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    }

    if (!normalizedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        errors.email = 'Địa chỉ email không hợp lệ (VD: example@gmail.com).';
      }
    }

    let normalizedPhone = '';
    if (rawPhone) {
      const vnPhoneRegex = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;
      if (!vnPhoneRegex.test(rawPhone)) {
        errors.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0912345678).';
      } else {
        if (rawPhone.startsWith('+84')) {
          normalizedPhone = '0' + rawPhone.slice(3);
        } else if (rawPhone.startsWith('84') && rawPhone.length === 11) {
          normalizedPhone = '0' + rawPhone.slice(2);
        } else {
          normalizedPhone = rawPhone;
        }
      }
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 8) {
      errors.password = 'Mật khẩu cần tối thiểu 8 ký tự.';
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
    }

    setFieldErrors(errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      normalizedName,
      normalizedEmail,
      normalizedPhone,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: ngăn gửi yêu cầu trùng lặp khi đang xử lý
    if (loading || socialLoading) return;

    const { isValid, errors, normalizedName, normalizedEmail, normalizedPhone } = validateForm();

    if (!isValid) {
      const firstErrorMessage = Object.values(errors)[0];
      if (firstErrorMessage) {
        toast.error(firstErrorMessage);
      }
      return;
    }

    try {
      setLoading(true);

      // Gửi dữ liệu đã được trim và chuẩn hóa đồng nhất
      await registerWithCredentials(
        normalizedEmail,
        password,
        normalizedName,
        normalizedPhone,
        selectedRole
      );

      toast.success(`Đăng ký thành công! Chào mừng ${normalizedName} gia nhập TutorHub.`);

      if (selectedRole === 'Tutor') {
        navigate('/tutor/application', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Đăng ký tài khoản thất bại:', err);

      let displayError = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin và thử lại.';
      const specificError = err?.errors?.[0] || err?.message;

      // 1. Ánh xạ lỗi từ Backend (FluentValidation hoặc Conflict 409) vào đúng ô input trên form
      const backendFieldErrors = {};
      const allErrors = Array.isArray(err?.errors) && err.errors.length > 0
        ? err.errors
        : (typeof specificError === 'string' ? [specificError] : []);

      if (err?.status === 409 || err?.kind === 'conflict') {
        displayError = 'Email này đã được đăng ký tài khoản. Vui lòng sử dụng email khác hoặc đăng nhập.';
        backendFieldErrors.email = 'Email này đã được đăng ký tài khoản.';
      }

      allErrors.forEach((errorMsg) => {
        if (typeof errorMsg !== 'string') return;
        const lower = errorMsg.toLowerCase();

        if (lower.includes('email') || lower.includes('already exists') || lower.includes('đã được') || lower.includes('duplicate')) {
          backendFieldErrors.email = (lower.includes('already exists') || lower.includes('đã được') || lower.includes('duplicate'))
            ? 'Email này đã được đăng ký tài khoản.'
            : errorMsg;
          if (lower.includes('already exists') || lower.includes('đã được') || lower.includes('duplicate')) {
            displayError = 'Email này đã được đăng ký tài khoản. Vui lòng sử dụng email khác hoặc đăng nhập.';
          }
        } else if (lower.includes('phone') || lower.includes('thoại')) {
          backendFieldErrors.phoneNumber = errorMsg;
        } else if (lower.includes('password') || lower.includes('mật khẩu')) {
          backendFieldErrors.password = errorMsg;
        } else if (lower.includes('fullname') || lower.includes('full name') || lower.includes('họ và tên') || lower.includes('name is required')) {
          backendFieldErrors.fullName = errorMsg;
        }
      });

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      // 2. Xác định thông báo thân thiện hiển thị trên Toast
      if (displayError === 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin và thử lại.' && typeof specificError === 'string') {
        if (
          !specificError.includes('Exception') &&
          !specificError.includes('at ') &&
          !specificError.includes('System.') &&
          specificError.length < 150
        ) {
          displayError = specificError;
        }
      }

      toast.error(displayError);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (_provider) => {
    if (loading || socialLoading) return;

    try {
      setSocialLoading(true);
      const { authorizeUrl } = await externalAuthService.startGoogleLogin();
      window.location.href = authorizeUrl;
    } catch (err) {
      console.error('Khởi tạo đăng ký qua Google thất bại:', err);
      const msg = err?.message || '';
      if (msg.includes('not configured') || msg.includes('client id')) {
        toast.error('Tính năng đăng ký qua Google chưa được cấu hình Client ID / Secret trong hệ thống.');
      } else {
        toast.error('Không thể khởi tạo đăng nhập Google vào lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg selection:bg-brand-primary-100 selection:text-brand-primary-800">
      {/* Focused Auth Header */}
      <AuthHeader mode="register" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 sm:px-10 pt-4 sm:pt-6 pb-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-12 items-center">
          {/* Left Column: Marketing Message, Pillars & Illustration */}
          <section className="flex flex-col justify-center">
            {/* Tag Pill */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary-50 text-brand-primary-700 text-[11px] sm:text-[11.5px] font-semibold mb-3.5 border border-brand-primary-100/60 w-fit">
              Học tốt hơn mỗi ngày
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[42px] font-bold text-fg leading-[1.14] tracking-[-1px]">
              Bắt đầu hành trình <br />
              <span className="text-brand-primary-600">học tập tốt hơn</span>
            </h1>

            {/* Description */}
            <p className="mt-3 text-[14px] sm:text-[14.5px] text-neutral-500 max-w-lg leading-relaxed">
              Tạo tài khoản TutorHub để kết nối với những gia sư chất lượng, khám phá khoá học phù hợp và chạm tới mục tiêu của bạn.
            </p>

            {/* 3 Pillars Row */}
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

            {/* Illustration with Dynamic Live Floating Badges */}
            <div className="relative mt-4 max-w-[520px] w-full select-none">
              <img
                src="/images/transparent-student-clean.png"
                alt="TutorHub Student Illustration"
                className="w-full h-auto object-contain select-none pointer-events-none"
                loading="eager"
              />

              {/* Floating Badge 1: Top Right - Thông điệp giá trị trung thực */}
              <div
                className="absolute top-4 sm:top-5 right-2 sm:right-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] shadow-brand-md border border-white/80 max-w-[145px] sm:max-w-[160px] text-left z-20 animate-float"
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
                  Học tập hiệu quả
                </p>
                <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500 leading-snug mt-0.5">
                  Kết nối gia sư phù hợp với mục tiêu của bạn
                </p>
              </div>

              {/* Floating Badge 2: Bottom Left - Dynamic PostgreSQL Query */}
              <Link
                to="/"
                className="absolute bottom-4 sm:bottom-6 left-2 sm:left-3 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl shadow-brand-md border border-white/80 flex items-center gap-2 sm:gap-3 z-20 group hover:shadow-brand-lg transition-all animate-float cursor-pointer"
                style={{ animationDuration: '4.5s', animationDelay: '0.8s' }}
                title="Khám phá danh sách gia sư chất lượng"
              >
                {tutorStats.loading ? (
                  <>
                    <div className="flex -space-x-2 overflow-hidden py-0.5 pl-0.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-200 animate-pulse ring-2 ring-white shrink-0" />
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-200 animate-pulse ring-2 ring-white shrink-0" />
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-200 animate-pulse ring-2 ring-white shrink-0" />
                    </div>
                    <div className="leading-tight text-left pr-0.5 space-y-1">
                      <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
                      <div className="h-2.5 w-32 bg-neutral-100 rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
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
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary-100 text-brand-primary-600 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="leading-tight text-left pr-0.5">
                      <p className="text-[12px] sm:text-[13px] font-bold text-fg group-hover:text-brand-primary-600 transition-colors">
                        {tutorStats.totalCount > 0
                          ? `${tutorStats.totalCount}+ gia sư chất lượng`
                          : 'Đội ngũ gia sư chất lượng'}
                      </p>
                      <p className="text-[10px] sm:text-[10.5px] text-neutral-500 mt-0.5">Sẵn sàng đồng hành cùng bạn</p>
                    </div>
                  </>
                )}

                <span className="w-5 h-5 rounded-full bg-neutral-100 text-fg-muted flex items-center justify-center group-hover:bg-brand-primary-50 group-hover:text-brand-primary-600 transition-colors shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </section>

          {/* Right Column: Register Card */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] bg-white rounded-brand-xl p-7 sm:px-[34px] sm:py-[32px] border border-neutral-100 shadow-brand-lg">
              {/* Card Header */}
              <div className="text-left">
                <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                  Tạo tài khoản TutorHub
                </h2>
                <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                  Tham gia cộng đồng TutorHub ngay hôm nay!
                </p>
              </div>

              {/* Role Selector: 2 Cards with WAI-ARIA keyboard navigation */}
              <div className="mt-4 text-left">
                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Chọn loại tài khoản"
                >
                  {/* Option 1: Tôi là học viên */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === 'Student'}
                    tabIndex={selectedRole === 'Student' ? 0 : -1}
                    onClick={() => setSelectedRole('Student')}
                    onKeyDown={handleRoleKeyDown}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600',
                      selectedRole === 'Student'
                        ? 'border-2 border-brand-primary-600 bg-brand-primary-50'
                        : 'border-border bg-white hover:border-neutral-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                      <GraduationCap
                        className={cn(
                          'w-5 h-5 transition-colors',
                          selectedRole === 'Student' ? 'text-brand-primary-600' : 'text-neutral-500'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1 leading-snug">
                      <span
                        className={cn(
                          'font-bold text-[13px] block',
                          selectedRole === 'Student' ? 'text-brand-primary-600' : 'text-fg'
                        )}
                      >
                        Tôi là học viên
                      </span>
                      <span className="text-[10.5px] text-neutral-500 block mt-0.5">
                        Tìm gia sư, mua khoá học
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Tôi là gia sư */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === 'Tutor'}
                    tabIndex={selectedRole === 'Tutor' ? 0 : -1}
                    onClick={() => setSelectedRole('Tutor')}
                    onKeyDown={handleRoleKeyDown}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600',
                      selectedRole === 'Tutor'
                        ? 'border-2 border-brand-primary-600 bg-brand-primary-50'
                        : 'border-border bg-white hover:border-neutral-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                      <User
                        className={cn(
                          'w-5 h-5 transition-colors',
                          selectedRole === 'Tutor' ? 'text-brand-primary-600' : 'text-neutral-500'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1 leading-snug">
                      <span
                        className={cn(
                          'font-bold text-[13px] block',
                          selectedRole === 'Tutor' ? 'text-brand-primary-600' : 'text-fg'
                        )}
                      >
                        Tôi là gia sư
                      </span>
                      <span className="text-[10.5px] text-neutral-500 block mt-0.5">
                        Cung cấp dịch vụ giảng dạy
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Registration Form */}
              <form noValidate onSubmit={handleSubmit} className="mt-3.5 text-left space-y-2.5">
                {/* 1. Họ và tên */}
                <div>
                  <label htmlFor="reg-fullname" className="block text-[13px] font-bold text-fg mb-1">
                    Họ và tên <span className="text-error" aria-hidden="true">*</span>
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center h-12 bg-white border rounded-brand-md px-3.5 transition-all',
                      fieldErrors.fullName
                        ? 'border-error ring-1 ring-error/20 focus-within:border-error focus-within:ring-error/20'
                        : 'border-border focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10'
                    )}
                  >
                    <User className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      autoComplete="name"
                      aria-label="Họ và tên"
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? 'fullname-error' : undefined}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      placeholder="Nhập họ và tên của bạn"
                      className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p id="fullname-error" className="mt-1 text-[11.5px] text-error font-medium flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* 2. Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[13px] font-bold text-fg mb-1">
                    Email <span className="text-error" aria-hidden="true">*</span>
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center h-12 bg-white border rounded-brand-md px-3.5 transition-all',
                      fieldErrors.email
                        ? 'border-error ring-1 ring-error/20 focus-within:border-error focus-within:ring-error/20'
                        : 'border-border focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10'
                    )}
                  >
                    <Mail className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      aria-label="Địa chỉ email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder="Nhập email của bạn"
                      className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1 text-[11.5px] text-error font-medium flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* 3. Số điện thoại */}
                <div>
                  <label htmlFor="reg-phone" className="block text-[13px] font-bold text-fg mb-1">
                    Số điện thoại
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center h-12 bg-white border rounded-brand-md px-3.5 transition-all',
                      fieldErrors.phoneNumber
                        ? 'border-error ring-1 ring-error/20 focus-within:border-error focus-within:ring-error/20'
                        : 'border-border focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10'
                    )}
                  >
                    <Phone className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      aria-label="Số điện thoại"
                      aria-invalid={Boolean(fieldErrors.phoneNumber)}
                      aria-describedby={fieldErrors.phoneNumber ? 'phone-error' : undefined}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        clearFieldError('phoneNumber');
                      }}
                      placeholder="VD: 0912345678 (không bắt buộc)"
                      className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                    />
                  </div>
                  {fieldErrors.phoneNumber && (
                    <p id="phone-error" className="mt-1 text-[11.5px] text-error font-medium flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.phoneNumber}</span>
                    </p>
                  )}
                </div>

                {/* 4. Mật khẩu */}
                <div>
                  <label htmlFor="reg-password" className="block text-[13px] font-bold text-fg mb-1">
                    Mật khẩu <span className="text-error" aria-hidden="true">*</span>
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center h-12 bg-white border rounded-brand-md px-3.5 transition-all',
                      fieldErrors.password
                        ? 'border-error ring-1 ring-error/20 focus-within:border-error focus-within:ring-error/20'
                        : 'border-border focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10'
                    )}
                  >
                    <Lock className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      aria-label="Mật khẩu"
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
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
                  {fieldErrors.password && (
                    <p id="password-error" className="mt-1 text-[11.5px] text-error font-medium flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* 5. Checkbox Điều khoản: mặc định false, tự xuống dòng tự nhiên không bị cắt cụt */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-[12px] text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      aria-label="Đồng ý với điều khoản sử dụng và chính sách bảo mật"
                      aria-invalid={Boolean(fieldErrors.agreeTerms)}
                      aria-describedby={fieldErrors.agreeTerms ? 'terms-error' : undefined}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        clearFieldError('agreeTerms');
                      }}
                      className="w-4 h-4 mt-0.5 rounded text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer shrink-0"
                    />
                    <span className="leading-relaxed">
                      Tôi đồng ý với{' '}
                      <Link to="/terms" className="text-brand-primary-600 font-medium hover:underline">
                        Điều khoản sử dụng
                      </Link>{' '}
                      và{' '}
                      <Link to="/privacy" className="text-brand-primary-600 font-medium hover:underline">
                        Chính sách bảo mật
                      </Link>{' '}
                      của TutorHub.
                    </span>
                  </label>
                  {fieldErrors.agreeTerms && (
                    <p id="terms-error" className="mt-1.5 text-[11.5px] text-error font-medium flex items-center gap-1 pl-6" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.agreeTerms}</span>
                    </p>
                  )}
                </div>

                {/* 6. Primary CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || socialLoading}
                    className="w-full h-12 rounded-brand-md bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 disabled:opacity-60 text-white font-semibold text-[15px] shadow-brand-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Tạo tài khoản</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 7. Social Login (Google) */}
              <div className="relative flex items-center justify-center mt-3.5">
                <div className="border-t border-border w-full" />
                <span className="absolute bg-white px-2.5 text-[11.5px] text-fg-muted">
                  Hoặc đăng ký bằng
                </span>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleSocialRegister('Google')}
                  disabled={loading || socialLoading}
                  className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-brand-md border border-border bg-white hover:bg-neutral-50 transition-colors text-[13px] font-medium text-neutral-700 cursor-pointer shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  {socialLoading ? (
                    <span className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleSvg />
                      <span>Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Login Link */}
              <p className="text-[13px] text-fg-secondary text-center mt-3.5">
                Đã có tài khoản?{' '}
                <Link to="/auth/login" className="text-brand-primary-600 font-bold hover:underline ml-1">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
