import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import sessionService from '@/services/session.service';
import { enrollmentService } from '@/services/enrollment.service';
import { getSessionStatusMeta } from '@/config/enums';
import { formatDateTime } from '@/utils/formatters';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';

/**
 * Returns min datetime-local string (now + 24 hours + 5 min margin)
 */
function getMinNoticeDateTimeLocal() {
  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000);
  const year = minDate.getFullYear();
  const month = String(minDate.getMonth() + 1).padStart(2, '0');
  const day = String(minDate.getDate()).padStart(2, '0');
  const hours = String(minDate.getHours()).padStart(2, '0');
  const minutes = String(minDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function TutorSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const activeTab = searchParams.get('tab') || (searchParams.get('filter') === 'unscheduled' ? 'unscheduled' : 'upcoming');

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

      // 1. Fetch all upcoming/active sessions
      const sessions = await sessionService.getMySessions();
      const sessionList = Array.isArray(sessions) ? sessions : [];

      // Sort upcoming sessions with a startAt date
      const scheduledSessions = sessionList
        .filter((s) => s.status === 'Scheduled' || (s.startAt && s.status !== 'Cancelled'))
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      setUpcomingSessions(scheduledSessions);

      // 2. Fetch active enrollments to find unscheduled sessions
      const enrollmentsPaged = await enrollmentService.getMyEnrollments({ status: 'Active', pageSize: 20 });
      const enrollments = enrollmentsPaged?.items || [];

      // Fetch details for each enrollment to get its session list
      const detailedEnrollments = await Promise.all(
        enrollments.map(async (e) => {
          try {
            const detail = await enrollmentService.getEnrollmentById(e.id);
            return detail;
          } catch {
            return null;
          }
        })
      );

      const needingSchedule = detailedEnrollments
        .filter(Boolean)
        .map((enrollment) => {
          const unscheduled = (enrollment.sessions || []).filter((s) => s.status === 'Unscheduled');
          return {
            ...enrollment,
            unscheduledSessions: unscheduled,
          };
        })
        .filter((e) => e.unscheduledSessions.length > 0);

      setEnrollmentsWithUnscheduled(needingSchedule);
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
    setFormValues((prev) => ({
      ...prev,
      [sessionId]: value,
    }));
  };

  // Schedule a single session
  const handleScheduleSingle = async (session, durationMinutes) => {
    const localVal = formValues[session.id];
    if (!localVal) {
      toast.error('Vui lòng chọn ngày và giờ bắt đầu buổi học.');
      return;
    }

    try {
      setSubmittingSessionId(session.id);
      const startAtDate = new Date(localVal);
      const endAtDate = new Date(startAtDate.getTime() + (durationMinutes || 60) * 60 * 1000);

      await sessionService.scheduleSession(session.id, startAtDate.toISOString(), endAtDate.toISOString());

      toast.success(`Buổi ${session.sessionNumber} đã được xếp lịch thành công.`);

      // Clear the local input value and reload data
      setFormValues((prev) => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });

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
      if (localVal) {
        const startAtDate = new Date(localVal);
        const endAtDate = new Date(startAtDate.getTime() + durationMinutes * 60 * 1000);
        items.push({
          sessionId: session.id,
          startAt: startAtDate.toISOString(),
          endAt: endAtDate.toISOString(),
        });
      }
    }

    if (items.length === 0) {
      toast.error('Vui lòng chọn thời gian cho ít nhất một buổi học để xếp lịch.');
      return;
    }

    try {
      setSubmittingEnrollmentId(enrollment.id);
      await sessionService.scheduleSessionsBatch(items);

      toast.success(`Đã xếp lịch cho ${items.length} buổi học.`);

      // Clear scheduled session inputs
      setFormValues((prev) => {
        const next = { ...prev };
        items.forEach((item) => {
          delete next[item.sessionId];
        });
        return next;
      });

      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xếp lịch.');
    } finally {
      setSubmittingEnrollmentId(null);
    }
  };

  const totalUnscheduledCount = useMemo(() => {
    return enrollmentsWithUnscheduled.reduce((acc, curr) => acc + (curr.unscheduledSessions?.length || 0), 0);
  }, [enrollmentsWithUnscheduled]);

  // Tabs đọc `key` (không phải `id`) và `value` (không phải `activeTab`) — xem components/ui/Tabs.jsx
  const tabs = [
    {
      key: 'upcoming',
      label: `Lịch dạy sắp tới (${upcomingSessions.length})`,
    },
    {
      key: 'unscheduled',
      label: `Cần xếp lịch (${totalUnscheduledCount})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch dạy</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý lịch học và sắp xếp buổi dạy cho các lớp học của bạn
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* Loading & Error States */}
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

      {/* Tab 1: Upcoming Scheduled Sessions */}
      {!loading && !error && activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingSessions.length === 0 ? (
            <EmptyState
              icon={<Icon name="calendar" size="lg" className="text-gray-400" />}
              title="Chưa có buổi học nào sắp tới"
              description="Các buổi học sau khi được xếp lịch sẽ hiển thị tại đây."
              action={
                totalUnscheduledCount > 0 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTabChange('unscheduled')}
                  >
                    Xem {totalUnscheduledCount} buổi cần xếp lịch
                  </Button>
                ) : null
              }
            />
          ) : (
            upcomingSessions.map((session) => {
              const meta = getSessionStatusMeta(session.status);
              return (
                <div
                  key={session.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 transition-colors shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                      <span className="text-xs font-medium uppercase">
                        {session.startAt ? new Date(session.startAt).toLocaleDateString('vi-VN', { weekday: 'short' }) : 'Buổi'}
                      </span>
                      <span className="text-sm font-bold">
                        {session.sessionNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-base">
                          {session.subjectName || 'Buổi học'}
                        </h3>
                        <Badge variant={meta.color || 'info'} size="sm">
                          {meta.label}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <Icon name="clock" size="xs" className="text-gray-400" />
                          {session.startAt ? formatDateTime(session.startAt, 'DD/MM/YYYY HH:mm') : 'Chưa xếp'}
                          {session.endAt ? ` - ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
                        </span>

                        {session.studentName && (
                          <span className="flex items-center gap-1.5">
                            <Icon name="user" size="xs" className="text-gray-400" />
                            Học viên: {session.studentName}
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Enrollments with Unscheduled Sessions */}
      {!loading && !error && activeTab === 'unscheduled' && (
        <div className="space-y-6">
          {enrollmentsWithUnscheduled.length === 0 ? (
            <EmptyState
              icon={<Icon name="checkCircle" size="lg" className="text-green-500" />}
              title="Tất cả buổi học đã được xếp lịch!"
              description="Hiện tại không có buổi học nào cần xếp lịch."
            />
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
                <Icon name="info" size="sm" className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Quy tắc xếp lịch:</p>
                  <p className="mt-0.5">
                    Buổi học phải được xếp lịch trước giờ bắt đầu ít nhất 24 giờ.
                    Bạn có thể xếp từng buổi hoặc điền nhiều buổi rồi nhấn <strong>Xếp tất cả</strong>. Các buổi chưa chọn thời gian sẽ giữ nguyên trạng thái chưa xếp để bạn xếp dần sau.
                  </p>
                </div>
              </div>

              {enrollmentsWithUnscheduled.map((enrollment) => {
                const filledCount = enrollment.unscheduledSessions.filter((s) => Boolean(formValues[s.id])).length;
                const isBatchSubmitting = submittingEnrollmentId === enrollment.id;

                return (
                  <div
                    key={enrollment.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4"
                  >
                    {/* Enrollment Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {enrollment.subjectName || 'Khóa học'}
                        </h2>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                          <span>Thời lượng: {enrollment.sessionDurationMinutes || 60} phút/buổi</span>
                          <span>•</span>
                          <span>Tổng số buổi: {enrollment.totalSessions}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">
                            Còn {enrollment.unscheduledSessions.length} buổi chưa xếp
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

                    {/* Unscheduled Sessions Rows */}
                    <div className="space-y-3">
                      {enrollment.unscheduledSessions.map((session) => {
                        const localVal = formValues[session.id] || '';
                        const isSubmittingThis = submittingSessionId === session.id;

                        let calculatedEnd = '';
                        if (localVal) {
                          const startD = new Date(localVal);
                          const endD = new Date(startD.getTime() + (enrollment.sessionDurationMinutes || 60) * 60 * 1000);
                          calculatedEnd = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
                        }

                        return (
                          <div
                            key={session.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                #{session.sessionNumber}
                              </span>
                              <span className="font-medium text-gray-800 text-sm">
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
                                  className="text-xs sm:text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                {calculatedEnd && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    → {calculatedEnd}
                                  </span>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!localVal || isSubmittingThis}
                                loading={isSubmittingThis}
                                onClick={() => handleScheduleSingle(session, enrollment.sessionDurationMinutes)}
                              >
                                Xếp lịch
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
