import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import userService from '@/services/user.service';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select, Field } from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Callout from '@/components/ui/Callout';
import { useToast } from '@/components/ui/Toast';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function ProfileSettings() {
  const toast = useToast();
  const { user, role, login, accessToken, refreshToken } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Tutor-specific Profile Form States
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [teachingMode, setTeachingMode] = useState('Online');
  const [address, setAddress] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (role === 'Tutor') {
          const tutorData = await userService.getMyTutorProfile();
          if (!cancelled && tutorData) {
            setFullName(tutorData.fullName || '');
            setEmail(tutorData.email || user?.email || '');
            setPhone(tutorData.phone || '');
            setAvatarUrl(tutorData.avatarUrl || user?.avatarUrl || '');
            setBio(tutorData.bio || '');
            setEducation(tutorData.education || '');
            setExperienceYears(tutorData.experienceYears || 0);
            setTeachingMode(tutorData.teachingMode || 'Online');
            setAddress(tutorData.address || '');
          }
        } else {
          const userData = await userService.getMyProfile();
          if (!cancelled && userData) {
            setFullName(userData.fullName || '');
            setEmail(userData.email || user?.email || '');
            setPhone(userData.phone || '');
            setAvatarUrl(userData.avatarUrl || user?.avatarUrl || '');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [role, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }

    try {
      setSavingProfile(true);

      if (role === 'Tutor') {
        const updated = await userService.updateMyTutorProfile({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          education: education.trim() || null,
          experienceYears: Number(experienceYears) || 0,
          teachingMode,
          address: address.trim() || null,
        });

        // Sync local authStore so topbars/avatars update immediately
        if (user && login && accessToken) {
          login(
            {
              ...user,
              name: updated.fullName || user.name,
              fullName: updated.fullName || user.fullName,
              phone: updated.phone || user.phone,
              avatarUrl: updated.avatarUrl || user.avatarUrl,
            },
            { accessToken, refreshToken }
          );
        }
      } else {
        const updated = await userService.updateMyProfile({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        });

        // Sync local authStore
        if (user && login && accessToken) {
          login(
            {
              ...user,
              name: updated.fullName || user.name,
              fullName: updated.fullName || user.fullName,
              phone: updated.phone || user.phone,
              avatarUrl: updated.avatarUrl || user.avatarUrl,
            },
            { accessToken, refreshToken }
          );
        }
      }

      toast.success('Đã cập nhật thông tin hồ sơ thành công!');
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword(currentPassword, newPassword);
      toast.success('Đổi mật khẩu thành công! Email thông báo bảo mật đã được gửi tới hòm thư của bạn.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Lý do chặn hiện ngay cạnh nút bấm thay vì chỉ bắt người dùng bấm xong mới
  // thấy toast. Cùng pattern với form rút tiền học viên / gia sư.
  const passwordBlocker = useMemo(() => {
    if (!currentPassword) {
      return 'Vui lòng nhập mật khẩu hiện tại.';
    }
    if (newPassword.length < 8) {
      return 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
    }
    if (newPassword !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
    }
    return null;
  }, [currentPassword, newPassword, confirmPassword]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          error={error}
          title="Không tải được thông tin tài khoản"
          onRetry={() => window.location.reload()}
          backPath={role === 'Tutor' ? '/tutor/dashboard' : '/student/dashboard'}
          backLabel="Quay lại bàn điều hành"
        />
      </div>
    );
  }

  const profileForm = (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <Card padding="lg" className="space-y-6">
        <CardHeader
          title="Thông tin cơ bản"
          subtitle="Thông tin này hiển thị trên nền tảng và các lớp học bạn tham gia"
          icon={<Icon name="badge" size="sm" className="text-brand-primary-600" />}
        />

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-brand-md bg-neutral-50 border border-border">
          <Avatar
            src={avatarUrl}
            name={fullName || user?.name}
            size="xl"
            className="w-20 h-20 shadow-brand-sm shrink-0 border-2 border-surface"
          />
          <div className="space-y-2 flex-1 w-full text-center sm:text-left">
            <span className="font-bold text-caption text-fg block">Ảnh đại diện</span>
            <Input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              aria-label="Đường dẫn ảnh đại diện"
            />
            <p className="text-[11px] text-fg-muted m-0">
              Dán đường dẫn ảnh thật. Ảnh này hiển thị trên hồ sơ công khai và trong khung
              nhắn tin; để trống hệ thống sẽ dùng chữ cái đầu tên.
            </p>
          </div>
        </div>

        {/* Basic fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Họ và tên hiển thị" htmlFor="profile-fullName" required>
            <Input
              id="profile-fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Hoàng Nam"
            />
          </Field>

          {/* Badge "Đã xác thực" cũ đã bị gỡ: backend không có field trạng thái
              xác thực email (đã grep toàn repo, 0 kết quả), nên badge khẳng định
              sai sự thật với người dùng. Đừng thêm lại trừ khi API thực sự trả
              trạng thái xác thực — khi đó mới hiển thị được badge. */}
          <Field
            label="Địa chỉ Email (Định danh tài khoản)"
            htmlFor="profile-email"
            hint="Email là định danh đăng nhập của tài khoản nên không thay đổi được tại đây."
          >
            <Input
              id="profile-email"
              type="email"
              disabled
              value={email}
              className="bg-neutral-100/70 text-fg-muted cursor-not-allowed"
            />
          </Field>

          <Field label="Số điện thoại liên hệ" htmlFor="profile-phone">
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912345678"
            />
          </Field>

          {role === 'Tutor' && (
            <Field label="Hình thức giảng dạy" htmlFor="profile-teachingMode">
              <Select
                id="profile-teachingMode"
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value)}
              >
                <option value="Online">Chỉ dạy Trực tuyến (Online)</option>
                <option value="Offline">Chỉ dạy Trực tiếp (Offline)</option>
                <option value="Both">Cả Trực tuyến & Trực tiếp (Both)</option>
              </Select>
            </Field>
          )}
        </div>

        {/* Tutor professional info fields */}
        {role === 'Tutor' && (
          <div className="space-y-4 pt-4 border-t border-border">
            <CardHeader
              title="Hồ sơ sư phạm & Chuyên môn"
              subtitle="Thông tin giúp học viên tin tưởng và lựa chọn gói học phù hợp"
              icon={<Icon name="school" size="sm" className="text-brand-primary-600" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Số năm kinh nghiệm giảng dạy" htmlFor="profile-experience">
                <Input
                  id="profile-experience"
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                />
              </Field>

              <Field label="Khu vực / Địa chỉ dạy học" htmlFor="profile-address">
                <Input
                  id="profile-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
                />
              </Field>
            </div>

            <Field label="Học vấn & Bằng cấp chuyên môn" htmlFor="profile-education">
              <Input
                id="profile-education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Ví dụ: Cử nhân Sư phạm Toán — ĐH Sư phạm Hà Nội (GPA 3.8/4.0)"
              />
            </Field>

            <Field label="Tiểu sử & Giới thiệu phương pháp sư phạm" htmlFor="profile-bio">
              <Textarea
                id="profile-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu phong cách giảng dạy, kinh nghiệm bồi dưỡng học sinh giỏi hoặc luyện thi chứng chỉ..."
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={savingProfile}
            icon={<Icon name="check" size="sm" />}
          >
            Lưu thay đổi hồ sơ
          </Button>
        </div>
      </Card>
    </form>
  );

  const passwordForm = (
    <form onSubmit={handleChangePassword} className="space-y-6">
      <Card padding="lg" className="space-y-5">
        <CardHeader
          title="Đổi mật khẩu tài khoản"
          subtitle="Để bảo đảm an toàn cho tài khoản và số dư ví bảo chứng, vui lòng sử dụng mật khẩu mạnh"
          icon={<Icon name="verified_user" size="sm" className="text-brand-primary-600" />}
        />

        <Callout variant="info" icon={<Icon name="info" size="sm" />}>
          Mật khẩu mới phải có tối thiểu 8 ký tự. Sau khi đổi mật khẩu, hệ thống sẽ bảo vệ phiên đăng nhập hiện tại.
        </Callout>

        <div className="space-y-4 max-w-md">
          <Field label="Mật khẩu hiện tại" htmlFor="curr-password" required>
            <Input
              id="curr-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại..."
            />
          </Field>

          <Field label="Mật khẩu mới (tối thiểu 8 ký tự)" htmlFor="new-password" required>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
            />
          </Field>

          <Field label="Xác nhận mật khẩu mới" htmlFor="confirm-password" required>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
            />
          </Field>
        </div>

        <div className="pt-2 border-t border-border space-y-3">
          {passwordBlocker && (
            <p className="text-caption text-danger-strong m-0" role="status">
              {passwordBlocker}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={changingPassword}
            disabled={Boolean(passwordBlocker)}
            icon={<Icon name="lock" size="sm" />}
          >
            Cập nhật mật khẩu mới
          </Button>
        </div>
      </Card>
    </form>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-page text-fg tracking-tight">Hồ sơ & Cài đặt tài khoản</h1>
          <p className="text-caption text-fg-muted mt-1">
            Quản lý thông tin định danh cá nhân, ảnh đại diện và bảo mật mật khẩu
          </p>
        </div>
        {/* Đỏ là xung đột trong bảng màu này, không phải nhãn vai trò:
            Quản trị viên dùng `neutral`, gia sư `primary`, học viên `info`. */}
        <Badge variant={role === 'Tutor' ? 'primary' : role === 'Admin' ? 'neutral' : 'info'} size="md">
          {role === 'Tutor' ? 'Gia sư chuyên môn' : role === 'Admin' ? 'Quản trị viên' : 'Học viên'}
        </Badge>
      </div>

      <Tabs
        tabs={[
          {
            key: 'profile',
            label: 'Thông tin cá nhân',
            icon: <Icon name="person" size="sm" />,
            content: profileForm,
          },
          {
            key: 'password',
            label: 'Đổi mật khẩu & Bảo mật',
            icon: <Icon name="lock" size="sm" />,
            content: passwordForm,
          },
        ]}
      />
    </div>
  );
}
