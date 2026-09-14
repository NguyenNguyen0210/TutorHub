import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { SafetyCertificateOutlined } from '@ant-design/icons';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Logo */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 text-decoration-none">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <SafetyCertificateOutlined className="text-2xl" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight block leading-tight">
              Tutor<span className="text-indigo-600">Hub</span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Bảo Chứng Học Phí 2 Chiều
            </span>
          </div>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md glass-surface rounded-2xl p-6 lg:p-8 shadow-xl border border-slate-200/80">
        <Outlet />
      </div>

      {/* Bottom info */}
      <p className="mt-6 text-xs text-slate-500 text-center max-w-xs">
        Mọi giao dịch thanh toán và dữ liệu học tập đều được bảo vệ và mã hóa theo tiêu chuẩn Escrow.
      </p>
    </div>
  );
}
