import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface-canvas-light p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-financial-available/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl z-10 flex items-center justify-center">
        <Outlet />
      </div>

      {/* Bottom info */}
      <p className="mt-8 text-xs text-text-muted text-center max-w-md">
        © 2026 TutorHub Vietnam. Mọi giao dịch thanh toán và dữ liệu học tập đều được bảo chứng và lưu vết bất biến trên hệ thống Escrow.
      </p>
    </div>
  );
}
