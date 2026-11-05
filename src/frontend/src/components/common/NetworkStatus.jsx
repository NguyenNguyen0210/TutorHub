import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/Button';

/** Connection notice only: never reloads or replays a pending action. */
export default function NetworkStatus() {
  const [offline, setOffline] = useState(() => navigator.onLine === false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const update = () => {
      setOffline(navigator.onLine === false);
      setDismissed(false);
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline || dismissed) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[60] flex gap-3 rounded-2xl border border-border bg-surface p-4 shadow-brand-md sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary"><Icon name="wifi_off" size="md" /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-fg">Bạn đang ngoại tuyến</p><p className="mt-1 text-xs leading-5 text-fg-secondary">Vui lòng kết nối mạng để tải nội dung hoặc gửi thông tin.</p></div>
      <IconButton label="Ẩn thông báo kết nối" className="shrink-0" icon={<Icon name="close" size="sm" />} onClick={() => setDismissed(true)} />
    </div>
  );
}
