import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Field, Checkbox } from '@/components/ui/Input';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';

const DEMO_ACCOUNTS = [
  {
    role: 'Học viên',
    email: 'student.tuan@tutorhub.com',
    password: 'Test@123',
    name: 'Phạm Minh Tuấn',
    tone: 'primary',
    icon: 'school',
  },
  {
    role: 'Gia sư',
    email: 'tutor.an@tutorhub.com',
    password: 'Test@123',
    name: 'Nguyễn Văn An',
    tone: 'success',
    icon: 'psychology',
  },
  {
    role: 'Admin',
    email: 'admin@tutorhub.com',
    password: 'Test@123',
    name: 'Quản Trị Viên',
    tone: 'danger',
    icon: 'shield_person',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const executeLogin = async (loginEmail, loginPass) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginWithCredentials(loginEmail, loginPass);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    await executeLogin(email, password);
  };

  const handleQuickDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg('');
    executeLogin(acc.email, acc.password);
  };

  return (
    <Card padding="lg" className="w-full shadow-brand-lg border border-border space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="text-headline-1 text-fg font-bold">Đăng nhập tài khoản</h1>
        <p className="text-caption text-fg-muted">
          Truy cập bàn học, lịch dạy và ví bảo chứng Escrow của bạn
        </p>
      </div>

      {/* One-Click Demo Role Selector */}
      <div className="p-3 rounded-brand-md bg-neutral-50/90 border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-fg-secondary flex items-center gap-1.5">
            <Icon name="flash_on" size="xs" className="text-amber-500" />
            Đăng nhập nhanh một chạm (Demo)
          </span>
          <Badge variant="neutral" size="sm">Hệ thống mẫu</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo(acc)}
              className="p-2 rounded-brand-md bg-surface border border-border hover:border-brand-primary-500 hover:shadow-brand-sm transition-all text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary-600 disabled:opacity-60"
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  name={acc.icon}
                  size="xs"
                  className={
                    acc.tone === 'primary'
                      ? 'text-brand-primary-600'
                      : acc.tone === 'success'
                        ? 'text-emerald-600'
                        : 'text-danger'
                  }
                />
                <span className="text-caption font-bold text-fg group-hover:text-brand-primary-700">
                  {acc.role}
                </span>
              </div>
              <span className="text-[10px] text-fg-muted truncate block mt-0.5">
                {acc.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <Callout variant="danger">{errorMsg}</Callout>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Địa chỉ email" htmlFor="login-email" required>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
              <Icon name="mail" size="sm" />
            </span>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Mật khẩu" htmlFor="login-password" required>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
              <Icon name="lock" size="sm" />
            </span>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg transition-colors p-1 cursor-pointer"
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between pt-1">
          <Checkbox
            id="login-remember"
            label="Ghi nhớ đăng nhập"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            to="/tutors"
            className="text-caption font-semibold text-brand-primary-700 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={!loading && <Icon name="login" size="sm" />}
        >
          Đăng nhập ngay
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center space-y-2">
        <p className="text-caption text-fg-secondary">
          Chưa có tài khoản?{' '}
          <Link to="/auth/register" className="font-semibold text-brand-primary-700 hover:underline">
            Đăng ký học viên
          </Link>
        </p>
        <p className="text-caption text-fg-muted">
          Bạn là gia sư tài năng?{' '}
          <Link to="/auth/register" className="font-semibold text-success-strong hover:underline">
            Gia nhập mạng lưới gia sư
          </Link>
        </p>
      </div>
    </Card>
  );
}
