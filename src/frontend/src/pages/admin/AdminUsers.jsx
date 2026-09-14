import React from 'react';

export default function AdminUsers() {
  const users = [
    {
      id: 'u-1',
      name: 'Nguyễn Văn An',
      email: 'tutor.an@tutorhub.com',
      role: 'Tutor',
      strikes: 0,
      status: 'Active',
      joinedDate: '01/08/2026',
    },
    {
      id: 'u-2',
      name: 'Phạm Minh Tuấn',
      email: 'student.tuan@tutorhub.com',
      role: 'Student',
      strikes: 0,
      status: 'Active',
      joinedDate: '15/08/2026',
    },
    {
      id: 'u-3',
      name: 'Trần Văn Bùng',
      email: 'student.bad@tutorhub.com',
      role: 'Student',
      strikes: 2,
      status: 'Suspended (7 Days)',
      joinedDate: '10/07/2026',
    },
    {
      id: 'u-4',
      name: 'Trần Thị Bích',
      email: 'tutor.bich@tutorhub.com',
      role: 'Tutor',
      strikes: 0,
      status: 'Active',
      joinedDate: '05/08/2026',
    }
  ];

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
          <span className="text-2xl font-extrabold text-white font-mono">1.248</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400 block">Đang Hoạt Động</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">1.215</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400 block">Đang Tạm Khóa (Suspended)</span>
          <span className="text-2xl font-extrabold text-rose-400 font-mono">28</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 overflow-x-auto">
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
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-700/30">
                <td className="p-3">
                  <span className="font-bold text-white block">{u.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === 'Tutor' ? 'bg-brand-indigo-500/20 text-brand-indigo-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`font-mono font-bold ${u.strikes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {u.strikes} / 3 Strikes
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-slate-400">{u.joinedDate}</td>
                <td className="p-3 text-right">
                  <button type="button" className="text-xs font-bold text-brand-indigo-400 hover:underline">
                    Chi Tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
