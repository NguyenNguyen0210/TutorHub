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

const STEPS = [
  {
    title: 'Đăng ký giữ chỗ',
    body: 'Chọn gói học phù hợp và thanh toán an toàn qua két ký quỹ TutorHub. Hệ thống giữ chỗ độc quyền 15 phút.',
  },
  {
    title: 'Gia sư xếp lịch',
    body: 'Sau khi giữ chỗ thành công, gia sư chủ động sắp xếp thời khóa biểu chi tiết cho từng buổi học cùng bạn.',
  },
  {
    title: 'Học tập & bảo đảm',
    body: 'Mỗi buổi học được báo trước tối thiểu 2 giờ và tự động giải ngân sau 12 giờ hoàn thành nếu không có khiếu nại phát sinh.',
  },
];

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
        dayName: i === 6 ? 'Chủ nhật' : `Thứ ${i + 2}`,
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
      <Card padding="lg" className="space-y-6">
        {/* Calendar Header with Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-body-reg font-bold text-fg flex items-center gap-2">
              <span>Lịch bận trong tuần</span>
              {weekOffset === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary-100 text-brand-primary-700">
                  Tuần này
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-fg-muted">
                  +{weekOffset} tuần
                </span>
              )}
            </h3>
            <p className="text-caption text-fg-muted mt-0.5">
              Khung giờ gia sư đã có lớp học cố định hoặc lịch bận
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
              <div key={i} className="h-28 rounded-brand-md bg-neutral-100 animate-pulse" />
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
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {days.map((day) => (
              <div
                key={day.dayName}
                className={`p-2.5 rounded-brand-md border flex flex-col min-h-[120px] transition-colors ${
                  day.isToday
                    ? 'border-brand-primary-500 bg-brand-primary-50/20'
                    : 'border-border bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60 mb-2">
                  <span className={`text-[12px] font-bold ${day.isToday ? 'text-brand-primary-700' : 'text-fg'}`}>
                    {day.dayName}
                  </span>
                  <span className="text-[11px] font-mono text-fg-muted tabular-nums">
                    {day.formattedDate}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  {day.slots.length > 0 ? (
                    day.slots.map((slot, sIdx) => {
                      const startTime = dayjs(slot.startAt).format('HH:mm');
                      const endTime = dayjs(slot.endAt).format('HH:mm');
                      return (
                        <div
                          key={sIdx}
                          className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex flex-col font-medium"
                          title="Gia sư đã có lớp trong khung giờ này"
                        >
                          <span className="font-mono text-[10px] text-amber-900/90 tabular-nums">
                            {startTime} - {endTime}
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                            Đã kín lịch
                          </span>
                        </div>
                      );
                    })
                  ) : day.isPast ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-fg-muted italic">
                      Đã qua
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-1 rounded bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-[10px] text-center font-medium">
                      Trống lịch
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend and Guidance */}
        {!loading && !error && !availabilityUnavailable && <div className="flex flex-wrap items-center gap-4 text-caption pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            <span className="text-fg-secondary">Khung giờ đã có lớp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-fg-secondary">Khung giờ có thể học</span>
          </div>
        </div>}

        {!availabilityUnavailable && <Callout variant="info" icon={<Icon name="info" size="sm" />}>
          Lịch trên hiển thị các buổi học đã được xác nhận của gia sư. Các khung giờ còn lại gia sư có thể sắp xếp linh hoạt. Bạn có thể nhắn tin trao đổi trước để thống nhất thời gian học phù hợp nhất.
        </Callout>}

        {/* Action Button */}
        <div className="pt-1">
          <Button
            as={Link}
            to={`/app/messages?tutorId=${tutorId}`}
            variant="primary"
            fullWidth
            size="md"
            icon={<Icon name="chat" size="sm" />}
          >
            Nhắn tin trao đổi lịch với gia sư
          </Button>
        </div>

        {/* How It Works Explainer (Collapse/Workflow reference) */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-caption font-semibold text-fg mb-3">
            Quy trình đăng ký & bảo đảm học tập
          </h4>
          <ol className="space-y-2.5">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-3 p-3 rounded-brand-md bg-neutral-50 border border-border"
              >
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-brand-primary-100 text-brand-primary-700 font-bold text-caption flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-caption font-bold text-fg">{step.title}</p>
                  <p className="text-caption text-fg-muted leading-relaxed mt-0.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </SectionShell>
  );
}

ProfileScheduleExplainer.propTypes = {
  tutorId: PropTypes.string.isRequired,
};
