import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

/**
 * DESIGN.md v2 §7.1: Holding Countdown Timer (Bộ Đếm Ngược Giữ Chỗ 15 Phút)
 *
 * 3 Trạng thái hiển thị (Urgency States):
 * - Calm (> 5 phút): holding-subtle, viền holding/30.
 * - Caution (2 - 5 phút): holding-subtle đậm, viền holding.
 * - Emergency (< 2 phút): danger-subtle, viền danger, nhấp nháy pulse.
 * - Expired (= 00:00): Khóa CTA thanh toán, hiển thị thông báo hết hạn và nút Tạo lại đơn hàng.
 *
 * Deadline lấy từ `holdingExpiresAt` của server. Tự đồng bộ lại qua `visibilitychange`.
 */
export default function CountdownTimer({
  expiresAt,
  initialSeconds = 15 * 60,
  onExpire,
  onReorderPath = '/tutors',
}) {
  const computeDiff = useCallback(() => {
    if (expiresAt) {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((targetTime - now) / 1000));
    }
    return initialSeconds;
  }, [expiresAt, initialSeconds]);

  const [timeLeft, setTimeLeft] = useState(computeDiff);
  const totalDuration = 15 * 60; // 900 giây chuẩn 15 phút

  useEffect(() => {
    setTimeLeft(computeDiff());

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const diff = computeDiff();
        setTimeLeft(diff);
        if (diff === 0 && onExpire) {
          onExpire();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [computeDiff, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percent = Math.min(100, Math.max(0, Math.round((timeLeft / totalDuration) * 100)));

  const isExpired = timeLeft <= 0;

  // 3 Urgency states theo DESIGN v2 §7.1
  let urgency = 'calm';
  let containerStyle = 'bg-holding-subtle border-holding/30 text-holding-strong';
  let progressBarStyle = 'bg-holding';
  let timeStyle = 'text-holding-strong font-bold';

  if (isExpired) {
    urgency = 'expired';
    containerStyle = 'bg-neutral-100 border-border text-fg-muted';
    progressBarStyle = 'bg-neutral-400';
    timeStyle = 'text-danger-strong font-extrabold';
  } else if (timeLeft < 120) {
    // < 2 phút: Emergency
    urgency = 'emergency';
    containerStyle = 'bg-danger-subtle border-danger text-danger-strong animate-pulse';
    progressBarStyle = 'bg-danger';
    timeStyle = 'text-danger-strong font-extrabold animate-pulse';
  } else if (timeLeft < 300) {
    // 2 - 5 phút: Caution
    urgency = 'caution';
    containerStyle = 'bg-holding-subtle border-holding text-holding-strong';
    progressBarStyle = 'bg-holding-strong';
    timeStyle = 'text-holding-strong font-extrabold';
  }

  return (
    <div
      data-urgency={urgency}
      className={`rounded-brand-lg border-2 p-5 sm:p-6 shadow-brand-sm transition-all space-y-3.5 ${containerStyle}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-extrabold text-caption sm:text-body-reg tracking-wide uppercase">
          <Icon name="hourglass_top" size="sm" aria-hidden="true" />
          <span>
            {isExpired ? 'Đơn giữ chỗ đã hết hạn (15 phút)' : 'Đang giữ chỗ thanh toán (15 phút)'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-xl sm:text-2xl font-mono tracking-tight ${timeStyle}`}>
            [ {formattedTime} ]
          </span>
          <span className="text-caption font-medium opacity-80">
            {isExpired ? 'Đã kết thúc' : 'Còn lại'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="w-full bg-neutral-200 rounded-pill h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-pill ${progressBarStyle}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono opacity-75">
          <span>{isExpired ? '0% thời gian giữ chỗ' : `(${percent}% thời gian giữ chỗ còn lại)`}</span>
          <span>Tổng hạn: 15:00</span>
        </div>
      </div>

      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption leading-relaxed">
        <p className="m-0">
          {isExpired
            ? 'Đơn đặt chỗ đã hết hạn giữ chỗ 15 phút. Suất học của bạn đã được giải phóng để đảm bảo công bằng cho các học viên khác.'
            : 'Vui lòng hoàn tất thanh toán VNPay trước khi hết hạn để xác nhận hợp đồng.'}
        </p>

        {isExpired && (
          <Link
            to={onReorderPath}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-brand-md bg-brand-primary-600 hover:bg-brand-primary-700 text-white font-semibold text-caption shrink-0 transition-colors shadow-brand-sm"
          >
            <Icon name="refresh" size="sm" />
            Tạo lại đơn hàng mới
          </Link>
        )}
      </div>
    </div>
  );
}
