import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Callout from '@/components/ui/Callout';
import { tutorService } from '@/services/tutor.service';
import { SectionShell } from './SectionShell';

const SHIFTS = [
  { key: 'morning', label: 'Sáng', period: '08:00 - 12:00' },
  { key: 'afternoon', label: 'Chiều', period: '13:30 - 17:30' },
  { key: 'evening', label: 'Tối', period: '18:30 - 21:30' },
];

/**
 * Xác định trạng thái của từng ca học trong ngày (Đã qua / Kín lịch / Trống lịch)
 */
function getShiftState(day, shiftKey) {
  if (day.isPast) {
    return { status: 'past', label: 'Đã qua' };
  }

  // Kiểm tra xem có buổi học nào rơi vào khung giờ của ca này không
  const busySlot = day.slots.find((slot) => {
    const hour = dayjs(slot.startAt).hour();
    if (shiftKey === 'morning') return hour < 12;
    if (shiftKey === 'afternoon') return hour >= 12 && hour < 18;
    if (shiftKey === 'evening') return hour >= 18;
    return false;
  });

  if (busySlot) {
    const startTime = dayjs(busySlot.startAt).format('HH:mm');
    const endTime = dayjs(busySlot.endAt).format('HH:mm');
    return {
      status: 'busy',
      label: 'Kín lịch',
      time: `${startTime} - ${endTime}`,
    };
  }

  return { status: 'available', label: 'Trống lịch' };
}

/**
 * ProfileScheduleExplainer — Thời khóa biểu & Lịch nhận lớp của gia sư.
 * Đã chuẩn hóa rút gọn tên Chủ nhật thành CN (chống rớt dòng, thẳng hàng 100%),
 * chia rõ 3 ca Sáng - Chiều - Tối, làm nhẹ nút nhắn tin và lược bỏ quy trình trùng lặp.
 */
export default function ProfileScheduleExplainer({ tutorId }) {
  const [busySlots, setBusySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityUnavailable, setAvailabilityUnavailable] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!tutorId) return;
    let cancelled = false;

    async function fetchSlots() {
      try {
        setLoading(true);
        setError(null);
        setAvailabilityUnavailable(false);

        const from = dayjs().startOf('day').toISOString();
        const to = dayjs().add(28, 'day').endOf('day').toISOString();

        const slots = await tutorService.getTutorBusySlots(tutorId, { from, to });
        if (!cancelled) {
          setBusySlots(Array.isArray(slots) ? slots : []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.status === 404 || err?.kind === 'notFound') {
            setAvailabilityUnavailable(true);
            setError(null);
          } else {
            setError('Không thể tải lịch dạy lúc này. Bạn vẫn có thể nhắn tin để trao đổi thời gian học.');
          }
          setLoading(false);
        }
      }
    }

    fetchSlots();

    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const days = useMemo(() => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = today.add(diffToMonday + weekOffset * 7, 'day').startOf('day');

    return Array.from({ length: 7 }, (_, i) => {
      const d = monday.add(i, 'day');
      const isToday = d.isSame(today, 'day');
      const isPast = d.isBefore(today, 'day');

      const daySlots = busySlots
        .filter((slot) => dayjs(slot.startAt).isSame(d, 'day'))
        .sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf());

      return {
        date: d,
        // Rút gọn Chủ nhật thành CN để không bị gãy 2 dòng và lệch ô với Thứ 7
        dayName: i === 6 ? 'CN' : `Thứ ${i + 2}`,
        formattedDate: d.format('DD/MM'),
        isToday,
        isPast,
        slots: daySlots,
      };
    });
  }, [busySlots, weekOffset]);

  const weekLabel = useMemo(() => {
    if (days.length < 7) return '';
    return `${days[0].formattedDate} — ${days[6].formattedDate}`;
  }, [days]);

  return (
    <SectionShell
      id="lich-day"
      title="Lịch dạy & thời khóa biểu"
      icon="calendar_month"
      className="mt-8"
    >
      <Card padding="lg" className="space-y-6 rounded-2xl border border-border shadow-sm">
        {/* Calendar Header with Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-body-reg font-bold text-slate-900 flex items-center gap-2">
              <span>Lịch nhận lớp trong tuần</span>
              {weekOffset === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                  Tuần này
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-fg-muted">
                  +{weekOffset} tuần
                </span>
              )}
            </h3>
            <p className="text-caption text-fg-muted mt-0.5">
              Khung giờ gia sư sẵn sàng nhận lớp và các ca đã có lịch học cố định
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="md"
              variant="outline"
              onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
              disabled={weekOffset <= 0}
              aria-label="Tuần trước"
            >
              <Icon name="chevron_left" size="sm" />
            </Button>
            <span className="text-caption font-semibold font-mono text-fg px-2 tabular-nums">
              {weekLabel}
            </span>
            <Button
              size="md"
              variant="outline"
              onClick={() => setWeekOffset((prev) => Math.min(3, prev + 1))}
              disabled={weekOffset >= 3}
              aria-label="Tuần tới"
            >
              <Icon name="chevron_right" size="sm" />
            </Button>
          </div>
        </div>

        {/* 7-Day Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 py-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : availabilityUnavailable ? (
          <Callout variant="neutral" title="Gia sư chưa công khai lịch bận">
            Hãy nhắn tin trực tiếp để thống nhất khung giờ phù hợp trước khi đăng ký gói học.
          </Callout>
        ) : error ? (
          <Callout variant="warning" title="Chưa tải được lịch dạy">
            {error}
          </Callout>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 items-stretch">
            {days.map((day) => (
              <div
                key={day.dayName}
                className={`p-2.5 rounded-xl border flex flex-col transition-colors ${
                  day.isToday
                    ? 'border-brand-primary-500 bg-brand-primary-50/20 shadow-xs'
                    : 'border-border bg-neutral-50/60'
                }`}
              >
                {/* Header ngày: Đồng đều không rớt dòng */}
                <div className="flex items-center justify-between pb-1.5 border-b border-border/70 mb-2">
                  <span
                    className={`text-[12px] font-bold ${
                      day.isToday ? 'text-brand-primary-700' : 'text-slate-900'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-[11px] font-mono text-fg-muted tabular-nums">
                    {day.formattedDate}
                  </span>
                </div>

                {/* 3 ca học rõ ràng: Sáng, Chiều, Tối */}
                <div className="flex-1 flex flex-col gap-1.5 justify-between">
                  {SHIFTS.map((shift) => {
                    const state = getShiftState(day, shift.key);

                    if (state.status === 'past') {
                      return (
                        <div
                          key={shift.key}
                          className="py-1.5 px-1 rounded-lg bg-neutral-100/70 text-neutral-400 text-[11px] font-medium text-center"
                          title={`Ca ${shift.label}: Đã qua`}
                        >
                          {shift.label}
                        </div>
                      );
                    }

                    if (state.status === 'busy') {
                      return (
                        <div
                          key={shift.key}
                          className="py-1.5 px-1 rounded-lg bg-amber-50 border border-amber-200/90 text-[11px] font-bold text-amber-900 text-center"
                          title={`Ca ${shift.label} (${state.time}): Gia sư đã có lớp học`}
                        >
                          {shift.label}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={shift.key}
                        className="py-1.5 px-1 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 text-center transition-colors hover:bg-emerald-100/80"
                        title={`Ca ${shift.label} (${shift.period}): Sẵn sàng nhận lớp`}
                      >
                        {shift.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend and Guidance */}
        {!loading && !error && !availabilityUnavailable && (
          <div className="flex flex-wrap items-center gap-4 text-caption pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-fg-secondary">Ca trống có thể xếp lịch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-fg-secondary">Ca đã kín lịch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-neutral-200 border border-neutral-300" />
              <span className="text-fg-secondary">Ca đã qua</span>
            </div>
          </div>
        )}

        {!availabilityUnavailable && (
          <Callout variant="info" icon={<Icon name="info" size="sm" />}>
            Lịch trên hiển thị các ca học đã được xác nhận của gia sư. Các khung giờ còn lại gia sư
            có thể sắp xếp linh hoạt theo nhu cầu của bạn.
          </Callout>
        )}

        {/* Action Button: Nền trắng viền xanh thoáng đãng */}
        <div className="pt-1">
          <Button
            as={Link}
            to={`/app/messages?tutorId=${tutorId}`}
            variant="outline"
            fullWidth
            size="md"
            icon={<Icon name="chat" size="sm" />}
            className="bg-white border-blue-600 text-blue-700 hover:bg-blue-50/80 hover:border-blue-700 font-semibold shadow-xs"
          >
            Nhắn tin trao đổi lịch với gia sư
          </Button>
        </div>
      </Card>
    </SectionShell>
  );
}

ProfileScheduleExplainer.propTypes = {
  tutorId: PropTypes.string.isRequired,
};
