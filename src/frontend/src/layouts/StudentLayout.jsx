import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceShell from '@/components/layout/WorkspaceShell';

export default function StudentLayout() {
  return (
    <WorkspaceShell userRole="Student">
      <Outlet />
    </WorkspaceShell>
  );
}
