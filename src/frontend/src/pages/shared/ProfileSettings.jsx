import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import userService from '@/services/user.service';
import { mediaService } from '@/services/media.service';
import { profilePayload, profileValues, validateProfile } from '@/utils/profileSettings';
import AvatarPicker from '@/components/settings/AvatarPicker';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Textarea, Field } from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Callout from '@/components/ui/Callout';
import { useToast } from '@/components/ui/Toast';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

function PasswordField({ id, label, value, onChange, onBlur, error, hint, autoComplete, disabled }) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = `${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <Field label={label} htmlFor={id} required>
    <div className="relative"><Input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete}
      value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required
      aria-invalid={Boolean(error)} aria-describedby={describedBy} state={error ? 'error' : 'default'} className="rounded-[10px] pr-12" />
      <button type="button" onClick={() => setVisible(value => !value)} aria-pressed={visible}
        aria-label={visibilityLabel} title={visibilityLabel} disabled={disabled}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-fg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icon name={visible ? 'visibility_off' : 'visibility'} size="sm" />
      </button>
    </div>
    {hint && <p id={`${id}-hint`} className="mt-2 text-caption leading-relaxed text-fg-secondary">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-caption text-danger-strong">{error}</p>}
  </Field>;
}

export default function ProfileSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role } = useAuthStore();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [draft, setDraft] = useState(() => profileValues());
  const [saved, setSaved] = useState(() => profileValues());
  const [touched, setTouched] = useState({});
  const [teachingProfileMissing, setTeachingProfileMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const uploaded = useRef(null);
  const savingRef = useRef(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordTouched, setPasswordTouched] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [passwordFormVersion, setPasswordFormVersion] = useState(0);
  const changingRef = useRef(false);
  const teaching = role === 'Tutor' && !teachingProfileMissing;

  useEffect(() => {
    if (currentPasswordError && !changingPassword) document.getElementById('curr-password')?.focus();
  }, [currentPasswordError, changingPassword]);

  useEffect(() => {
    if (!pendingAvatar) { setPreview(null); return; }
    const url = URL.createObjectURL(pendingAvatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingAvatar]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        let missing = false;
        let data;
        if (role === 'Tutor') {
          try { data = await userService.getMyTutorProfile(); }
          catch (err) {
            if ((err?.status ?? err?.response?.status) !== 404) throw err;
            missing = true;
            data = await userService.getMyProfile();
          }
        } else data = await userService.getMyProfile();
        if (!cancelled) {
          const values = profileValues(data);
          setDraft(values); setSaved(values); setTeachingProfileMissing(missing);
          setPendingAvatar(null); setTouched({}); setSaveError('');
        }
      } catch (err) { if (!cancelled) setError(err); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [role, userId, retry]);

  const dirty = Boolean(pendingAvatar) || JSON.stringify(profilePayload(draft, teaching)) !== JSON.stringify(profilePayload(saved, teaching));
  const errors = validateProfile(pendingAvatar ? { ...draft, avatarUrl: '' } : draft, teaching);
  const change = (key, value) => { setDraft(previous => ({ ...previous, [key]: value })); setSaveError(''); };
  const fieldError = key => touched[key] ? errors[key] : undefined;
  const blur = key => setTouched(previous => ({ ...previous, [key]: true }));
  const reset = () => { setDraft({ ...saved }); setPendingAvatar(null); uploaded.current = null; setTouched({}); setSaveError(''); };
  const chooseAvatar = file => { setPendingAvatar(file); uploaded.current = null; change('avatarUrl', saved.avatarUrl); };

  const saveProfile = async event => {
    event.preventDefault();
    if (savingRef.current || !dirty) return;
    setTouched(Object.fromEntries(Object.keys(draft).map(key => [key, true])));
    if (Object.keys(errors).length) return;
    savingRef.current = true; setSaving(true); setSaveError('');
    try {
      let avatarUrl = draft.avatarUrl;
      if (pendingAvatar) {
        if (uploaded.current?.file !== pendingAvatar) uploaded.current = { file: pendingAvatar, url: await mediaService.uploadAvatar(pendingAvatar) };
        avatarUrl = uploaded.current.url;
      }
      const payload = profilePayload({ ...draft, avatarUrl }, teaching);
      const updated = teaching ? await userService.updateMyTutorProfile(payload) : await userService.updateMyProfile(payload);
      const values = profileValues({ ...draft, ...updated, avatarUrl: updated.avatarUrl ?? '' });
      setDraft(values); setSaved(values); setPendingAvatar(null); uploaded.current = null; setTouched({});
      const auth = useAuthStore.getState();
      if (auth.user?.id === userId && auth.accessToken) auth.login({ ...auth.user,
        name: values.fullName, fullName: values.fullName, phone: values.phone || null, avatarUrl: values.avatarUrl || null,
      }, { accessToken: auth.accessToken, refreshToken: auth.refreshToken }, auth.rememberMe);
      toast.success('Cập nhật hồ sơ thành công.');
    } catch {
      setSaveError('Chưa thể lưu hồ sơ. Thông tin bạn nhập vẫn được giữ lại, vui lòng thử lại.');
    } finally { savingRef.current = false; setSaving(false); }
  };

  const passwordErrors = {
    ...(!passwords.current ? { current: 'Nhập mật khẩu hiện tại.' } : {}),
    ...(passwords.next.length < 8 ? { next: 'Mật khẩu mới cần ít nhất 8 ký tự.' }
      : passwords.next === passwords.current ? { next: 'Mật khẩu mới cần khác mật khẩu hiện tại.' } : {}),
    ...(passwords.confirm !== passwords.next || !passwords.confirm ? { confirm: 'Mật khẩu xác nhận chưa khớp.' } : {}),
  };
  const resetPasswords = () => {
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordTouched({});
    setPasswordError('');
    setCurrentPasswordError('');
    setPasswordFormVersion(version => version + 1);
  };
  const passwordDirty = Object.values(passwords).some(Boolean);
  const changePassword = async event => {
    event.preventDefault();
    if (changingRef.current) return;
    setPasswordTouched({ current: true, next: true, confirm: true });
    if (Object.keys(passwordErrors).length) {
      const firstInvalid = passwordErrors.current ? 'curr-password' : passwordErrors.next ? 'new-password' : 'confirm-password';
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    changingRef.current = true; setChangingPassword(true); setPasswordError(''); setCurrentPasswordError('');
    try {
      await userService.changePassword(passwords.current, passwords.next);
      resetPasswords();
      await useAuthStore.getState().logout();
      toast.success('Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.');
      navigate('/auth/login', { replace: true, state: { returnUrl: location.pathname + location.search } });
    } catch (err) {
      const incorrectPassword = err?.status === 401 && [err.message, ...(err.errors || [])].includes('Current password is incorrect.');
      if (incorrectPassword) {
        setCurrentPasswordError('Mật khẩu hiện tại chưa đúng. Vui lòng nhập lại.');
      } else {
        setPasswordError(err?.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.' : 'Chưa thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally { changingRef.current = false; setChangingPassword(false); }
  };

  if (loading) return <div className="mx-auto max-w-3xl py-6"><DetailSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-3xl py-6"><ErrorState error={error} title="Không tải được thông tin tài khoản" onRetry={() => setRetry(value => value + 1)} /></div>;

  const profileForm = <form onSubmit={saveProfile} noValidate className="space-y-5">
    {teachingProfileMissing && <Callout variant="neutral" title="Chưa có hồ sơ giảng dạy">Bạn có thể cập nhật thông tin cá nhân và theo dõi xét duyệt trong menu tài khoản.</Callout>}
    <Card padding="lg" className="space-y-6 rounded-2xl border border-border shadow-none">
      <AvatarPicker src={preview || draft.avatarUrl} name={draft.fullName} disabled={saving} onChoose={chooseAvatar}
        onDefault={() => { setPendingAvatar(null); uploaded.current = null; change('avatarUrl', ''); }} />
      <section aria-labelledby="personal-info-title" className="space-y-5">
        <div><h2 id="personal-info-title" className="text-lg font-semibold text-fg">Thông tin cá nhân</h2><p className="mt-1 text-sm text-fg-secondary">Cập nhật thông tin hiển thị trên TutorHub.</p></div>
        <Field label="Họ và tên hiển thị" htmlFor="profile-fullName" required error={fieldError('fullName')}>
          <Input id="profile-fullName" autoComplete="name" maxLength={100} required value={draft.fullName} disabled={saving}
            onChange={event => change('fullName', event.target.value)} onBlur={() => blur('fullName')} state={fieldError('fullName') ? 'error' : 'default'} aria-invalid={Boolean(fieldError('fullName'))} />
        </Field>
        <Field label="Email đăng nhập" htmlFor="profile-email" hint="Email đăng nhập không thể chỉnh sửa tại đây.">
          <div className="relative"><Input id="profile-email" type="email" autoComplete="email" readOnly value={draft.email} className="bg-neutral-50 pr-11 text-fg-secondary" /><Icon name="lock" size="sm" className="pointer-events-none absolute right-3 top-3 text-fg-muted" /></div>
        </Field>
        <Field label="Số điện thoại liên hệ" htmlFor="profile-phone" error={fieldError('phone')} hint="Dùng để liên hệ khi cần hỗ trợ lớp học.">
          <Input id="profile-phone" type="tel" autoComplete="tel" maxLength={30} value={draft.phone} disabled={saving}
            onChange={event => change('phone', event.target.value)} onBlur={() => blur('phone')} state={fieldError('phone') ? 'error' : 'default'} aria-invalid={Boolean(fieldError('phone'))} placeholder="Ví dụ: 0912345678" />
        </Field>
      </section>

      {teaching && <section className="space-y-5 border-t border-border pt-5">
        <CardHeader title="Hồ sơ giảng dạy" subtitle="Thông tin chuyên môn hiển thị trong hồ sơ gia sư." />
        <Field label="Số năm kinh nghiệm" htmlFor="profile-experience" error={fieldError('experienceYears')}><Input id="profile-experience" type="number" min={0} max={60} disabled={saving} value={draft.experienceYears} onChange={event => change('experienceYears', event.target.value)} onBlur={() => blur('experienceYears')} /></Field>
        <Field label="Học vấn & Bằng cấp chuyên môn" htmlFor="profile-education"><Input id="profile-education" maxLength={1000} value={draft.education} disabled={saving} onChange={event => change('education', event.target.value)} /></Field>
        <Field label="Giới thiệu và phương pháp giảng dạy" htmlFor="profile-bio"><Textarea id="profile-bio" maxLength={2000} rows={4} value={draft.bio} disabled={saving} onChange={event => change('bio', event.target.value)} /></Field>
      </section>}
      {saveError && <p role="alert" className="rounded-xl bg-danger-subtle p-3 text-sm text-danger-strong">{saveError}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button variant="outline" onClick={reset} disabled={!dirty || saving}>Hủy thay đổi</Button><Button type="submit" loading={saving} disabled={!dirty || saving} icon={<Icon name="check" size="sm" />}>{saveError ? 'Thử lưu lại' : 'Lưu thay đổi'}</Button></div>
    </Card>
  </form>;

  const passwordForm = (
    <form onSubmit={changePassword} noValidate aria-labelledby="password-form-title" aria-busy={changingPassword} className="mx-auto w-full max-w-[680px]">
      <Card padding="lg" className="space-y-6 rounded-2xl border border-border shadow-none sm:p-7">
        <div>
          <h2 id="password-form-title" className="text-lg font-semibold text-fg">Đổi mật khẩu</h2>
          <p className="mt-2 text-sm text-fg-secondary">Bảo vệ tài khoản TutorHub của bạn.</p>
        </div>
        <div className="w-full space-y-5">
          {[
            ['current', 'curr-password', 'Mật khẩu hiện tại'],
            ['next', 'new-password', 'Mật khẩu mới'],
            ['confirm', 'confirm-password', 'Xác nhận mật khẩu mới'],
          ].map(([key, id, label]) => (
            <PasswordField key={`${passwordFormVersion}-${key}`} id={id} label={label} value={passwords[key]} disabled={changingPassword}
              autoComplete={key === 'current' ? 'current-password' : 'new-password'}
              hint={key === 'next' ? 'Ít nhất 8 ký tự, khác mật khẩu hiện tại. Ưu tiên cụm từ dài, khó đoán và chưa dùng ở nơi khác.' : undefined}
              error={key === 'current' && currentPasswordError ? currentPasswordError : passwordTouched[key] ? passwordErrors[key] : undefined}
              onChange={event => {
                setPasswords(previous => ({ ...previous, [key]: event.target.value }));
                setPasswordError('');
                if (key === 'current') setCurrentPasswordError('');
              }}
              onBlur={() => setPasswordTouched(previous => ({ ...previous, [key]: true }))} />
          ))}
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-3 text-caption leading-relaxed text-fg-secondary">
          <Icon name="lock" size="sm" className="mt-0.5 shrink-0 text-brand-primary-600" />
          Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên tất cả thiết bị.
        </p>
        {passwordError && <p role="alert" className="rounded-xl bg-danger-subtle p-3 text-sm text-danger-strong">{passwordError}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={!passwordDirty || changingPassword} onClick={resetPasswords}>Đặt lại</Button>
          <Button type="submit" loading={changingPassword} disabled={changingPassword || Boolean(Object.keys(passwordErrors).length)}>Cập nhật mật khẩu</Button>
        </div>
      </Card>
    </form>
  );

  return <div className="mx-auto max-w-3xl space-y-6 py-2 sm:py-4">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-headline-page text-fg">Cài đặt tài khoản</h1><p className="mt-2 text-body-reg text-fg-secondary">Quản lý hồ sơ cá nhân và bảo mật tài khoản.</p></div><Badge variant="neutral">{role === 'Tutor' ? 'Gia sư' : role === 'Admin' ? 'Quản trị viên' : 'Học viên'}</Badge></header>
    <Tabs value={searchParams.get('tab') === 'password' ? 'password' : 'profile'} onChange={tab => setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('tab', tab); return next; }, { replace: true })}
      tabs={[{ key: 'profile', label: 'Hồ sơ cá nhân', icon: <Icon name="person" size="sm" />, content: profileForm }, { key: 'password', label: 'Đổi mật khẩu', icon: <Icon name="lock" size="sm" />, content: passwordForm }]} />
  </div>;
}
