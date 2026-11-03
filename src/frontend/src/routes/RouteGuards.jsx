import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAuthReturnUrl } from '../utils/authRedirect';
import { getPostAuthDestination } from '../services/authRedirect.service';

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RequireRole({ allowedRoles, children }) {
  const { role, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="p-8 text-center bg-surface rounded-brand-lg border border-danger/25">
        <h2 className="text-danger-strong font-bold text-headline-3 mb-2">403 — Không đủ thẩm quyền truy cập</h2>
        <p className="text-caption text-fg-secondary mb-4">
          Tài khoản hiện tại của bạn (<strong>{role}</strong>) không có quyền truy cập khu vực này.
        </p>
        <Link to="/" className="text-brand-primary-700 font-bold text-xs hover:underline">
          Về Trang Khám Phá
        </Link>
      </div>
    );
  }

  return children;
}

export function GuestGuard({ children }) {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [redirectError, setRedirectError] = useState(false);
  const returnUrl = getAuthReturnUrl(location);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    setRedirectError(false);
    getPostAuthDestination(role, returnUrl).then((destination) => {
      if (!cancelled && useAuthStore.getState().isAuthenticated) navigate(destination, { replace: true });
    }).catch(() => {
      if (!cancelled) setRedirectError(true);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, role, returnUrl, navigate]);

  if (isAuthenticated) {
    return <p role="status" className="p-8 text-center text-fg-secondary">{redirectError ? 'Không thể chuyển trang. Vui lòng tải lại trang.' : 'Đang mở trang dành cho bạn…'}</p>;
  }

  return children;
}
