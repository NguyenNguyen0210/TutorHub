import React, { useState, useEffect } from 'react';
import adminService from '@/services/admin.service';
import { ACCOUNT_STATUS, getAccountStatusMeta } from '@/config/enums';
import { formatDateTime } from '@/utils/formatters';
import { message, Modal, Dropdown } from 'antd';

/** Map màu enum → class Tailwind (bảng nền tối của Admin). */
const STATUS_BADGE_CLASS = {
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-rose-500/20 text-rose-400',
  default: 'bg-slate-500/20 text-slate-300',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ pageSize: 50 });
      setUsers(res?.items || []);
      setTotalCount(res?.totalCount || 0);
    } catch (err) {
      message.error(err?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (user, actionType) => {
    const titles = {
      suspend: `Tạm khóa tài khoản: ${user.fullName}`,
      reactivate: `Mở khóa tài khoản: ${user.fullName}`,
      ban: `Cấm vĩnh viễn tài khoản: ${user.fullName}`,
    };

    let reasonInput = '';

    Modal.confirm({
      title: titles[actionType],
      content: (
        <div className="space-y-3 pt-2 text-xs">
          <p className="text-slate-600 m-0">
            {actionType === 'reactivate'
              ? 'Tài khoản sẽ được chuyển lại trạng thái Đang hoạt động.'
              : 'Vui lòng nêu rõ lý do kỷ luật vi phạm chính sách sàn:'}
          </p>
          {actionType !== 'reactivate' && (
            <textarea
              rows={3}
              defaultValue="Vi phạm quy chế sàn TutorHub"
              onChange={(e) => {
                reasonInput = e.target.value;
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
              placeholder="Nhập lý do chi tiết..."
            />
          )}
        </div>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy bỏ',
      okButtonProps: { danger: actionType === 'ban' },
      onOk: async () => {
        try {
          const reason = reasonInput.trim() || 'Vi phạm quy chế sàn TutorHub';
          if (actionType === 'suspend') {
            await adminService.suspendUser(user.id, reason);
            message.success(`Đã tạm khóa tài khoản ${user.fullName}`);
          } else if (actionType === 'reactivate') {
            await adminService.reactivateUser(user.id);
            message.success(`Đã mở lại tài khoản ${user.fullName}`);
          } else if (actionType === 'ban') {
            await adminService.banUser(user.id, reason);
            message.success(`Đã cấm vĩnh viễn tài khoản ${user.fullName}`);
          }
          await fetchUsers();
        } catch (err) {
          message.error(err?.message || 'Thao tác không thành công.');
        }
      },
    });
  };

  const activeCount = users.filter((u) => u.status === ACCOUNT_STATUS.ACTIVE).length;
  const suspendedCount = users.filter((u) => u.status === ACCOUNT_STATUS.SUSPENDED).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Quản Lý Người Dùng & Kỷ Luật Vi Phạm Sàn
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Theo dõi trạng thái tài khoản, vai trò và xử lý vi phạm quy chế điểm danh (Absent Strike Tracker)
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400 block">Tổng Người Dùng</span>
          <span className="text-2xl font-extrabold text-white font-mono">{totalCount || users.length}</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400 block">Đang Hoạt Động</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">{activeCount}</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400 block">Đang Tạm Khóa (Suspended)</span>
          <span className="text-2xl font-extrabold text-rose-400 font-mono">{suspendedCount}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <span className="material-symbols-outlined animate-spin text-xl block mb-1">sync</span>
            Đang tải dữ liệu người dùng...
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 font-bold border-b border-slate-700 pb-2">
              <tr>
                <th className="p-3">Người dùng</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Số Strike vi phạm</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Ngày tham gia</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {users.map((u) => {
                const statusMeta = getAccountStatusMeta(u.status);
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
                  <tr key={u.id} className="hover:bg-slate-700/30">
                    <td className="p-3">
                      <span className="font-bold text-white block">{u.fullName || u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'Tutor'
                            ? 'bg-brand-indigo-500/20 text-brand-indigo-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-mono font-bold ${
                          (u.absentStrikes ?? u.strikes ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {u.absentStrikes ?? u.strikes ?? 0} / 3 Strikes
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          STATUS_BADGE_CLASS[statusMeta.color] ?? STATUS_BADGE_CLASS.default
                        }`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {u.createdAt ? formatDateTime(u.createdAt, 'DD/MM/YYYY') : u.joinedDate || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <Dropdown
                        menu={{
                          items,
                          onClick: ({ key }) => handleAction(u, key),
                        }}
                        trigger={['click']}
                      >
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-slate-600 hover:bg-slate-700 text-xs font-bold text-slate-300"
                        >
                          Xử lý ▼
                        </button>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
