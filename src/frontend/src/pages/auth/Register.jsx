import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { registerWithCredentials } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản Bảo chứng Escrow.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await registerWithCredentials(email, password, fullName, phoneNumber, selectedRole);

      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/auth/login');
    } catch (err) {
      setErrorMsg(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-light p-8 sm:p-10 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo-50 flex items-center justify-center border border-brand-indigo-100 shadow-xs">
              <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <span className="text-2xl font-extrabold text-brand-indigo-600 tracking-tight">
              Tutor<span className="text-brand-navy-900">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tạo Tài Khoản Mới</h1>
          <p className="text-xs text-text-muted">Chọn vai trò tham gia nền tảng bảo chứng học phí 2 chiều</p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedRole('Student')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'Student'
                ? 'bg-white text-brand-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">school</span>
            Tôi Là Học Viên
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('Tutor')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'Tutor'
                ? 'bg-white text-financial-available shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">psychology</span>
            Tôi Là Gia Sư
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="reg-fullname" className="text-xs font-bold text-slate-700 block">
              Họ và tên
            </label>
            <input
              id="reg-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="reg-email" className="text-xs font-bold text-slate-700 block">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="reg-phone" className="text-xs font-bold text-slate-700 block">
                Số điện thoại
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0912345678"
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="reg-password" className="text-xs font-bold text-slate-700 block">
                Mật khẩu
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="reg-confirm-password" className="text-xs font-bold text-slate-700 block">
                Xác nhận mật khẩu
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <label htmlFor="reg-terms" className="flex items-start gap-2 cursor-pointer">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-brand-indigo-600 focus:ring-brand-indigo-500 border-border-light"
              />
              <span className="text-xs text-slate-600 leading-normal">
                Tôi đồng ý với <Link to="/tutors" className="text-brand-indigo-600 font-bold underline">Điều khoản dịch vụ</Link> và cơ chế bảo chứng ký quỹ học phí <Link to="/tutors" className="text-financial-available font-bold underline">Escrow Guarantee</Link> của sàn TutorHub.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
            <span className="material-symbols-outlined text-base">person_add</span>
          </button>
        </form>

        <div className="pt-4 border-t border-border-light text-center">
          <p className="text-xs text-slate-600">
            Đã có tài khoản?{' '}
            <Link to="/auth/login" className="font-bold text-brand-indigo-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
