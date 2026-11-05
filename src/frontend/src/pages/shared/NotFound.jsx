import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/components/layout/navConfig';
import StatePanel from '@/components/common/StatePanel';

export default function NotFound({ embedded = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    document.title = 'Không tìm thấy trang';
  }, []);

  const homePath = isAuthenticated ? getDashboardPath(role) : '/';
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(homePath, { replace: true });
  };

  return (
    <div className={embedded ? 'flex min-h-[65vh] items-center justify-center px-4 py-10' : 'flex min-h-screen flex-col bg-background px-4 py-8 sm:py-12'}>
      {!embedded && <Link to={homePath} aria-label="TutorHub — Về trang chính" className="mx-auto mb-8 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo size={36} /></Link>}
      <StatePanel code="404" title="Không tìm thấy trang" headingAs="h1" description="Liên kết này không dẫn đến trang nào trên TutorHub. Bạn có thể quay lại trang trước hoặc tiếp tục từ trang chính." className="my-auto"
        actions={<>
          <Button as={Link} to={homePath} icon={<Icon name="home" size="sm" />}>{isAuthenticated ? 'Về không gian của tôi' : 'Tìm gia sư'}</Button>
          <Button variant="outline" icon={<Icon name="arrow_back" size="sm" />} onClick={goBack}>Quay lại trang trước</Button>
        </>}
      />
      {!embedded && <p className="mx-auto mt-8 text-center text-xs leading-5 text-fg-secondary">TutorHub · Kết nối gia sư, tiếp nối hành trình học</p>}
    </div>
  );
}
