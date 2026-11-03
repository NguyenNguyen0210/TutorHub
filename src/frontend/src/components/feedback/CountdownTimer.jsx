import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { getHoldingSeconds } from '@/utils/checkout';

/** Always derive the remaining hold from the server deadline, even after tab sleep. */
export default function CountdownTimer({ expiresAt, expired = false, onExpire, onReorderPath = '/tutors' }) {
  const [timeLeft, setTimeLeft] = useState(() => getHoldingSeconds(expiresAt));
  const onExpireRef = useRef(onExpire);
  const notifiedRef = useRef(false);

  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    notifiedRef.current = false;
    const sync = () => {
      const remaining = getHoldingSeconds(expiresAt);
      setTimeLeft(remaining);
      if (remaining === 0 && !notifiedRef.current) {
        notifiedRef.current = true;
        onExpireRef.current?.();
      }
    };
    sync();
    const timer = setInterval(sync, 1000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [expiresAt]);

  const isExpired = expired || timeLeft === 0;
  const remaining = isExpired ? 0 : timeLeft;
  const formattedTime = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const percent = Math.min(100, Math.max(0, (remaining / 900) * 100));
  const urgency = isExpired ? 'expired' : remaining < 120 ? 'emergency' : remaining < 300 ? 'caution' : 'calm';
  const danger = urgency === 'emergency' || isExpired;

  return (
    <div
      data-urgency={urgency}
      className={`space-y-2 rounded-brand-md border px-4 py-3 ${danger ? 'border-danger/30 bg-danger-subtle text-danger-strong' : 'border-holding/30 bg-holding-subtle text-holding-strong'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-sans text-body-reg font-medium tracking-normal">
          <Icon name="hourglass_top" size="sm" />
          {isExpired ? 'Đơn giữ chỗ đã hết hạn' : 'Thời gian giữ chỗ còn lại'}
        </span>
        <span role="timer" aria-label="Thời gian giữ chỗ còn lại" aria-live="off" className="shrink-0 font-mono text-xl font-bold tabular-nums">
          {formattedTime}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-pill bg-neutral-200" aria-hidden="true">
        <div className={`h-full rounded-pill transition-[width] duration-1000 ${danger ? 'bg-danger' : 'bg-holding'}`} style={{ width: `${percent}%` }} />
      </div>
      {isExpired && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 text-caption">
          <p>Vui lòng chọn lại gói học để tạo đơn giữ chỗ mới.</p>
          <Link to={onReorderPath} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-primary-700 underline underline-offset-4">
            Tạo lại đơn hàng <Icon name="arrow_forward" size="xs" />
          </Link>
        </div>
      )}
    </div>
  );
}
