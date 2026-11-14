import React, { useEffect, useState } from 'react';
import { REQUEST_FEEDBACK_EVENT, elapsedSeconds } from '@/utils/requestFeedback';
import { userFacingError } from '@/utils/userFacingError';
import { useAuthStore } from '@/store/authStore';

export default function RequestFeedback() {
  const userId = useAuthStore(state => state.user?.id ?? null);
  const [pending, setPending] = useState({});
  const [failure, setFailure] = useState(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { setPending({}); setFailure(null); }, [userId]);
  useEffect(() => {
    const receive = ({ detail }) => {
      if (detail.userId !== (useAuthStore.getState().user?.id ?? null)) return;
      if (detail.status === 'pending') {
        setFailure(null);
        setPending(previous => ({ ...previous, [detail.id]: detail }));
      } else {
        setPending(previous => { const next = { ...previous }; delete next[detail.id]; return next; });
        if (detail.status === 'error') setFailure(userFacingError(detail.error));
      }
    };
    window.addEventListener(REQUEST_FEEDBACK_EVENT, receive);
    return () => window.removeEventListener(REQUEST_FEEDBACK_EVENT, receive);
  }, []);
  const first = Object.values(pending).sort((a, b) => a.startedAt - b.startedAt)[0];
  useEffect(() => {
    if (!first) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [first]);
  const seconds = first ? elapsedSeconds(first.startedAt, now) : 0;
  if (!failure && (!first || seconds < 3)) return null;
  return <aside className="fixed bottom-6 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-border bg-surface p-4 text-sm text-fg shadow-brand-lg">
    {failure ? <div role="alert" className="flex items-start gap-4"><p className="flex-1">{failure}</p><button type="button" onClick={() => setFailure(null)} className="min-h-11 shrink-0 rounded px-2 font-semibold text-primary">Đóng</button></div>
      : <div role="status"><p className="font-semibold">Đang xử lý… <span aria-hidden="true" className="tabular-nums">Đã chờ {seconds} giây.</span></p><p className="mt-1 text-fg-secondary">Vui lòng chờ kết quả, không gửi lại yêu cầu.</p></div>}
  </aside>;
}
