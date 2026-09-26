import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceShell from '@/components/layout/WorkspaceShell';
import { useAuthStore } from '@/store/authStore';

/**
 * WorkspaceLayout — shell dùng chung cho các màn `/app/*` (Hộp thư, Thông báo).
 *
 * Vì sao cần: `/app/messages` và `/app/notifications` trước đây nằm trong
 * `PublicLayout`, nên bấm "Tin nhắn" ở sidebar làm người dùng **rời khỏi giao
 * diện trong sàn**: sidebar biến mất và topbar công khai hiện lên trên. Đây là
 * công cụ trong sàn nên phải dùng chính shell của vai trò đang đăng nhập.
 *
 * Dùng layout chung thay vì khai báo lại `/app/*` trong cả ba khối route
 * (Student / Tutor / Admin) để không phải lặp và để vai trò sau này tự nhận đúng
 * shell mà không cần sửa routes.
 */
export default function WorkspaceLayout() {
  const { role } = useAuthStore();

  return (
    <WorkspaceShell userRole={role}>
      <Outlet />
    </WorkspaceShell>
  );
}
