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
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <h2 className="text-rose-600 font-bold text-lg mb-2">403 — Khong Du Tham Quyen Truy Cap</h2>
        <p className="text-xs text-slate-600 mb-4">
          Tai khoan hien tai cua ban (<strong>{role}</strong>) khong co quyen truy cap khu vuc nay.
        </p>
        <Link to="/tutors" className="text-indigo-600 font-bold text-xs hover:underline">
          Ve Trang Kham Pha
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