import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import sessionService from '@/services/session.service';
import { enrollmentService } from '@/services/enrollment.service';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { getMinNoticeDateTimeLocal, assertMinNotice } from '@/utils/scheduling';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import StateBadge from '@/components/ledger/StateBadge';

/**
 * Lịch dạy của gia sư — Operational Ledger (SPEC Tutor §4.2).
 *
 * Bố cục 2 tab, tab state nằm trên URL (`?tab=`) để link từ Action Queue ở
 * dashboard mở thẳng đúng nhánh.
 *
 * Ba bug đã sửa ở đây:
 *  - EmptyState nhận `icon` dạng chuỗi và CTA qua `actionLabel`/`onAction`; trước
 *    đó truyền element + prop `action` không tồn tại nên CTA bị bỏ rơi.
 *  - Icon `clock` / `user` / `checkCircle` không có trong `iconMap.js`, âm thầm
 *    fallback về CircleHelp.
 *  - Cả hai luồng xếp lịch đều thiếu kiểm tra 24h, chỉ dựa vào thuộc tính `min`
 *    của `datetime-local` (bypass được). Bất biến này giờ kiểm ở client.
 */
export default function TutorSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const activeTab =
    searchParams.get('tab') ||
    (searchParams.get('filter') === 'unscheduled' ? 'unscheduled' : 'upcoming');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [enrollmentsWithUnscheduled, setEnrollmentsWithUnscheduled] = useState([]);

  // Store scheduled inputs: { [sessionId]: "YYYY-MM-DDTHH:mm" }
  const [formValues, setFormValues] = useState({});
  const [submittingSessionId, setSubmittingSessionId] = useState(null);
  const [submittingEnrollmentId, setSubmittingEnrollmentId] = useState(null);

  const minNoticeString = useMemo(() => getMinNoticeDateTimeLocal(), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sessions = await sessionService.getMySessions();
      const sessionList = Array.isArray(sessions) ? sessions : [];

      const scheduledSessions = sessionList
        .filter((s) => s.status === 'Scheduled' || (s.startAt && s.status !== 'Cancelled'))
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      setUpcomingSessions(scheduledSessions);

      // `GET /sessions` đã trả cả session `Unscheduled` kèm `enrollmentId`, nên ta
      // chỉ cần mở chi tiết cho những hợp đồng thực sự có buổi chưa xếp. Trước đây
      // trang này gọi `getEnrollmentById` cho *mọi* hợp đồng Active rồi mới lọc
      // (N+1 request) — giữ nguyên endpoint, chỉ bỏ các call thừa.
      const enrollmentIdsWithUnscheduled = new Set(
        sessionList.filter((s) => s.status === 'Unscheduled').map((s) => s.enrollmentId)
      );

      const enrollmentsPaged = await enrollmentService.getMyEnrollments({
        status: 'Active',
        pageSize: 20,
      });
      const enrollments = (enrollmentsPaged?.items || []).filter((e) =>
        enrollmentIdsWithUnscheduled.has(e.id)
      );

      const detailedEnrollments = await Promise.all(
        enrollments.map(async (e) => {
          try {
            return await enrollmentService.getEnrollmentById(e.id);
          } catch {
            return null;
          }
        })
      );

      setEnrollmentsWithUnscheduled(
        detailedEnrollments
          .filter(Boolean)
          .map((enrollment) => ({
            ...enrollment,
            unscheduledSessions: (enrollment.sessions || []).filter(
              (s) => s.status === 'Unscheduled'
            ),
          }))
          .filter((e) => e.unscheduledSessions.length > 0)
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      next.delete('filter');
      return next;
    });
  };

  const handleDateChange = (sessionId, value) => {
    setFormValues((prev) => ({ ...prev, [sessionId]: value }));
  };

  const clearFormValues = (sessionIds) => {
    setFormValues((prev) => {
      const next = { ...prev };
      sessionIds.forEach((id) => delete next[id]);
      return next;
    });
  };

  const computeEnd = (startAt, durationMinutes) =>
    new Date(new Date(startAt).getTime() + (durationMinutes || 60) * 60 * 1000);

  // Schedule a single session
  const handleScheduleSingle = async (session, durationMinutes) => {
    const localVal = formValues[session.id];
    if (!localVal) {
      toast.error('Vui lòng chọn ngày và giờ bắt đầu buổi học.');
      return;
    }

    // B-7: bất biến báo trước 24h, kiểm ở client thay vì trông backend từ chối.
    const noticeError = assertMinNotice(new Date(localVal));
    if (noticeError) {
      toast.error(noticeError);
      return;
    }

    try {
      setSubmittingSessionId(session.id);
      const startAtDate = new Date(localVal);
      const endAtDate = computeEnd(startAtDate, durationMinutes);

      await sessionService.scheduleSession(
        session.id,
        startAtDate.toISOString(),
        endAtDate.toISOString()
      );

      toast.success(`Buổi ${session.sessionNumber} đã được xếp lịch thành công.`);
      clearFormValues([session.id]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xếp lịch buổi học.');
    } finally {
      setSubmittingSessionId(null);
    }
  };

  // Bulk schedule all filled sessions for an enrollment
  const handleScheduleBatch = async (enrollment) => {
    const items = [];
    const durationMinutes = enrollment.sessionDurationMinutes || 60;

    for (const session of enrollment.unscheduledSessions) {
      const localVal = formValues[session.id];
      if (!localVal) continue;
      const startAtDate = new Date(localVal);
      items.push({
        sessionId: session.id,
        startAt: startAtDate.toISOString(),
        endAt: computeEnd(startAtDate, durationMinutes).toISOString(),
      });
    }

    if (items.length === 0) {
      toast.error('Vui lòng chọn thời gian cho ít nhất một buổi học để xếp lịch.');
      return;
    }

    // B-7: kiểm 24h cho toàn bộ lô, không chỉ buổi đầu.
    const offending = items.find((i) => assertMinNotice(i.startAt));
    if (offending) {
      toast.error(assertMinNotice(offending.startAt));
      return;
    }

    try {
      setSubmittingEnrollmentId(enrollment.id);
      await sessionService.scheduleSessionsBatch(items);

      toast.success(`Đã xếp lịch cho ${items.length} buổi học.`);
      clearFormValues(items.map((i) => i.sessionId));
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xếp lịch.');
    } finally {
      setSubmittingEnrollmentId(null);
    }
  };

  const totalUnscheduledCount = useMemo(
    () =>
      enrollmentsWithUnscheduled.reduce(
        (acc, curr) => acc + (curr.unscheduledSessions?.length || 0),
        0
      ),
    [enrollmentsWithUnscheduled]
  );

  // Tabs đọc `key` / `value` — xem components/ui/Tabs.jsx
  const tabs = [
    { key: 'upcoming', label: `Lịch dạy sắp tới (${upcomingSessions.length})` },
    { key: 'unscheduled', label: `Cần xếp lịch (${totalUnscheduledCount})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-page text-fg tracking-tight">Lịch dạy</h1>
        <p className="text-body-reg text-fg-secondary mt-1">
          Xếp lịch buổi dạy cho các lớp học. Quy tắc báo trước tối thiểu 24 giờ.
        </p>
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={handleTabChange} />

      {loading && (
        <div className="space-y-4">
          <CardSkeleton count={3} />
        </div>
      )}

      {!loading && error && (
        <ErrorState
          title="Không thể tải lịch dạy"
          description={error.message || 'Vui lòng thử lại sau.'}
          onRetry={loadData}
        />
      )}

      {/* ── Tab 1: buổi đã xếp lịch ─────────────────────────── */}
      {!loading && !error && activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingSessions.length === 0 ? (
            /* B-4 + B-5: icon là chuỗi, CTA đi qua actionLabel + onAction.
       Trước đây prop `action` không tồn tại nên nút bị bỏ rơi — mất đường điều hướng. */
            <EmptyState
              icon="calendar_month"
              title="Chưa có buổi học nào sắp tới"
              description="Các buổi học sau khi được xếp lịch sẽ hiển thị tại đây."
              actionLabel={
                totalUnscheduledCount > 0
                  ? `Xem ${totalUnscheduledCount} buổi cần xếp lịch`
                  : undefined
              }
              onAction={
                totalUnscheduledCount > 0 ? () => handleTabChange('unscheduled') : undefined
              }
            />
          ) : (
            upcomingSessions.map((session) => (
              <article
                key={session.id}
                className="bg-surface border border-border rounded-brand-lg shadow-brand-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-primary-200 hover:shadow-brand-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="w-12 h-12 rounded-brand-md bg-brand-primary-50 text-brand-primary-700 border border-brand-primary-100 flex flex-col items-center justify-center shrink-0"
                  >
                    <span className="text-[10px] font-medium uppercase">
                      {session.startAt
                        ? new Date(session.startAt).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                          })
                        : 'Buổi'}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {session.sessionNumber}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[15px] font-semibold text-fg leading-snug">
                        {session.subjectName || 'Buổi học'}
                      </h2>
                      <StateBadge status={session.status} domain="session" />
                    </div>

                    <div className="text-caption text-fg-secondary mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5 font-medium text-fg tabular-nums">
                        <Icon name="timer" size="xs" className="text-fg-muted" />
                        {session.startAt
                          ? formatDateTime(session.startAt, 'DD/MM/YYYY HH:mm')
                          : 'Chưa xếp'}
                        {session.endAt ? ` - ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
                      </span>

                      {session.studentName && (
                        <span className="flex items-center gap-1.5">
                          <Icon name="person" size="xs" className="text-fg-muted" />
                          Học viên: {session.studentName}
                        </span>
                      )}

                      {session.earningAmount > 0 && (
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <Icon name="account_balance_wallet" size="xs" className="text-fg-muted" />
                          {formatCurrency(session.earningAmount)} ký quỹ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/tutor/sessions/${session.id}`)}
                  >
                    Chi tiết
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* ── Tab 2: buổi chưa xếp lịch ───────────────────────── */}
      {!loading && !error && activeTab === 'unscheduled' && (
        <div className="space-y-6">
          {enrollmentsWithUnscheduled.length === 0 ? (
            <EmptyState
              icon="check_circle"
              title="Tất cả buổi học đã được xếp lịch!"
              description="Hiện tại không có buổi học nào cần xếp lịch."
            />
          ) : (
            <>
              <div className="p-4 rounded-brand-md bg-holding-subtle border border-holding/30 text-caption text-holding-strong flex items-start gap-3">
                <Icon name="info" size="sm" className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold m-0">Quy tắc xếp lịch:</p>
                  <p className="mt-0.5 mb-0">
                    Buổi học phải được xếp lịch trước giờ bắt đầu ít nhất 24 giờ. Bạn có thể
                    xếp từng buổi hoặc điền nhiều buổi rồi nhấn <strong>Xếp tất cả</strong>.
                    Các buổi chưa chọn thời gian sẽ giữ nguyên trạng thái chưa xếp để bạn xếp
                    dần sau.
                  </p>
                </div>
              </div>

              {enrollmentsWithUnscheduled.map((enrollment) => {
                const filledCount = enrollment.unscheduledSessions.filter((s) =>
                  Boolean(formValues[s.id])
                ).length;
                const isBatchSubmitting = submittingEnrollmentId === enrollment.id;

                return (
                  <section
                    key={enrollment.id}
                    className="bg-surface border border-border rounded-brand-lg shadow-brand-sm p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                      <div className="min-w-0">
                        <h2 className="text-[20px] font-semibold text-fg tracking-tight">
                          {enrollment.subjectName || 'Khóa học'}
                        </h2>
                        <div className="text-caption text-fg-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            Thời lượng: {enrollment.sessionDurationMinutes || 60} phút/buổi
                          </span>
                          <span aria-hidden="true">•</span>
                          <span className="tabular-nums">
                            Tổng số buổi: {enrollment.totalSessions}
                          </span>
                          <span aria-hidden="true">•</span>
                          <span className="text-holding-strong font-semibold tabular-nums">
                            Còn {enrollment.unscheduledSessions.length} buổi chưa xếp
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="sr-only" aria-live="polite">
                          Đã điền {filledCount} trên {enrollment.unscheduledSessions.length}{' '}
                          buổi
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={filledCount === 0 || isBatchSubmitting}
                          loading={isBatchSubmitting}
                          onClick={() => handleScheduleBatch(enrollment)}
                        >
                          Xếp tất cả ({filledCount})
                        </Button>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {enrollment.unscheduledSessions.map((session) => {
                        const localVal = formValues[session.id] || '';
                        const isSubmittingThis = submittingSessionId === session.id;

                        let calculatedEnd = '';
                        if (localVal) {
                          const endD = computeEnd(
                            localVal,
                            enrollment.sessionDurationMinutes || 60
                          );
                          calculatedEnd = `${String(endD.getHours()).padStart(2, '0')}:${String(
                            endD.getMinutes()
                          ).padStart(2, '0')}`;
                        }

                        return (
                          <li
                            key={session.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-brand-md bg-neutral-50 border border-border"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                aria-hidden="true"
                                className="w-8 h-8 rounded-full bg-brand-primary-50 text-brand-primary-700 font-bold text-caption flex items-center justify-center shrink-0 tabular-nums"
                              >
                                {session.sessionNumber}
                              </span>
                              <span className="text-caption font-medium text-fg">
                                Buổi {session.sessionNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <input
                                  type="datetime-local"
                                  aria-label={`Thời gian bắt đầu buổi ${session.sessionNumber}`}
                                  min={minNoticeString}
                                  value={localVal}
                                  onChange={(e) => handleDateChange(session.id, e.target.value)}
                                  className={cn(
                                    'text-caption px-2.5 py-1.5 border border-border rounded-brand-md',
                                    'bg-surface text-fg',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600'
                                  )}
                                />
                                {calculatedEnd && (
                                  <span className="text-caption text-fg-muted whitespace-nowrap tabular-nums">
                                    → {calculatedEnd}
                                  </span>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!localVal || isSubmittingThis}
                                loading={isSubmittingThis}
                                onClick={() =>
                                  handleScheduleSingle(
                                    session,
                                    enrollment.sessionDurationMinutes
                                  )
                                }
                              >
                                Xếp lịch
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
