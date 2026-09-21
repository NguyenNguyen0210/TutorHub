import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/components/layout/navConfig';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();

  const homePath = isAuthenticated ? getDashboardPath(role) : '/tutors';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-brand-xl bg-brand-primary-50 border border-brand-primary-200 flex items-center justify-center text-brand-primary-600 shadow-brand-sm">
            <Icon name="search_off" size="xl" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary-700 bg-brand-primary-50 px-2.5 py-1 rounded-brand-full border border-brand-primary-200">
            Mã lỗi 404
          </span>
          <h1 className="text-headline-1 text-fg m-0">Trang không tồn tại</h1>
          <p className="text-caption text-fg-muted max-w-sm mx-auto">
            Địa chỉ liên kết bạn đang truy cập có thể đã bị gỡ bỏ, đổi đường dẫn hoặc tạm thời không khả dụng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            icon={<Icon name="home" size="sm" />}
            onClick={() => navigate(homePath)}
          >
            Về trang chính
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={<Icon name="arrow_back" size="sm" />}
            onClick={() => navigate(-1)}
          >
            Quay lại trang trước
          </Button>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-center gap-2">
          <Logo variant="mark" size={20} />
          <span className="text-xs text-fg-muted font-medium">TutorHub Learning Platform</span>
        </div>
      </div>
    </div>
  );
}
