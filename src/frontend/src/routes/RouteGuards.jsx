import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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

  if (isAuthenticated) {
    if (role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'Tutor') return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}