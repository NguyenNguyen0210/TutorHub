import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

/**
 * DESIGN.md §3.1: Holding Countdown Timer (Bộ Đếm Ngược Giữ Chỗ 15 Phút)
 *
 * 3 Trạng thái hiển thị (Urgency States):
 * - Calm (> 5 phút): bg-amber-50, border-amber-200, text-amber-900.
 * - Caution (2 - 5 phút): bg-amber-100, border-amber-300, thanh tiến trình màu cam đậm.
 * - Emergency (< 2 phút): bg-rose-50, border-rose-300, text-rose-700, nhấp nháy pulse.
 * - Expired (= 00:00): Khóa CTA thanh toán, hiển thị thông báo hết hạn và nút Tạo lại đơn hàng.
 *
 * Tự động đồng bộ lại khi chuyển tab qua `visibilitychange`.
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

  // 3 Urgency states theo DESIGN §3.1
  let urgency = 'calm';
  let containerStyle = 'bg-amber-50/80 border-amber-200 text-amber-900';
  let progressBarStyle = 'bg-amber-500';
  let timeStyle = 'text-amber-950 font-bold';

  if (isExpired) {
    urgency = 'expired';
    containerStyle = 'bg-slate-100 border-slate-300 text-slate-600';
    progressBarStyle = 'bg-slate-400';
    timeStyle = 'text-rose-600 font-extrabold';
  } else if (timeLeft < 120) {
    // < 2 phút: Emergency
    urgency = 'emergency';
    containerStyle = 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse';
    progressBarStyle = 'bg-rose-600';
    timeStyle = 'text-rose-700 font-extrabold animate-pulse';
  } else if (timeLeft < 300) {
    // 2 - 5 phút: Caution
    urgency = 'caution';
    containerStyle = 'bg-amber-100 border-amber-300 text-amber-950';
    progressBarStyle = 'bg-amber-600';
    timeStyle = 'text-amber-900 font-extrabold';
  }

  return (
    <div
      className={`rounded-3xl border-2 p-5 sm:p-6 shadow-sm transition-all space-y-3.5 ${containerStyle}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm tracking-wide uppercase">
          <span className="text-base" aria-hidden="true">
            {isExpired ? '⚠️' : '⏳'}
          </span>
          <span>
            {isExpired ? 'ĐƠN GIỮ CHỖ ĐÃ HẾT HẠN (15 PHÚT)' : 'ĐANG GIỮ CHỖ THANH TOÁN (15 PHÚT)'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-xl sm:text-2xl font-mono tracking-tight ${timeStyle}`}>
            [ {formattedTime} ]
          </span>
          <span className="text-xs font-medium opacity-80">
            {isExpired ? 'Đã kết thúc' : 'Còn lại'}
          </span>
        </div>
      </div>

      {/* Linear Progress Bar §3.1 */}
      <div className="space-y-1">
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressBarStyle}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono opacity-75">
          <span>{isExpired ? '0% thời gian giữ chỗ' : `(${percent}% thời gian giữ chỗ còn lại)`}</span>
          <span>Tổng hạn: 15:00</span>
        </div>
      </div>

      {/* Guidance Message and Expiry Actions */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
        <p className="m-0">
          {isExpired
            ? 'Đơn đặt chỗ đã hết hạn giữ vé 15 phút. Suất học của bạn đã được giải phóng để đảm bảo công bằng cho các học viên khác.'
            : 'Vui lòng hoàn tất thanh toán VNPay trước khi hết hạn để xác nhận hợp đồng.'}
        </p>

        {isExpired && (
          <Link
            to={onReorderPath}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Tạo Lại Đơn Hàng Mới
          </Link>
        )}
      </div>
    </div>
  );
}
