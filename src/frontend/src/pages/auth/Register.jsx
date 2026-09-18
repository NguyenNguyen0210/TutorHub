import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Field, Checkbox } from '@/components/ui/Input';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';

export default function Register() {
  const toast = useToast();
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
    if (password.length < 8) {
      setErrorMsg('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản dịch vụ và chính sách bảo chứng.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await registerWithCredentials(email, password, fullName, phoneNumber, selectedRole);

      toast.success('Đăng ký tài khoản thành công! Email xác thực tài khoản đã được gửi đến hòm thư của bạn.');
      navigate('/auth/login');
    } catch (err) {
      setErrorMsg(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className="w-full shadow-brand-lg border border-border space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-headline-1 text-fg font-bold">Tạo tài khoản mới</h1>
        <p className="text-caption text-fg-muted">
          Chọn vai trò của bạn để bắt đầu học tập hoặc giảng dạy có bảo chứng
        </p>
      </div>

      {/* Role Selection Cards */}
      <div
        className="grid grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Chọn vai trò của bạn"
      >
        <button
          type="button"
          role="radio"
          aria-checked={selectedRole === 'Student'}
          onClick={() => setSelectedRole('Student')}
          className={cn(
            'p-3.5 rounded-brand-md border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1',
            selectedRole === 'Student'
              ? 'border-brand-primary-600 bg-brand-primary-50/40 shadow-brand-sm'
              : 'border-border bg-surface hover:border-neutral-300'
          )}
        >
          <div className="flex items-center justify-between">
            <Icon
              name="school"
              size="sm"
              className={selectedRole === 'Student' ? 'text-brand-primary-600' : 'text-fg-muted'}
            />
            {selectedRole === 'Student' && (
              <span className="w-4 h-4 rounded-full bg-brand-primary-600 text-white flex items-center justify-center">
                <Icon name="check" size="xs" />
              </span>
            )}
          </div>
          <div>
            <span className="font-bold text-caption text-fg block">Tôi là Học viên</span>
            <span className="text-[10px] text-fg-muted block">Tìm gia sư & học tập có bảo chứng</span>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={selectedRole === 'Tutor'}
          onClick={() => setSelectedRole('Tutor')}
          className={cn(
            'p-3.5 rounded-brand-md border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1',
            selectedRole === 'Tutor'
              ? 'border-emerald-600 bg-emerald-50/40 shadow-brand-sm'
              : 'border-border bg-surface hover:border-neutral-300'
          )}
        >
          <div className="flex items-center justify-between">
            <Icon
              name="psychology"
              size="sm"
              className={selectedRole === 'Tutor' ? 'text-emerald-600' : 'text-fg-muted'}
            />
            {selectedRole === 'Tutor' && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Icon name="check" size="xs" />
              </span>
            )}
          </div>
          <div>
            <span className="font-bold text-caption text-fg block">Tôi là Gia sư</span>
            <span className="text-[10px] text-fg-muted block">Mở lớp & nhận thù lao qua Escrow</span>
          </div>
        </button>
      </div>

      {errorMsg && <Callout variant="danger">{errorMsg}</Callout>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Họ và tên đầy đủ" htmlFor="reg-fullname" required>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
              <Icon name="person" size="sm" />
            </span>
            <Input
              id="reg-fullname"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="pl-10"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Địa chỉ email" htmlFor="reg-email" required>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
                <Icon name="mail" size="sm" />
              </span>
              <Input
                id="reg-email"
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

          <Field label="Số điện thoại" htmlFor="reg-phone">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
                <Icon name="phone" size="sm" />
              </span>
              <Input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0912345678"
                className="pl-10"
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Mật khẩu" htmlFor="reg-password" required>
            <Input
              id="reg-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
            />
          </Field>
          <Field label="Xác nhận mật khẩu" htmlFor="reg-confirm-password" required>
            <Input
              id="reg-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
            />
          </Field>
        </div>

        <Checkbox
          id="reg-terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          label={
            <span className="text-[12px] leading-tight text-fg-secondary">
              Tôi đồng ý với{' '}
              <Link to="/tutors" className="text-brand-primary-700 font-semibold underline">
                Điều khoản dịch vụ
              </Link>{' '}
              và cam kết tuân thủ chính sách bảo chứng Escrow của TutorHub.
            </span>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={!loading && <Icon name="person_add" size="sm" />}
        >
          Đăng ký tài khoản ngay
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center">
        <p className="text-caption text-fg-secondary">
          Đã có tài khoản TutorHub?{' '}
          <Link to="/auth/login" className="font-semibold text-brand-primary-700 hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </Card>
  );
}
