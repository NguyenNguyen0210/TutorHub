import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicTopbar from '@/components/layout/PublicTopbar';
import PublicFooter from '@/components/layout/PublicFooter';
import MobileFloatingDock from '@/components/layout/MobileFloatingDock';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg antialiased pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
      <PublicTopbar />

      <main className="flex-1 w-full relative z-0 flex flex-col">
        <Outlet />
      </main>

      <PublicFooter />

      <MobileFloatingDock />
    </div>
  );
}
