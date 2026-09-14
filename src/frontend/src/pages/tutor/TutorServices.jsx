import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function TutorServices() {
  const packages = [
    {
      id: 'pkg-1',
      name: 'Luyện thi THPT Toán 10 Buổi',
      sessionCount: 10,
      duration: 60,
      price: 2000000,
      unitPrice: 200000,
      mode: 'Online + Offline',
      activeStudents: 3,
      revenue: 6000000,
      status: 'Active',
    },
    {
      id: 'pkg-2',
      name: 'Toán Nâng Cao 15 Buổi Chuyên Đề 9+',
      sessionCount: 15,
      duration: 90,
      price: 3500000,
      unitPrice: 233333,
      mode: 'Online',
      activeStudents: 1,
      revenue: 3500000,
      status: 'Active',
    },
    {
      id: 'pkg-3',
      name: 'Luyện Đề Cấp Tốc 5 Buổi Trọng Tâm',
      sessionCount: 5,
      duration: 60,
      price: 1200000,
      unitPrice: 240000,
      mode: 'Online',
      activeStudents: 0,
      revenue: 0,
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Danh Mục Gói Dịch Vụ Giảng Dạy
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Tạo và điều chỉnh các gói học theo số buổi, thời lượng và cam kết đầu ra bảo chứng Escrow
          </p>
        </div>

        <button
          type="button"
          onClick={() => message.info('Mở modal tạo gói dịch vụ mới')}
          className="px-4 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Tạo Gói Dịch Vụ Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-6 rounded-3xl bg-white border border-border-light shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-financial-available text-[10px] font-extrabold uppercase border border-emerald-200">
                  Đang Mở Tuyển Sinh
                </span>
                <span className="text-xs font-bold text-brand-indigo-600 font-monospace-num">
                  {pkg.sessionCount} buổi
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>

              <div className="space-y-1.5 text-xs text-text-secondary pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Thời lượng buổi:</span>
                  <span className="font-bold text-slate-800">{pkg.duration} phút</span>
                </div>
                <div className="flex justify-between">
                  <span>Hình thức:</span>
                  <span className="font-bold text-slate-800">{pkg.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Học viên đang theo học:</span>
                  <span className="font-bold text-slate-800">{pkg.activeStudents} bạn</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-light space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-text-muted">Học phí trọn gói:</span>
                <span className="text-xl font-extrabold text-financial-available font-monospace-num">
                  {formatCurrency(pkg.price)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Chỉnh Sửa
                </button>
                <button
                  type="button"
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                  title="Ẩn gói"
                >
                  <span className="material-symbols-outlined text-base">visibility_off</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
