import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import Tabs from '@/components/ui/Tabs';
import { adminWorkspaceDestination } from '@/utils/adminWorkspaceNavigation';
import AdminUsers from './AdminUsers';
import AdminTutorApplications from './AdminTutorApplications';

export function AdminApplicationRedirect() {
  const { search } = useLocation();
  return <Navigate to={adminWorkspaceDestination('/admin/tutor-applications', search)} replace />;
}
export function AdminStudentWithdrawalRedirect() {
  const { search } = useLocation();
  return <Navigate to={adminWorkspaceDestination('/admin/student-withdrawals', search)} replace />;
}
export default function AdminPeople() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'applications' ? 'applications' : 'accounts';
  return <div className="space-y-6"><WorkspacePageHeader title="Người dùng & hồ sơ" description="Quản lý tài khoản và xét duyệt hồ sơ giảng dạy." />
    <Tabs tabs={[{ key: 'accounts', label: 'Tài khoản' }, { key: 'applications', label: 'Hồ sơ gia sư' }]} value={tab} onChange={value => setParams({ tab: value })} />
    {tab === 'applications' ? <AdminTutorApplications embedded /> : <AdminUsers embedded />}
  </div>;
}
