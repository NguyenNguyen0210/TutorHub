import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceShell from '@/components/layout/WorkspaceShell';

export default function AdminLayout() {
  return (
    <WorkspaceShell userRole="Admin">
      <Outlet />
    </WorkspaceShell>
  );
}
