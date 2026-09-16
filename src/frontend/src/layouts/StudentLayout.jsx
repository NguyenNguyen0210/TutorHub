import React from 'react';
import { Outlet } from 'react-router-dom';
import UnifiedNavbar from '@/components/layout/UnifiedNavbar';

export default function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 antialiased font-sans">
      {/* Unified Persistent Navbar */}
      <UnifiedNavbar />

      {/* Main Content — pb-28 ensures mobile floating dock does not obscure buttons */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
