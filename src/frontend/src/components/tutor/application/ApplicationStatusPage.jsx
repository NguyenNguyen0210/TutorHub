import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import userService from '@/services/user.service';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/formatters';
import { accountStatusLabel, applicationManagementAction } from '@/utils/tutorApplicationStatus';

const STATUS = {
  Approved: { label: 'Đã phê duyệt', title: 'Hồ sơ đã được phê duyệt', icon: 'verified', variant: 'success', tone: 'bg-success-subtle text-success-strong', description: 'Hồ sơ giảng dạy của bạn đã được chấp thuận trên TutorHub. Bạn có thể quản lý các gói học và hoạt động giảng dạy của mình.' },
  Pending: { label: 'Chờ xét duyệt', title: 'Hồ sơ đang chờ xét duyệt', icon: 'hourglass_top', variant: 'info', tone: 'bg-brand-primary-50 text-primary', description: 'TutorHub đã tiếp nhận hồ sơ của bạn. Kết quả xét duyệt sẽ được cập nhật tại đây và trong thông báo.' },
  Rejected: { label: 'Không được phê duyệt', title: 'Hồ sơ chưa được phê duyệt', icon: 'description', variant: 'holding', tone: 'bg-holding-subtle text-holding-strong', description: 'Xem lý do xét duyệt, chỉnh sửa thông tin cần thiết và gửi lại hồ sơ để được xem xét.' },
};

export default function ApplicationStatusPage({ application, onEdit, onRefresh, refreshing }) {
  const approved = application.status === 'Approved';
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(approved);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!approved) { setMetadata(null); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([userService.getMyProfile(), userService.getMyTutorProfile(), tutorService.getMyServices()]).then(([account, profile, services]) => {
      if (!cancelled) {
        setMetadata({ account: account.status === 'fulfilled' ? account.value : null, profile: profile.status === 'fulfilled' ? profile.value : null, services: services.status === 'fulfilled' ? services.value : null, unavailable: [account, profile, services].some(item => item.status === 'rejected') });
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [approved, application.id, retry]);
  const status = STATUS[application.status];
  if (!status) return <div className="mx-auto max-w-[880px] space-y-4"><h1 className="text-[28px] font-semibold text-fg">Hồ sơ giảng dạy</h1><p className="text-body-reg text-fg-secondary">Chưa xác định được trạng thái hồ sơ. Vui lòng tải lại để kiểm tra.</p><Button variant="outline" onClick={onRefresh} loading={refreshing}>Kiểm tra lại</Button></div>;
  const action = applicationManagementAction(metadata?.services);
  const accountState = accountStatusLabel(metadata?.account?.status);
  const hasDetails = Boolean(application.submittedAt || application.reviewedAt || (approved && (accountState || metadata?.account?.role === 'Tutor')));
  return <div className="mx-auto max-w-[880px] space-y-6">
    <header><h1 className="text-[28px] font-semibold tracking-tight text-fg">Hồ sơ giảng dạy</h1><p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Theo dõi trạng thái xét duyệt và quản lý hồ sơ gia sư.</p></header>
    <Card as="section" padding="lg" variant="outlined" className="rounded-2xl" aria-labelledby="application-status-title">
      <div className="flex items-start gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${status.tone}`}><Icon name={status.icon} size="lg" /></span><div className="min-w-0"><Badge variant={status.variant} dot>{status.label}</Badge><h2 id="application-status-title" className="mt-3 text-xl font-semibold text-fg">{status.title}</h2></div></div>
      <p className="mt-4 text-body-reg leading-relaxed text-fg-secondary">{status.description}</p>
      {hasDetails && <dl className="mt-6 grid gap-4 border-t border-border pt-5 text-body-reg sm:grid-cols-2">
        {application.submittedAt && <div><dt className="text-fg-secondary">Ngày gửi hồ sơ</dt><dd className="mt-1 font-medium text-fg">{formatDateTime(application.submittedAt)}</dd></div>}
        {application.reviewedAt && <div><dt className="text-fg-secondary">{approved ? 'Ngày phê duyệt' : 'Ngày xét duyệt'}</dt><dd className="mt-1 font-medium text-fg">{formatDateTime(application.reviewedAt)}</dd></div>}
        {approved && accountState && <div><dt className="text-fg-secondary">Trạng thái tài khoản</dt><dd className="mt-1 font-medium text-fg">{accountState}</dd></div>}
        {approved && metadata?.account?.role === 'Tutor' && <div><dt className="text-fg-secondary">Vai trò</dt><dd className="mt-1 font-medium text-fg">Gia sư</dd></div>}
      </dl>}
      {application.status === 'Rejected' && <div className="mt-5 space-y-2 rounded-xl bg-holding-subtle p-4 text-body-reg"><h3 className="font-semibold text-holding-strong">Lý do xét duyệt</h3><p className="whitespace-pre-wrap break-words leading-relaxed text-fg-secondary">{application.rejectionReason || 'Chưa có lý do chi tiết. Vui lòng liên hệ hỗ trợ để được hướng dẫn trước khi gửi lại.'}</p></div>}
    </Card>
    <Card as="section" padding="lg" variant="outlined" className="space-y-4 rounded-2xl" aria-labelledby="application-actions-title">
      <div><h2 id="application-actions-title" className="text-lg font-semibold text-fg">{approved ? 'Quản lý hoạt động giảng dạy' : application.status === 'Rejected' ? 'Cập nhật hồ sơ' : 'Theo dõi hồ sơ'}</h2><p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">{approved ? 'Quản lý các gói học hoặc xem hồ sơ mà học viên có thể truy cập.' : application.status === 'Rejected' ? 'Thông tin đã gửi được giữ lại để bạn chỉnh sửa và bổ sung.' : 'Bạn có thể kiểm tra lại trạng thái hoặc liên hệ hỗ trợ khi cần.'}</p></div>
      <div className="flex flex-wrap items-center gap-3">
        {approved ? <><Button as={Link} to={action.path} disabled={loading} icon={<Icon name="menu_book" size="sm" />}>{loading ? 'Đang tải gói học…' : action.label}</Button>{metadata?.profile?.profileId && <Button as={Link} to={`/tutors/${metadata.profile.profileId}`} target="_blank" rel="noopener noreferrer" variant="outline" icon={<Icon name="open_in_new" size="sm" />}>Xem hồ sơ công khai</Button>}</>
          : application.status === 'Rejected' ? <Button onClick={onEdit} icon={<Icon name="edit" size="sm" />}>Chỉnh sửa và gửi lại</Button>
          : <Button variant="outline" onClick={onRefresh} loading={refreshing} icon={<Icon name="refresh" size="sm" />}>Kiểm tra trạng thái</Button>}
        {!approved && <Button as="a" href="mailto:support@tutorhub.vn" variant="ghost">Liên hệ hỗ trợ</Button>}
      </div>
      {approved && metadata?.unavailable && <div className="flex flex-wrap items-center gap-3"><p className="text-caption text-fg-secondary">Chưa tải đủ thông tin hồ sơ và gói học.</p><Button variant="ghost" size="sm" onClick={() => setRetry(value => value + 1)}>Thử lại</Button></div>}
      {approved && <Link to="/tutor/dashboard" className="inline-flex min-h-11 items-center text-body-reg font-medium text-primary hover:underline">Quay về Tổng quan</Link>}
    </Card>
  </div>;
}
