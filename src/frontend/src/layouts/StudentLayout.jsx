import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceShell from '@/components/layout/WorkspaceShell';

export const STUDENT_NAV_LINKS = [
  { to: '/student/dashboard', label: 'Bàn học của tôi', icon: 'space_dashboard' },
  { to: '/student/wallet', label: 'Ví học viên', icon: 'account_balance_wallet' },
  { to: '/student/wishlist', label: 'Đã lưu', icon: 'favorite' },
  { to: '/app/messages', label: 'Hộp thư & Hợp đồng', icon: 'chat' },
  { to: '/app/notifications', label: 'Thông báo', icon: 'notifications' },
];

export default function StudentLayout() {
  return (
    <WorkspaceShell userRole="Student">
      <Outlet />
    </WorkspaceShell>
  );
}
