import React from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import Tabs from '@/components/ui/Tabs';
import AdminWithdrawals from './AdminWithdrawals';
import AdminStudentWallets from './AdminStudentWallets';

export default function AdminWithdrawalRequests() {
  const [params, setParams] = useSearchParams();
  const audience = params.get('audience') === 'student' ? 'student' : 'tutor';
  return <div className="space-y-6"><WorkspacePageHeader title="Yêu cầu rút tiền" description="Theo dõi và xử lý yêu cầu chi trả của học viên và gia sư." />
    <Tabs tabs={[{ key: 'tutor', label: 'Gia sư' }, { key: 'student', label: 'Học viên' }]} value={audience} onChange={value => setParams({ audience: value })} />
    <section aria-label={audience === 'student' ? 'Yêu cầu rút tiền học viên' : 'Yêu cầu rút tiền gia sư'}>
      {audience === 'student' ? <AdminStudentWallets key="student" withdrawalsOnly /> : <AdminWithdrawals key="tutor" embedded />}
    </section></div>;
}
