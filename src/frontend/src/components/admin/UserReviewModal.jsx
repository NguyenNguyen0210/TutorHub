import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import Avatar, { Drawer, Menu, Modal } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { AdminStatus } from './AdminWorkspacePrimitives';
import { useConfirm } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatters';
import { DetailSkeleton } from '@/components/common/Skeleton';

export const USER_STATES = { Active: ['Đang hoạt động', 'mint'], Suspended: ['Tạm khóa', 'amber'], Banned: ['Đã cấm truy cập', 'danger'] };
export const USER_ROLES = { Student: 'Học viên', Tutor: 'Gia sư', Admin: 'Quản trị viên' };
const ACTIONS = { suspend: 'Tạm khóa tài khoản', reactivate: 'Mở lại tài khoản', ban: 'Cấm tài khoản', unban: 'Gỡ cấm tài khoản' };
const HISTORY = { USER_SUSPENDED: 'Tạm khóa tài khoản', USER_REACTIVATED: 'Mở lại tài khoản', USER_BANNED: 'Cấm truy cập', USER_UNBANNED: 'Gỡ cấm' };
export default function UserReviewModal({ id, onClose }) {
  const selfId = useAuthStore(state => state.user?.id);
  const client = useQueryClient(), confirm = useConfirm(), toast = useToast();
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => { const media = window.matchMedia('(max-width: 639px)'); const update = () => setMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  const query = useQuery({ queryKey: ['admin-users-detail', selfId, id], queryFn: () => adminService.getUserById(id), enabled: !!id, retry: false });
  const item = query.data;
  const close = () => { if (!lock.current && !document.querySelector('[role="menu"]')) onClose(); };
  const act = async action => {
    if (lock.current || !item || item.id === selfId) return;
    lock.current = true; setBusy(true);
    try {
      let reason = '';
      const ok = await confirm({ title: ACTIONS[action], confirmText: 'Xác nhận', danger: action === 'ban', requireReason: action !== 'reactivate', minReasonLength: 10, maxReasonLength: 500, reasonLabel: 'Lý do xử lý', onConfirmReason: value => { reason = value; }, content: <div className="space-y-3 text-sm"><p className="font-semibold">{item.fullName}</p><p className="break-all text-fg-secondary">{item.email}</p><p>{['suspend', 'ban'].includes(action) ? 'Tài khoản sẽ bị hạn chế truy cập và các phiên đăng nhập được thu hồi. Hợp đồng và quyền lợi học phí vẫn cần được theo dõi, xử lý theo quy trình liên quan.' : 'Khôi phục quyền truy cập của tài khoản. Dữ liệu lịch sử xử lý được giữ nguyên.'}</p></div> });
      if (!ok) return;
      if (action === 'suspend') await adminService.suspendUser(id, reason);
      if (action === 'ban') await adminService.banUser(id, reason);
      if (action === 'unban') await adminService.unbanUser(id, reason);
      if (action === 'reactivate') await adminService.reactivateUser(id);
      await Promise.all([client.invalidateQueries({ queryKey: ['admin-users'] }), client.invalidateQueries({ queryKey: ['admin-users-summary'] }), client.invalidateQueries({ queryKey: ['admin-users-detail', selfId, id] })]);
      toast.success('Đã cập nhật quyền truy cập tài khoản.');
    } catch { toast.error('Chưa thể cập nhật tài khoản. Vui lòng kiểm tra trạng thái mới nhất và thử lại.'); await query.refetch(); }
    finally { lock.current = false; setBusy(false); }
  };
  const footer = <div className="flex w-full flex-wrap items-center justify-end gap-3"><Button variant="outline" disabled={busy} onClick={close}>Đóng</Button>{item && item.id !== selfId && <>{item.status === 'Active' ? <Button variant="outline" disabled={busy} onClick={() => act('suspend')}>Tạm khóa</Button> : <Button disabled={busy} onClick={() => act(item.status === 'Banned' ? 'unban' : 'reactivate')}>{item.status === 'Banned' ? 'Gỡ cấm' : 'Mở lại'}</Button>}{item.status !== 'Banned' && <Menu trigger={<span className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand-primary-600">Thao tác khác</span>} items={[{ key: 'ban', label: 'Cấm tài khoản', danger: true, onClick: () => act('ban') }]} />}</>}</div>;
  const content = query.isPending ? <DetailSkeleton /> : query.isError || !item ? <div className="space-y-4"><p role="alert" className="text-sm">Không thể tải hồ sơ tài khoản này.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div> : <div className="space-y-6">
    <div className="flex items-start gap-4"><Avatar src={item.avatarUrl} name={item.fullName} size="lg" /><div className="min-w-0"><h2 className="text-lg font-semibold">{item.fullName}</h2><p className="mt-1 break-all text-sm text-fg-secondary">{item.email}</p><p className="mt-2 text-xs text-fg-secondary">{USER_ROLES[item.role] || 'Chưa rõ vai trò'}</p><div className="mt-2"><AdminStatus label={USER_STATES[item.status]?.[0]} tone={USER_STATES[item.status]?.[1]} /></div></div></div>
    <dl className="grid gap-5 sm:grid-cols-2">{[['Số điện thoại', item.phone || 'Chưa cung cấp'], ['Ngày tham gia', formatDateTime(item.createdAt)], ['Khóa do sai mật khẩu', item.lockoutEndAt && Date.parse(item.lockoutEndAt.endsWith('Z') ? item.lockoutEndAt : `${item.lockoutEndAt}Z`) > Date.now() ? `Đến ${formatDateTime(item.lockoutEndAt)}` : 'Không'], ['Đăng nhập sai liên tiếp', item.accessFailedCount == null ? 'Chưa có dữ liệu' : `${item.accessFailedCount} lần`]].map(([label, value]) => <div key={label}><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-2 text-sm">{value}</dd></div>)}</dl>
    {item.tutorProfile && <section className="space-y-4 border-t border-border pt-5"><h3 className="font-semibold">Hồ sơ giảng dạy</h3><dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Học vấn', item.tutorProfile.education || 'Chưa cung cấp'], ['Kinh nghiệm', `${item.tutorProfile.experienceYears} năm`], ['Trạng thái hồ sơ', { Approved: 'Đã phê duyệt', Pending: 'Chờ xét duyệt', Rejected: 'Cần bổ sung' }[item.tutorProfile.latestApplicationStatus] || 'Chưa có hồ sơ xét duyệt'], ["Gói đang đăng", item.tutorProfile.publishedServices], ['Hợp đồng đang học', item.tutorProfile.activeEnrollments], ['Buổi đã hoàn thành', item.tutorProfile.totalCompletedSessions]].map(([label, value]) => <div key={label}><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-2">{value ?? 'Chưa có dữ liệu'}</dd></div>)}</dl>{item.tutorProfile.subjects?.length > 0 && <p className="text-sm leading-6">Môn giảng dạy: {item.tutorProfile.subjects.map(subject => subject.name).join(', ')}</p>}{item.tutorProfile.bio && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-fg-secondary">{item.tutorProfile.bio}</p>}<div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/services?tutorUserId=${item.id}`} variant="outline" size="sm">Gói học của gia sư</Button>{item.tutorProfile.applicationId && <Button as={Link} to={`/admin/tutor-applications?applicationId=${item.tutorProfile.applicationId}`} variant="outline" size="sm">Hồ sơ xét duyệt</Button>}{item.status === 'Active' && item.tutorProfile.latestApplicationStatus === 'Approved' && <Button as={Link} to={`/tutors/${item.tutorProfile.id}`} variant="outline" size="sm">Xem hồ sơ công khai</Button>}</div></section>}
    {['Student', 'Tutor'].includes(item.role) && <Button as={Link} to={`/admin/enrollments?participantUserId=${item.id}`} variant="outline" size="sm">Hợp đồng liên quan</Button>}
    <section className="space-y-4 border-t border-border pt-5"><h3 className="text-base font-semibold">Lịch sử quản lý quyền truy cập</h3>{item.disciplineHistory?.length ? <ol className="space-y-4">{item.disciplineHistory.map((entry, index) => <li key={`${entry.createdAt}-${index}`} className="border-l-2 border-brand-primary-100 pl-4"><p className="text-sm font-medium">{HISTORY[entry.action] || 'Cập nhật tài khoản'}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(entry.createdAt)}{entry.adminName && ` · ${entry.adminName}`}</p>{entry.reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{entry.reason === 'Reactivated by administrator' ? 'Quản trị viên khôi phục quyền truy cập.' : entry.reason}</p>}</li>)}</ol> : <p className="text-sm text-fg-secondary">Tài khoản chưa có lịch sử xử lý.</p>}</section>
    {item.id === selfId && <p className="rounded-lg bg-brand-primary-50 p-3 text-sm text-fg-secondary">Đây là tài khoản bạn đang sử dụng. Việc thay đổi quyền truy cập cần quản trị viên khác thực hiện.</p>}
    <details className="border-t border-border pt-4 text-xs text-fg-secondary"><summary className="cursor-pointer">Mã tài khoản</summary><p className="mt-3 select-all break-all">{item.id}</p><Button variant="ghost" size="sm" className="mt-2" onClick={async () => { try { await navigator.clipboard.writeText(item.id); toast.success('Đã sao chép mã tài khoản.'); } catch { toast.error('Chưa sao chép được. Bạn có thể chọn mã để sao chép trực tiếp.'); } }}>Sao chép mã</Button></details>
  </div>;
  return mobile ? <Drawer open={!!id} onClose={close} side="right" title="Chi tiết tài khoản" widthClass="w-full" panelClassName="max-w-full" footer={footer}>{content}</Drawer> : <Modal open={!!id} onClose={close} title="Chi tiết tài khoản" size="lg" footer={footer}>{content}</Modal>;
}
