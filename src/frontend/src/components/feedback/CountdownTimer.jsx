import React, { useState, useEffect } from 'react';
import { Progress, Tag } from 'antd';
import { ClockCircleFilled, AlertFilled } from '@ant-design/icons';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15 * 60); // 15 phút (900s)

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percent = Math.min(100, Math.round((timeLeft / totalDuration) * 100));

  // Xác định màu sắc động: > 5 phút (Xanh) -> 2-5 phút (Vàng) -> < 2 phút (Đỏ nhấp nháy)
  let statusColor = '#10B981'; // Emerald
  let bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let isPulsing = false;

  if (timeLeft <= 0) {
    statusColor = '#64748B';
    bgClass = 'bg-slate-100 border-slate-300 text-slate-500';
  } else if (timeLeft < 120) {
    statusColor = '#EF4444'; // Red
    bgClass = 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse';
    isPulsing = true;
  } else if (timeLeft < 300) {
    statusColor = '#F59E0B'; // Amber
    bgClass = 'bg-amber-50 border-amber-300 text-amber-800';
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all ${bgClass}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs">
          {isPulsing ? (
            <AlertFilled className="text-rose-500 text-xl" />
          ) : (
            <ClockCircleFilled style={{ color: statusColor, fontSize: '20px' }} />
          )}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider">
            {timeLeft > 0 ? 'Thời Gian Giữ Chỗ Tạm Thời' : 'Đơn Giữ Chỗ Đã Hết Hạn'}
          </div>
          <p className="m-0 text-xs opacity-80 mt-0.5">
            {timeLeft > 0
              ? 'Lịch học của bạn đang được khóa trên hệ thống. Hãy hoàn tất thanh toán trước khi hết giờ.'
              : 'Thời gian 15 phút đã kết thúc. Slot học đã được giải phóng cho học viên khác.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight leading-none">
            {formattedTime}
          </div>
          <div className="text-[10px] opacity-70 mt-1 uppercase">Phút : Giây</div>
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
          <Progress
            type="circle"
            percent={percent}
            size={44}
            strokeColor={statusColor}
            showInfo={false}
            strokeWidth={10}
          />
        </div>
      </div>
    </div>
  );
}
