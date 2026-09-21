import React, { useState, useEffect, useCallback } from 'react';
import adminService from '@/services/admin.service';
import { ACCOUNT_STATUS, getAccountStatusMeta } from '@/config/enums';
import { formatDateTime } from '@/utils/formatters';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Avatar, { Menu, Modal } from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/common/EmptyState';
import StatCard, { PageHeader, Spinner } from '@/components/ui/StatCard';

export default function AdminUsers() {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Search, Filter & Pagination States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // Selected User Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch.trim() || undefined,
        role: roleFilter === 'All' ? undefined : roleFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        pageNumber: page,
        pageSize,
      };
      const res = await adminService.getUsers(params);
      setUsers(res?.items || []);
      setTotalCount(res?.totalCount || 0);
      setTotalPages(res?.totalPages || 1);
      setHasPrev(res?.hasPreviousPage || false);
      setHasNext(res?.hasNextPage || false);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page, pageSize, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCopy = (text, id, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép ID người dùng');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async (user, actionType) => {
    const titles = {
      suspend: `Tạm khóa tài khoản: ${user.fullName}`,
      reactivate: `Mở khóa tài khoản: ${user.fullName}`,
      ban: `Cấm vĩnh viễn tài khoản: ${user.fullName}`,
    };
    const descriptions = {
      suspend: 'Vui lòng nêu rõ lý do kỷ luật vi phạm chính sách sàn:',
      reactivate: 'Tài khoản sẽ được chuyển lại trạng thái Đang hoạt động.',
      ban: 'Cấm vĩnh viễn là thao tác không thể hoàn tác. Vui lòng nêu rõ lý do kỷ luật:',
    };

    let reasonInput = '';
    const ok = await confirm({
      title: titles[actionType],
      content: descriptions[actionType],
      confirmText: 'Xác nhận',
      cancelText: 'Hủy bỏ',
      danger: actionType === 'ban',
      requireReason: actionType !== 'reactivate',
      reasonLabel: 'Lý do kỷ luật',
      reasonPlaceholder: 'Nhập lý do chi tiết...',
      defaultReason: 'Vi phạm quy chế sàn TutorHub',
      minReasonLength: 10,
      onConfirmReason: (r) => {
        reasonInput = r;
      },
    });
    if (!ok) return;

    try {
      const reason = reasonInput.trim() || 'Vi phạm quy chế sàn TutorHub';
      if (actionType === 'suspend') {
        await adminService.suspendUser(user.id, reason);
        toast.success(`Đã tạm khóa tài khoản ${user.fullName}`);
      } else if (actionType === 'reactivate') {
        await adminService.reactivateUser(user.id);
        toast.success(`Đã mở lại tài khoản ${user.fullName}`);
      } else if (actionType === 'ban') {
        await adminService.banUser(user.id, reason);
        toast.success(`Đã cấm vĩnh viễn tài khoản ${user.fullName}`);
      }
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Thao tác không thành công.');
    }
  };

  const activeCount = users.filter((u) => u.status === ACCOUNT_STATUS.ACTIVE).length;
  const suspendedCount = users.filter(
    (u) => u.status === ACCOUNT_STATUS.SUSPENDED || u.status === 'Banned'
  ).length;
  const usersWithStrikesCount = users.filter((u) => (u.absentStrikes ?? 0) > 0).length;

  const renderStrikeBadge = (strikes) => {
    const s = Number(strikes || 0);
    if (s === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          0/3 An toàn
        </span>
      );
    }
    if (s === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          1/3 Cảnh báo nhẹ
        </span>
      );
    }
    if (s === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          2/3 Cận đình chỉ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-danger-50 border border-danger-200 text-danger-strong text-[11px] font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-danger" />
        {s}/3 Vi phạm nặng
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý người dùng & Kỷ luật vi phạm sàn"
        subtitle="Theo dõi trạng thái tài khoản, vai trò và xử lý vi phạm quy chế điểm danh (Absent Strike Tracker)"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            icon={<Icon name="refresh" size="sm" />}
          >
            Làm mới danh sách
          </Button>
        }
      />

      {/* Trust & Strike Invariant Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-caption">
        <div className="flex items-start md:items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 mt-0.5 md:mt-0">
            <Icon name="gavel" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Cơ chế giám sát vắng mặt 2 chiều (Absent Strike Tracker)
            </span>
            <p className="text-fg-secondary text-[12px] m-0 leading-relaxed">
              Học viên hoặc gia sư vắng mặt không lý do qua đối soát điểm danh 2 chiều 24h sẽ bị ghi nhận 1 Strike. Đạt <strong>3 Strikes</strong> sẽ tự động chuyển sang diện kiểm soát kỷ luật hoặc tạm khóa tài khoản để bảo vệ quyền lợi cộng đồng.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <Badge variant="holding" size="md">
            Chính sách 3 Strikes
          </Badge>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng hệ thống"
          value={String(totalCount || users.length)}
          mono={false}
          hint="Học viên, Gia sư và Quản trị viên"
          icon={<Icon name="group" size="md" />}
          tone="primary"
        />
        <StatCard
          label="Đang hoạt động (Trang hiện tại)"
          value={String(activeCount)}
          mono={false}
          hint="Tài khoản sẵn sàng giao dịch & học tập"
          icon={<Icon name="check_circle" size="md" />}
          tone="success"
        />
        <StatCard
          label="Người dùng có Strike vi phạm"
          value={String(usersWithStrikesCount)}
          mono={false}
          hint="Cần theo dõi đối soát điểm danh"
          icon={<Icon name="warning" size="md" />}
          tone="holding"
        />
        <StatCard
          label="Đang tạm khóa / Kỷ luật"
          value={String(suspendedCount)}
          mono={false}
          hint="Bị đình chỉ hoạt động do vi phạm"
          icon={<Icon name="lock" size="md" />}
          tone="danger"
        />
      </div>

      {/* Search & Role/Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <Icon name="search" size="sm" />
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            aria-label="Tìm kiếm người dùng"
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-1 cursor-pointer"
            >
              <Icon name="close" size="xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Tabs
            value={roleFilter}
            onChange={(r) => {
              setRoleFilter(r);
              setPage(1);
            }}
            tabs={[
              { key: 'All', label: 'Tất cả vai trò' },
              { key: 'Student', label: 'Học viên' },
              { key: 'Tutor', label: 'Gia sư' },
              { key: 'Admin', label: 'Admin' },
            ]}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="h-9 px-3 text-caption rounded-brand-md border border-border bg-surface text-fg focus:ring-2 focus:ring-brand-primary-600 focus:outline-none cursor-pointer"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Suspended">Tạm khóa</option>
            <option value="Banned">Cấm vĩnh viễn</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <Card padding="none" className="overflow-x-auto shadow-brand-sm border border-border">
        {loading ? (
          <div className="text-center py-16 text-caption text-fg-muted space-y-3">
            <Spinner size="lg" className="mx-auto" />
            <p>Đang tải dữ liệu người dùng...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-14">
            <EmptyState
              icon="person_search"
              title="Không tìm thấy người dùng phù hợp"
              description="Thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc vai trò / trạng thái."
              actionLabel="Đặt lại bộ lọc"
              onAction={() => {
                setSearch('');
                setRoleFilter('All');
                setStatusFilter('All');
                setPage(1);
              }}
            />
          </div>
        ) : (
          <>
            <table className="w-full min-w-[780px] text-caption text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-border">
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Người dùng
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Vai trò
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Số Strike vi phạm
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Trạng thái & Bảo mật
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Ngày tham gia
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const statusMeta = getAccountStatusMeta(u.status);
                  const isCopied = copiedId === u.id;
                  const items = [];
                  if (u.status === ACCOUNT_STATUS.ACTIVE) {
                    items.push({ key: 'suspend', label: 'Tạm khóa tài khoản' });
                    items.push({ key: 'ban', danger: true, label: 'Cấm vĩnh viễn' });
                  } else if (u.status === ACCOUNT_STATUS.SUSPENDED) {
                    items.push({ key: 'reactivate', label: 'Mở khóa hoạt động' });
                    items.push({ key: 'ban', danger: true, label: 'Cấm vĩnh viễn' });
                  } else {
                    items.push({ key: 'reactivate', label: 'Mở khóa lại' });
                  }

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.fullName || u.name}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-fg block truncate">
                                {u.fullName || u.name}
                              </span>
                              <span className="font-mono text-[10px] text-fg-muted font-normal">
                                #{u.id?.substring(0, 8)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(u.id, u.id, e)}
                                title="Sao chép User ID"
                                aria-label={`Sao chép mã người dùng ${u.id}`}
                                className="text-fg-muted hover:text-brand-primary-600 p-0.5 rounded cursor-pointer transition-colors"
                              >
                                <Icon name={isCopied ? 'check' : 'content_copy'} size="xs" />
                              </button>
                            </div>
                            <span className="text-[11px] text-fg-muted font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={u.role === 'Tutor' ? 'primary' : u.role === 'Admin' ? 'danger' : 'info'}
                          size="sm"
                        >
                          {u.role === 'Tutor' ? 'Gia sư' : u.role === 'Admin' ? 'Admin' : 'Học viên'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderStrikeBadge(u.absentStrikes ?? u.strikes ?? 0)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant={statusMeta.color} size="sm">
                            {statusMeta.label}
                          </Badge>
                          {u.isLockedOut && (
                            <Badge variant="danger" size="sm" className="ml-1.5 gap-1">
                              <Icon name="lock" size="xs" /> Khóa đăng nhập
                            </Badge>
                          )}
                          {u.accessFailedCount > 0 && !u.isLockedOut && (
                            <span className="text-[10px] text-amber-700 block font-mono">
                              Sai MK: {u.accessFailedCount} lần
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-fg-secondary whitespace-nowrap font-mono text-[11px]">
                        {u.createdAt ? formatDateTime(u.createdAt, 'DD/MM/YYYY') : u.joinedDate || '—'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            icon={<Icon name="visibility" size="xs" />}
                          >
                            Chi tiết
                          </Button>
                          <Menu
                            items={items.map((it) => ({
                              ...it,
                              onClick: () => handleAction(u, it.key),
                            }))}
                            trigger={
                              <button
                                type="button"
                                aria-label={`Xử lý tài khoản ${u.fullName}`}
                                className="px-2.5 py-1 rounded-brand-sm border border-border hover:bg-neutral-100 text-caption font-semibold text-fg-secondary cursor-pointer transition-colors"
                              >
                                Xử lý
                              </button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
                <span className="text-caption text-fg-muted font-mono">
                  Trang <strong>{page}</strong> / {totalPages} (Tổng {totalCount} người dùng)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<Icon name="chevron_left" size="sm" />}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                    iconRight={<Icon name="chevron_right" size="sm" />}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* User Dossier Quick Inspector Modal */}
      {selectedUser && (
        <Modal
          open={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title="Hồ sơ tài khoản & Lịch sử kỷ luật"
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-fg-muted font-mono">
                ID: {selectedUser.id}
              </span>
              <div className="flex items-center gap-2">
                {selectedUser.status === ACCOUNT_STATUS.ACTIVE ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(selectedUser, 'suspend')}
                      icon={<Icon name="pause_circle" size="xs" />}
                    >
                      Tạm khóa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(selectedUser, 'ban')}
                      icon={<Icon name="block" size="xs" />}
                    >
                      Cấm vĩnh viễn
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(selectedUser, 'reactivate')}
                    icon={<Icon name="check_circle" size="xs" />}
                  >
                    Mở khóa hoạt động
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-caption">
            {/* User Profile Header */}
            <div className="flex items-start gap-4 p-4 rounded-brand-lg bg-neutral-50 border border-border">
              <Avatar
                name={selectedUser.fullName || selectedUser.name}
                size="lg"
                className="w-14 h-14 shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-body-bold text-fg m-0 font-bold">
                    {selectedUser.fullName || selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        selectedUser.role === 'Tutor'
                          ? 'primary'
                          : selectedUser.role === 'Admin'
                            ? 'danger'
                            : 'info'
                      }
                      size="sm"
                    >
                      {selectedUser.role}
                    </Badge>
                    <Badge
                      variant={getAccountStatusMeta(selectedUser.status).color}
                      size="sm"
                    >
                      {getAccountStatusMeta(selectedUser.status).label}
                    </Badge>
                  </div>
                </div>
                <p className="text-[12px] text-fg-muted font-mono m-0">
                  {selectedUser.email}
                </p>
                {selectedUser.phone && (
                  <p className="text-[12px] text-fg-secondary font-mono m-0">
                    SĐT: {selectedUser.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Strike & Attendance Disciplines */}
            <div className="space-y-2">
              <h4 className="font-bold text-fg flex items-center gap-1.5 m-0">
                <Icon name="history_toggle_off" size="xs" className="text-amber-600" />
                Chỉ số đối soát & Vi phạm vắng mặt (Absent Strikes)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-brand-md bg-surface border border-border">
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">
                    Trạng thái Strike hiện tại
                  </span>
                  <div className="mt-1">
                    {renderStrikeBadge(selectedUser.absentStrikes ?? 0)}
                  </div>
                  <span className="text-[10px] text-fg-muted block mt-1">
                    Ngưỡng đình chỉ: 3 Strikes vắng mặt không lý do
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">
                    Lần vắng mặt gần nhất
                  </span>
                  <span className="font-mono text-fg font-medium block mt-1 text-[12px]">
                    {selectedUser.lastAbsentAt
                      ? formatDateTime(selectedUser.lastAbsentAt, 'DD/MM/YYYY HH:mm')
                      : 'Chưa có ghi nhận vi phạm'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & Access Lockout */}
            <div className="space-y-2">
              <h4 className="font-bold text-fg flex items-center gap-1.5 m-0">
                <Icon name="security" size="xs" className="text-brand-primary-600" />
                Bảo mật tài khoản & Đăng nhập
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-brand-md bg-surface border border-border">
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">
                    Khóa tài khoản do sai mật khẩu
                  </span>
                  <span className="font-medium text-fg block mt-1">
                    {selectedUser.isLockedOut ? (
                      <Badge variant="danger" size="sm">Đang bị khóa (Lockout)</Badge>
                    ) : (
                      <span className="text-success-strong font-semibold">Bình thường</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-fg-muted block uppercase font-semibold">
                    Số lần nhập sai mật khẩu liên tiếp
                  </span>
                  <span className="font-mono text-fg font-bold block mt-1">
                    {selectedUser.accessFailedCount || 0} lần
                  </span>
                </div>
              </div>
            </div>

            {selectedUser.tutorApplicationStatus && (
              <div className="space-y-2">
                <h4 className="font-bold text-fg flex items-center gap-1.5 m-0">
                  <Icon name="school" size="xs" className="text-emerald-600" />
                  Hồ sơ ứng tuyển Gia sư
                </h4>
                <div className="p-3.5 rounded-brand-md bg-surface border border-border flex items-center justify-between">
                  <span>Trạng thái thẩm định văn bằng KYC:</span>
                  <Badge variant="primary" size="sm">
                    {selectedUser.tutorApplicationStatus}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
