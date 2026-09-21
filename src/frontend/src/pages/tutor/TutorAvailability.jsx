import React, { useState, useEffect } from 'react';
import tutorService from '@/services/tutor.service';
import { getDayOfWeekLabel } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { PageHeader, Spinner } from '@/components/ui/StatCard';
import { cn } from '@/lib/cn';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  // If format is HH:mm:ss, trim to HH:mm
  return timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
}

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

  const totalSlots = days.reduce(
    (sum, d) => sum + (d.availableSlots?.length || 0) + (d.bookedSlots?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý thời khóa biểu & Khung giờ rảnh"
        subtitle="Thiết lập lịch rảnh hàng tuần theo múi giờ Asia/Ho_Chi_Minh (UTC+7) để học viên đăng ký xếp lịch"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" size="md" icon={<Icon name="schedule" size="xs" />}>
              Tổng {totalSlots} khung giờ rảnh / tuần
            </Badge>
          </div>
        }
      />

      {/* Invariant Trust Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100">
            <Icon name="info" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Quy tắc khớp giờ giảng dạy (Bẫy kỹ thuật #3)
            </span>
            <p className="text-fg-secondary text-[12px] m-0">
              Giờ học viên đăng ký sẽ tự động đối soát với khung giờ rảnh của bạn theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Khung giờ rảnh
          </span>
          <span className="flex items-center gap-1 text-brand-primary-700">
            <span className="w-2 h-2 rounded-full bg-brand-primary-500" />
            Đã có học viên
          </span>
        </div>
      </div>

      {loading && (
        <Card className="p-12 text-center space-y-3">
          <Spinner size="lg" label="Đang tải thời khóa biểu..." className="mx-auto" />
          <p className="text-caption text-fg-muted font-medium">Đang tải lịch rảnh tuần của bạn...</p>
        </Card>
      )}

      {error && (
        <ErrorState
          error={error}
          title="Không tải được thời khóa biểu"
          onRetry={() => window.location.reload()}
        />
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5">
          {days.map((day, idx) => {
            const dayLabel = getDayOfWeekLabel(day.dayOfWeekName || day.dayOfWeek);
            const slots = day.availableSlots || [];
            const booked = day.bookedSlots || [];
            const hasAnySlots = slots.length > 0 || booked.length > 0;

            return (
              <Card
                key={idx}
                padding="none"
                className={cn(
                  'flex flex-col justify-between min-h-[300px] border transition-all',
                  hasAnySlots
                    ? 'border-border shadow-brand-xs'
                    : 'border-dashed border-border bg-neutral-50/50'
                )}
              >
                <div>
                  {/* Day Header */}
                  <div
                    className={cn(
                      'p-3 border-b flex items-center justify-between',
                      hasAnySlots
                        ? 'bg-neutral-50/80 border-border'
                        : 'bg-transparent border-border/60'
                    )}
                  >
                    <div>
                      <span className="font-bold text-caption text-fg block">{dayLabel}</span>
                      <span className="text-[10px] text-fg-muted font-mono block">
                        {day.dayOfWeek}
                      </span>
                    </div>
                    <Badge
                      variant={hasAnySlots ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {slots.length + booked.length} slot
                    </Badge>
                  </div>

                  {/* Slot Cards List */}
                  <div className="p-2.5 space-y-2">
                    {slots.map((s, sIdx) => (
                      <div
                        key={`avail-${sIdx}`}
                        className="p-2.5 rounded-brand-md border border-emerald-200 bg-emerald-50/70 text-emerald-900 shadow-brand-xs space-y-1"
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-800">
                          <Icon name="schedule" size="xs" className="text-emerald-600" />
                          <span>
                            {formatSlotTime(s.startTime)} - {formatSlotTime(s.endTime)}
                          </span>
                        </div>
                        <Badge variant="success" size="sm" className="text-[10px] py-0 px-1.5">
                          Trống (Rảnh)
                        </Badge>
                      </div>
                    ))}

                    {booked.map((b, bIdx) => (
                      <div
                        key={`booked-${bIdx}`}
                        className="p-2.5 rounded-brand-md border border-brand-primary-200 bg-brand-primary-50/70 text-brand-primary-900 shadow-brand-xs space-y-1"
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-brand-primary-800">
                          <Icon name="event" size="xs" className="text-brand-primary-600" />
                          <span>
                            {formatSlotTime(b.startTime)} - {formatSlotTime(b.endTime)}
                          </span>
                        </div>
                        <Badge variant="info" size="sm" className="text-[10px] py-0 px-1.5">
                          Đã có học viên
                        </Badge>
                      </div>
                    ))}

                    {!hasAnySlots && (
                      <div className="py-8 px-2 text-center space-y-1">
                        <Icon name="event_busy" size="sm" className="text-neutral-300 mx-auto" />
                        <p className="text-[11px] text-fg-muted italic m-0">Không có lịch</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2 border-t border-border/60 text-center">
                  <span className="text-[10px] text-fg-muted font-medium">
                    {hasAnySlots ? `${slots.length} slot khả dụng` : 'Chưa thiết lập'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
