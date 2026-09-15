import React from 'react';
import { Outlet } from 'react-router-dom';
import UnifiedNavbar from '@/components/layout/UnifiedNavbar';

export default function TutorLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 antialiased font-sans">
      {/* Unified Persistent Navbar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
