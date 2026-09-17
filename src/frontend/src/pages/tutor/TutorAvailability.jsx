import React, { useState, useEffect } from 'react';
import tutorService from '@/services/tutor.service';
import { getDayOfWeekLabel } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TutorAvailability() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAvailability() {
      try {
        setLoading(true);
        const rawSlots = await tutorService.getMyAvailabilitySlots();
        if (isMounted) {
          const slotList = Array.isArray(rawSlots) ? rawSlots : [];
          const groupedDays = DAYS_ORDER.map((dayName) => ({
            dayOfWeek: dayName,
            dayOfWeekName: dayName,
            availableSlots: slotList
              .filter((s) => s.dayOfWeek === dayName && s.isActive)
              .map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
            bookedSlots: [],
          }));
          setDays(groupedDays);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Thời Khóa Biểu & Khung Giờ Rảnh
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Thiết lập lịch rảnh hàng tuần theo múi giờ Asia/Ho_Chi_Minh (UTC+7)
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-500 text-xs">
          <span className="material-symbols-outlined animate-spin text-2xl text-brand-indigo-600 block mb-2">
            sync
          </span>
          Đang tải lịch rảnh tuần...
        </div>
      )}

      {error && (
        <ErrorState
          error={error}
          title="Không tải được thời khóa biểu"
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Weekly Matrix Calendar Grid (7 Columns) */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day, idx) => {
            const dayLabel = getDayOfWeekLabel(day.dayOfWeekName || day.dayOfWeek);
            const slots = day.availableSlots || [];
            const booked = day.bookedSlots || [];

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-border-light shadow-xs space-y-3 flex flex-col justify-between min-h-[260px]"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-900">{dayLabel}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {slots.length + booked.length} slot
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    {slots.map((s, sIdx) => (
                      <div
                        key={`avail-${sIdx}`}
                        className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-xs font-semibold"
                      >
                        <div className="font-monospace-num text-[11px]">
                          {s.startTime} - {s.endTime}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                          ✓ Trống (Rảnh)
                        </span>
                      </div>
                    ))}

                    {booked.map((b, bIdx) => (
                      <div
                        key={`booked-${bIdx}`}
                        className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs font-semibold"
                      >
                        <div className="font-monospace-num text-[11px]">
                          {b.startTime} - {b.endTime}
                        </div>
                        <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
                          Đã có học viên
                        </span>
                      </div>
                    ))}

                    {slots.length === 0 && booked.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-6">
                        Chưa có slot
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
