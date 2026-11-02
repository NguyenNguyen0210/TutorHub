import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceShell from '@/components/layout/WorkspaceShell';
import { NAV } from '@/components/layout/navConfig';

export const STUDENT_NAV_LINKS = NAV.Student.map(({ path, label, icon }) => ({ to: path, label, icon }));

export default function StudentLayout() {
  return (
    <WorkspaceShell userRole="Student">
      <Outlet />
    </WorkspaceShell>
  );
}
