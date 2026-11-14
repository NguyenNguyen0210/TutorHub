import React, { useEffect, useState } from 'react';
import { elapsedSeconds } from '@/utils/requestFeedback';

export default function PendingLabel({ label = 'Đang xử lý…' }) {
  const [startedAt] = useState(Date.now);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(elapsedSeconds(startedAt)), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  return <span>{label} <span aria-hidden="true" className="whitespace-nowrap tabular-nums">({seconds}s)</span></span>;
}
