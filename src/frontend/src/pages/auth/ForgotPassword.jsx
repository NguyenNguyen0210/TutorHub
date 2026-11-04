import { userFacingError } from '@/utils/userFacingError';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import AuthHeader from '@/components/layout/AuthHeader';
import forgotPasswordService from '@/services/forgotPassword.service';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  // Wizard state: 1 = Email, 2 = Verify OTP, 3 = Reset Password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend OTP countdown (60s)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for 6 OTP input boxes
  const otpInputRefs = useRef([]);

  // Countdown timer for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Password criteria verification
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  // STEP 1: Request Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    try {
      setLoading(true);
      await forgotPasswordService.requestResetOtp(cleanEmail);
      toast.success("Đã gửi mã xác nhận. Vui lòng kiểm tra email của bạn.");
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(userFacingError(err, 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    try {
      setLoading(true);
      await forgotPasswordService.requestResetOtp(email);
      toast.success("Mã xác nhận mới đã được gửi đến email của bạn.");
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(userFacingError(err, "Không thể gửi lại mã xác nhận. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  // OTP Inputs handling
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 0) {
      newOtp[index] = cleaned[cleaned.length - 1];
      setOtp(newOtp);

      // Auto focus next box
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const nextOtp = pastedData.slice(0, 6).split('');
      setOtp(nextOtp);
      otpInputRefs.current[5]?.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã xác nhận.");
      return;
    }

    try {
      setLoading(true);
      const token = await forgotPasswordService.verifyResetOtp(email, otpCode);
      setResetToken(token);
      toast.success("Đã xác nhận mã. Bạn có thể tạo mật khẩu mới.");
      setStep(3);
    } catch (err) {
      toast.error(userFacingError(err, "Mã xác nhận không đúng hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Vui lòng đảm bảo mật khẩu mới đáp ứng đầy đủ tất cả các tiêu chí bảo mật.');
      return;
    }

    try {
      setLoading(true);
      await forgotPasswordService.resetPassword(email, resetToken, newPassword);
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate('/auth/login', { replace: true });
    } catch (err) {
      toast.error(userFacingError(err, "Chưa đổi được mật khẩu. Vui lòng thử lại hoặc yêu cầu mã xác nhận mới."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg selection:bg-brand-primary-100 selection:text-brand-primary-800">
      {/* Minimal Focused Auth Header */}
      <AuthHeader mode="login" />

      {/* Main Content Area: Centered Card */}
      <main className="flex-1 w-full max-w-[500px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-12 flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-brand-xl p-7 sm:px-[34px] sm:py-[32px] border border-neutral-100 shadow-brand-lg">
          {/* Stepper Progress Indicator */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                {[
                  { num: 1, label: 'Email' },
                  { num: 2, label: "Mã xác nhận" },
                  { num: 3, label: 'Mật khẩu' },
                ].map((s, idx) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                          step === s.num
                            ? 'bg-brand-primary-600 text-white shadow-sm ring-2 ring-brand-primary-100'
                            : step > s.num
                            ? 'bg-success text-white'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span
                        className={`text-[12px] font-medium hidden sm:inline ${
                          step === s.num ? 'text-fg font-bold' : 'text-neutral-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`h-0.5 w-8 sm:w-12 mx-2 transition-colors ${
                          step > s.num ? 'bg-success' : 'bg-neutral-100'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ──────────────────────────────────────────────
                  BƯỚC 1: NHẬP EMAIL
                  ────────────────────────────────────────────── */}
              {step === 1 && (
                <div>
                  <div className="text-left">
                    <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                      Quên mật khẩu?
                    </h2>
                    <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                      Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi mã xác nhận gồm 6 chữ số để xác thực tài khoản.
                    </p>
                  </div>

                  <form noValidate onSubmit={handleRequestOtp} className="mt-5 text-left space-y-4">
                    <div>
                      <label htmlFor="reset-email" className="block text-[13px] font-bold text-fg mb-1">
                        Địa chỉ Email
                      </label>
                      <div className="relative flex items-center h-12 bg-white border border-border rounded-brand-md px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                        <Mail className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                        <input
                          id="reset-email"
                          type="email"
                          inputMode="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vidu@tutorhub.vn"
                          className="w-full h-full text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full h-11 bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 text-white rounded-brand-md font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-brand-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang gửi mã...</span>
                        </>
                      ) : (
                        <>
                          <span>Gửi mã xác nhận</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <Link
                        to="/auth/login"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:text-brand-primary-600 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Quay lại Đăng nhập</span>
                      </Link>
                    </div>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ
                  ────────────────────────────────────────────── */}
              {step === 2 && (
                <div>
                  <div className="text-left">
                    <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                      Nhập mã xác nhận
                    </h2>
                    <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                      Mã xác thực gồm 6 số đã được gửi đến: <br />
                      <span className="font-semibold text-fg">{email}</span>
                    </p>
                  </div>

                  <form noValidate onSubmit={handleVerifyOtp} className="mt-6 text-left space-y-5">
                    {/* 6 OTP Boxes */}
                    <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          aria-label={`Mã xác nhận số ${idx + 1}`}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-[22px] font-bold text-fg bg-neutral-50 border border-neutral-200 rounded-brand-md focus:bg-white focus:border-brand-primary-600 focus:ring-2 focus:ring-brand-primary-600/10 outline-none transition-all"
                        />
                      ))}
                    </div>

                    {/* Resend Countdown */}
                    <div className="flex items-center justify-between text-[12.5px] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setOtp(['', '', '', '', '', '']);
                        }}
                        className="text-neutral-500 hover:text-brand-primary-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Đổi email khác</span>
                      </button>

                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="font-bold text-brand-primary-600 hover:text-brand-primary-700 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Gửi lại mã xác nhận</span>
                        </button>
                      ) : (
                        <span className="text-neutral-400">
                          Gửi lại mã sau <strong className="text-fg font-semibold">{countdown}s</strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6}
                      className="w-full h-11 bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 text-white rounded-brand-md font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-brand-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xác thực...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận mã xác nhận</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  BƯỚC 3: ĐẶT MẬT KHẨU MỚI
                  ────────────────────────────────────────────── */}
              {step === 3 && (
                <div>
                  <div className="text-left">
                    <h2 className="text-[25px] sm:text-[27px] font-bold text-fg tracking-tight leading-tight">
                      Tạo mật khẩu mới
                    </h2>
                    <p className="mt-1 text-[13px] sm:text-[13.5px] text-neutral-500 leading-relaxed">
                      Thiết lập mật khẩu mạnh để bảo vệ thông tin cá nhân và số dư bảo chứng của bạn.
                    </p>
                  </div>

                  <form noValidate onSubmit={handleResetPassword} className="mt-5 text-left space-y-3.5">
                    {/* New Password */}
                    <div>
                      <label htmlFor="new-password" className="block text-[13px] font-bold text-fg mb-1">
                        Mật khẩu mới
                      </label>
                      <div className="relative flex items-center h-12 bg-white border border-border rounded-brand-md px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                        <Lock className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập ít nhất 8 ký tự"
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

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirm-password" className="block text-[13px] font-bold text-fg mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative flex items-center h-12 bg-white border border-border rounded-brand-md px-3.5 focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/10 transition-all">
                        <Lock className="w-4 h-4 text-fg-muted shrink-0 mr-2.5 pointer-events-none" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-full pr-8 text-[14px] text-fg placeholder:text-fg-muted bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 inline-flex h-10 w-10 items-center justify-center text-fg-muted hover:text-neutral-700 transition-colors cursor-pointer"
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Security Criteria Checklist */}
                    <div className="bg-neutral-50 rounded-brand-md p-3 border border-neutral-100 space-y-1.5 text-[12px]">
                      <p className="font-semibold text-neutral-700 mb-1">Yêu cầu bảo mật:</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'text-success' : 'text-neutral-300'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={hasMinLength ? 'text-fg font-medium' : 'text-neutral-400'}>
                          Tối thiểu 8 ký tự
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasUpper && hasLower ? 'text-success' : 'text-neutral-300'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={hasUpper && hasLower ? 'text-fg font-medium' : 'text-neutral-400'}>
                          Chứa cả chữ hoa (A-Z) và chữ thường (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasNumber ? 'text-success' : 'text-neutral-300'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={hasNumber ? 'text-fg font-medium' : 'text-neutral-400'}>
                          Chứa ít nhất 1 chữ số (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordsMatch ? 'text-success' : 'text-neutral-300'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={passwordsMatch ? 'text-fg font-medium' : 'text-neutral-400'}>
                          Mật khẩu xác nhận trùng khớp
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !isPasswordValid}
                      className="w-full h-11 bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 text-white rounded-brand-md font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-brand-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang cập nhật...</span>
                        </>
                      ) : (
                        <>
                          <span>Cập nhật mật khẩu & Đăng nhập</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
      </main>
    </div>
  );
}
