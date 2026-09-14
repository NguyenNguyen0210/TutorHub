import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <h2 className="text-rose-600 font-bold text-lg mb-2">403 — Không Đủ Thẩm Quyền Truy Cập</h2>
        <p className="text-xs text-slate-600 mb-4">
          Tài khoản hiện tại của bạn ({role}) không có quyền truy cập khu vực này.
        </p>
        <p className="text-xs text-indigo-600 font-semibold">
          Vui lòng sử dụng nút "Đổi Vai Trò" trên thanh điều hướng để chuyển sang tài khoản phù hợp.
        </p>
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
