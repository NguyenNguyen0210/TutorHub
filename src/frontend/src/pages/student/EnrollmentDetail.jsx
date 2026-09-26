import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { SESSION_STATUS } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { Progress } from '@/components/ui/Callout';
import { DetailSkeleton } from '@/components/common/Skeleton';
import { Textarea, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import LedgerTable from '@/components/ledger/LedgerTable';
import StateBadge, { getStateMeta } from '@/components/ledger/StateBadge';

/**
 * Hợp đồng học tập — Operational Ledger (SPEC §5.4).
 *
 * Sổ cái buổi học là phần lõi của màn này, không phải phần phụ sau header. Vì vậy
 * danh sách buổi nằm ngay dưới dải số liệu, dạng dòng sổ thật: spine màu trạng
 * thái ở mép trái, thời gian tabular, ký quỹ căn phải, thao tác cuối dòng.
 * Desktop = bảng; mobile = card xếp dọc (cùng dữ liệu, cùng view-model).
 *
 * Màu ở đây là TRẠNG THÁI, không phải trang trí (SPEC §2.2): `Tỷ lệ phí sàn`
 * dùng màu trung tính vì phí sàn không phải tín hiệu tốt cho học viên.
 */

/** Cột của sổ buổi học — thứ tự đọc là: buổi → thời gian → tiền → thao tác. */
const SESSION_COLUMNS = [
  { key: 'session', label: 'Buổi học', width: '32%' },
  { key: 'time', label: 'Thời gian', width: '24%' },
  { key: 'escrow', label: 'Ký quỹ buổi', width: '18%', align: 'right' },
  { key: 'actions', label: 'Thao tác', width: '26%', align: 'right' },
];

/**
 * Màu theo trạng thái. `border` = spine mép trái của dòng bảng, `bar` = spine
 * card mobile, `chip` = ô số thứ tự. Nguồn màu là `getStateMeta` (StateBadge),
 * không map lại chuỗi status ở đây.
 *
 * `holding` không có trong bảng này vì `SESSION_STATUS_META` không có trạng thái
 * holding — trạng thái "chờ điểm danh 24h" là hạn chót, do badge ở `getStatusBadge`
 * mang, không phải màu của enum buổi học.
 */
const TONE_CLASS = {
  success: {
    border: 'border-l-success',
    bar: 'bg-success',
    chip: 'bg-success-subtle text-success-strong',
  },
  info: {
    border: 'border-l-info',
    bar: 'bg-info',
    chip: 'bg-info-subtle text-info',
  },
  danger: {
    border: 'border-l-danger',
    bar: 'bg-danger',
    chip: 'bg-danger-subtle text-danger-strong',
  },
  neutral: {
    border: 'border-l-neutral-300',
    bar: 'bg-neutral-300',
    chip: 'bg-neutral-100 text-fg-secondary',
  },
};

function sessionTone(session) {
  if (session.hasAttendanceConflict) return TONE_CLASS.danger;
  const { color } = getStateMeta('session', session.status);
  return TONE_CLASS[color] || TONE_CLASS.neutral;
}

/**
 * Cột trái của dòng sổ: số thứ tự + tên buổi + badge trạng thái.
 * Dùng chung cho hàng bảng (`<th scope="row">`) và card mobile.
 */
function SessionIdentity({ number, badge, chipClass }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        aria-hidden="true"
        className={cn(
          'w-9 h-9 shrink-0 rounded-brand-md flex items-center justify-center text-caption font-bold tabular-nums',
          chipClass
        )}
      >
        {number}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-fg leading-snug truncate">
          Buổi học #{number}
        </p>
        <div className="mt-1 flex items-center">{badge}</div>
      </div>
    </div>
  );
}

export default function EnrollmentDetail() {
  const toast = useToast();
  const { id } = useParams();
  const { role } = useAuthStore();
  const isTutor = role === 'Tutor';
  const backPath = isTutor ? '/tutor/schedule' : '/student/dashboard';
  const backLabel = isTutor ? 'Quay lại lịch dạy' : 'Quay lại bàn học';

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scheduling states (for Tutor)
  const [schedulingSessionId, setSchedulingSessionId] = useState(null);
  const [scheduleDatetime, setScheduleDatetime] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const minNoticeString = useMemo(() => {
    return dayjs().add(24, 'hour').add(5, 'minute').format('YYYY-MM-DDTHH:mm');
  }, []);

  // Review states
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadEnrollment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getEnrollmentById(id);
      setEnrollment(data);
      setError(null);

      // If enrollment is completed, fetch any existing review
      if (data?.status === 'Completed') {
        try {
          setReviewLoading(true);
          const rev = await enrollmentService.getReview(id);
          if (rev?.id) {
            setReview(rev);
          }
        } catch {
          // No review yet or not found - silent
          setReview(null);
        } finally {
          setReviewLoading(false);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadEnrollment();
    }
  }, [id, loadEnrollment]);

  const handleScheduleInline = async (e, session) => {
    e.preventDefault();
    if (!scheduleDatetime) {
      toast.error('Vui lòng chọn thời gian bắt đầu buổi học.');
      return;
    }

    const startAtDate = dayjs(scheduleDatetime);
    const minNotice = dayjs().add(24, 'hour');
    if (startAtDate.isBefore(minNotice)) {
      toast.error('Lịch mới phải cách thời điểm hiện tại ít nhất 24 giờ.');
      return;
    }

    const durationMinutes = enrollment?.sessionDurationMinutes || 60;
    const endAtDate = startAtDate.add(durationMinutes, 'minute');

    try {
      setSubmittingSchedule(true);
      await sessionService.scheduleSession(
        session.id,
        startAtDate.toDate().toISOString(),
        endAtDate.toDate().toISOString()
      );

      toast.success(`Đã xếp lịch buổi học #${session.sessionNumber} thành công.`);
      setSchedulingSessionId(null);
      setScheduleDatetime('');
      await loadEnrollment();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xếp lịch buổi học.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await enrollmentService.createReview(id, rating, comment.trim());
      setReview(res);
      toast.success('Đã gửi đánh giá khóa học thành công! Cảm ơn bạn đã phản hồi.');
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  /**
   * Thứ tự ưu tiên giữ nguyên: xung đột điểm danh > cửa sổ chờ điểm danh 24h >
   * trạng thái buổi học. Hai nhánh đầu không có enum nên dùng `Badge` trực tiếp;
   * nhánh cuối luôn đi qua `StateBadge` để nhãn/màu chỉ có một nơi.
   */
  const getStatusBadge = (session) => {
    if (session.hasAttendanceConflict) {
      return (
        <Badge variant="danger" size="sm" icon={<Icon name="warning" size="sm" />}>
          Bất đồng điểm danh
        </Badge>
      );
    }
    if (session.status === SESSION_STATUS.SCHEDULED && session.attendanceVerificationDueAt) {
      const isWindowOpen = new Date(session.attendanceVerificationDueAt) > new Date();
      if (isWindowOpen && !session.studentAttendance) {
        return (
          <Badge variant="holding" size="sm" icon={<Icon name="timer" size="sm" />}>
            Chờ điểm danh 24h
          </Badge>
        );
      }
    }
    return <StateBadge domain="session" status={session.status} />;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          {backLabel}
        </Link>
        <ErrorState
          error={error}
          title="Không tìm thấy hợp đồng học tập"
          backPath={backPath}
          backLabel={backLabel}
        />
      </div>
    );
  }

  const sessions = Array.isArray(enrollment.sessions) ? enrollment.sessions : [];
  const completedCount = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED).length;
  const progressPercent = Math.round((completedCount / (enrollment.totalSessions || 1)) * 100);
  const isCompleted = enrollment.status === 'Completed';
  const isActive = enrollment.status === 'Active';
  const tutorName = enrollment.tutorName || sessions[0]?.tutorName || 'Gia sư';
  const durationMinutes = enrollment.sessionDurationMinutes || 60;

  /**
   * View-model dùng chung cho hàng bảng (desktop) và card (mobile): cùng dữ liệu,
   * cùng thao tác, không lệch nội dung giữa hai breakpoint.
   */
  const sessionRows = sessions.map((sess) => {
    const isUnscheduled = sess.status === SESSION_STATUS.UNSCHEDULED;
    const isSchedulingThis = schedulingSessionId === sess.id;
    const canTutorSchedule = isTutor && isUnscheduled && isActive;
    const tone = sessionTone(sess);

    return {
      id: sess.id,
      number: sess.sessionNumber,
      tone,
      badge: getStatusBadge(sess),
      time: (
        <div className="min-w-0">
          {sess.startAt ? (
            <span className="font-mono text-caption text-fg tabular-nums whitespace-nowrap">
              {formatDateTime(sess.startAt, 'DD/MM/YYYY HH:mm')}
            </span>
          ) : (
            <span className="text-caption text-fg-muted">Chờ gia sư xếp lịch</span>
          )}
          {sess.endAt && (
            <span className="block text-[12px] text-fg-muted tabular-nums whitespace-nowrap">
              &ndash; {formatDateTime(sess.endAt, 'HH:mm')}
            </span>
          )}
        </div>
      ),
      escrow: (
        <span className="text-caption font-semibold text-fg whitespace-nowrap">
          <Money value={sess.earningAmount || 0} />
        </span>
      ),
      actions: (
        <>
          {canTutorSchedule && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (isSchedulingThis) {
                  setSchedulingSessionId(null);
                  setScheduleDatetime('');
                } else {
                  setSchedulingSessionId(sess.id);
                  setScheduleDatetime('');
                }
              }}
              icon={<Icon name="calendar_month" size="xs" />}
            >
              {isSchedulingThis ? 'Đóng' : 'Xếp lịch'}
            </Button>
          )}

          <Button
            as={Link}
            to={isTutor ? `/tutor/sessions/${sess.id}` : `/student/sessions/${sess.id}`}
            variant="outline"
            size="sm"
            iconRight={<Icon name="chevron_right" size="sm" />}
          >
            Chi tiết
          </Button>

          {sess.hasAttendanceConflict && (
            <Button
              as={Link}
              to={`/student/disputes/new?sessionId=${sess.id}`}
              variant="danger-outline"
              size="sm"
            >
              Khiếu nại
            </Button>
          )}
        </>
      ),
      // Inline schedule form for Tutor — chỉ render khi đang mở form của buổi này.
      scheduleForm: isSchedulingThis && (
        <form
          onSubmit={(e) => handleScheduleInline(e, sess)}
          className="w-full pt-3.5 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-brand-md"
        >
          <div className="flex-1 w-full sm:w-auto">
            <label
              htmlFor={`schedule-time-${sess.id}`}
              className="block text-caption font-bold text-fg cursor-pointer"
            >
              <span className="flex items-center gap-1.5 mb-1.5">
                <Icon name="event" size="xs" className="text-brand-primary-600" />
                Xếp lịch cho buổi #{sess.sessionNumber}
              </span>
              <input
                id={`schedule-time-${sess.id}`}
                aria-label={`Thời gian bắt đầu buổi học #${sess.sessionNumber}`}
                type="datetime-local"
                min={minNoticeString}
                value={scheduleDatetime}
                onChange={(e) => setScheduleDatetime(e.target.value)}
                required
                className="w-full sm:w-64 h-9 px-3 rounded-brand-md border border-border bg-surface text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              />
            </label>
            <span className="block text-[11px] text-holding-strong mt-1 font-medium">
              Lịch học phải cách thời điểm hiện tại ít nhất 24 giờ. Thời lượng:{' '}
              {durationMinutes} phút.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedulingSessionId(null);
                setScheduleDatetime('');
              }}
              disabled={submittingSchedule}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingSchedule}
              icon={<Icon name="check" size="xs" />}
            >
              Lưu lịch
            </Button>
          </div>
        </form>
      ),
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        {backLabel}
      </Link>

      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-mono text-caption font-semibold text-fg-muted select-all block">
              HỢP ĐỒNG #{String(enrollment.id || '').slice(0, 8)}
            </span>
            <h1 className="text-headline-page text-fg tracking-tight mt-1">
              {enrollment.serviceTitle || enrollment.subjectName || 'Hợp đồng học tập'}
            </h1>
            <p className="text-body-reg text-fg-secondary mt-1">
              Gia sư phụ trách: <strong className="text-fg">{tutorName}</strong>
            </p>
          </div>
          {/* Trạng thái nằm ở badge, không nằm ở viền card. */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <StateBadge status={enrollment.status} domain="enrollment" size="md" />
            {isActive && (
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-holding-strong">
                <Icon name="lock" size="sm" />
                Escrow đang khóa
              </span>
            )}
          </div>
        </div>

        <LedgerStrip
          figures={[
            {
              key: 'total',
              label: 'Tổng học phí',
              value: <Money value={enrollment.totalPrice} />,
              hint: isActive ? 'Bảo chứng trong Escrow' : undefined,
            },
            {
              key: 'sessions',
              label: 'Số buổi',
              value: <span>{enrollment.totalSessions}</span>,
              hint: `${durationMinutes} phút/buổi`,
            },
            {
              key: 'progress',
              label: 'Buổi hoàn thành',
              value: (
                <span>
                  {completedCount} / {enrollment.totalSessions}
                </span>
              ),
            },
            {
              // Phí sàn KHÔNG phải tín hiệu tốt cho học viên → giữ màu trung tính.
              key: 'platformFee',
              label: 'Tỷ lệ phí sàn',
              value: <span>{(Number(enrollment.platformFeeRate || 0.1) * 100).toFixed(0)}%</span>,
              hint: 'Snapshot tại thời điểm đăng ký',
            },
          ]}
        />

        <div className="space-y-1.5">
          <div className="flex justify-between text-caption text-fg-secondary">
            <span>Tiến độ hợp đồng:</span>
            <span className="font-bold tabular-nums">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} label="Tiến độ hợp đồng" />
        </div>
      </Card>

      {/* ── Sổ cái buổi học: phần lõi của màn này ───────────────────── */}
      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="text-[20px] font-semibold text-fg tracking-tight">
            Lộ trình &amp; Tiến độ phân rã {enrollment.totalSessions} buổi học
          </h2>
          <p className="text-caption text-fg-muted mt-0.5">
            Mỗi buổi học tương ứng một khoản ký quỹ riêng biệt được giải ngân sau khi đối soát
            thành công
          </p>
        </div>

        {sessionRows.length === 0 ? (
          <p className="text-caption text-fg-muted m-0">Hợp đồng này chưa có buổi học nào.</p>
        ) : (
          <>
            {/* Desktop: dòng sổ thật — spine trạng thái · thời gian · ký quỹ · thao tác */}
            <LedgerTable
              caption="Sổ buổi học của hợp đồng"
              columns={SESSION_COLUMNS}
              minWidth={700}
              className="hidden lg:block"
            >
              {sessionRows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="align-middle">
                    <th
                      scope="row"
                      className={cn(
                        'border-l-2 py-3 pl-4 pr-3 text-left font-normal',
                        row.tone.border
                      )}
                    >
                      <SessionIdentity
                        number={row.number}
                        badge={row.badge}
                        chipClass={row.tone.chip}
                      />
                    </th>
                    <td className="py-3 px-3 align-middle">{row.time}</td>
                    <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                      {row.escrow}
                    </td>
                    <td className="py-3 pl-3 pr-4 align-middle">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {row.actions}
                      </div>
                    </td>
                  </tr>
                  {row.scheduleForm && (
                    <tr>
                      <td colSpan={SESSION_COLUMNS.length} className="pb-3 pr-4">
                        {row.scheduleForm}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </LedgerTable>

            {/* Mobile: cùng view-model, xếp dọc thành card */}
            <ul className="lg:hidden space-y-2.5">
              {sessionRows.map((row) => (
                <li
                  key={row.id}
                  className="relative overflow-hidden rounded-brand-lg border border-border bg-surface p-4 pl-5 space-y-3"
                >
                  <span
                    aria-hidden="true"
                    className={cn('absolute inset-y-0 left-0 w-1', row.tone.bar)}
                  />
                  <SessionIdentity
                    number={row.number}
                    badge={row.badge}
                    chipClass={row.tone.chip}
                  />

                  <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                        Thời gian
                      </dt>
                      <dd className="m-0 mt-1">{row.time}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                        Ký quỹ buổi
                      </dt>
                      <dd className="m-0 mt-1">{row.escrow}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">{row.actions}</div>

                  {row.scheduleForm}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Review Section (for Completed Enrollment) */}
      {isCompleted && (
        <Card padding="lg" className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <CardHeader
              className="mb-0"
              title="Đánh giá & Chấm điểm gia sư"
              subtitle="Đóng góp ý kiến khách quan giúp gia sư nâng cao chất lượng và hỗ trợ các học viên khác lựa chọn"
              icon={<Icon name="star" size="sm" filled className="text-brand-secondary-500" />}
            />
            {review && (
              <Badge variant="success" size="sm" icon={<Icon name="check" size="xs" />}>
                Đã gửi đánh giá
              </Badge>
            )}
          </div>

          {reviewLoading ? (
            <div className="py-6 text-center text-caption text-fg-muted">
              Đang tải thông tin đánh giá...
            </div>
          ) : review ? (
            /* Display Submitted Review */
            <div className="space-y-4">
              <div className="p-4 rounded-brand-md bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Icon
                          key={idx}
                          name="star"
                          size="sm"
                          filled={idx < (review.rating || 5)}
                          className={idx < (review.rating || 5) ? 'text-brand-secondary-500' : 'text-neutral-300'}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-caption text-fg">
                      {review.rating}/5 sao
                    </span>
                  </div>
                  {review.createdAt && (
                    <span className="text-[11px] text-fg-muted font-mono tabular-nums whitespace-nowrap">
                      {formatDateTime(review.createdAt, 'DD/MM/YYYY HH:mm')}
                    </span>
                  )}
                </div>

                <p className="text-caption text-fg-secondary leading-relaxed m-0 italic bg-neutral-50 p-3 rounded-brand-sm border border-border">
                  &ldquo;{review.comment || 'Học viên không để lại lời bình.'}&rdquo;
                </p>

                {/* Tutor Reply if available */}
                {review.tutorReply && (
                  <div className="mt-3 p-3 rounded-brand-md bg-brand-primary-50/60 border border-brand-primary-200 text-caption space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-primary-800 font-bold text-xs">
                      <Icon name="chat" size="xs" />
                      <span>Phản hồi từ gia sư ({enrollment.tutorName || 'Gia sư'}):</span>
                      {review.tutorRepliedAt && (
                        <span className="text-fg-muted font-normal text-[11px] ml-auto font-mono tabular-nums whitespace-nowrap">
                          {formatDateTime(review.tutorRepliedAt, 'DD/MM/YYYY')}
                        </span>
                      )}
                    </div>
                    <p className="text-fg-secondary m-0 pl-4">
                      {review.tutorReply}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : isTutor ? (
            <p className="text-caption text-fg-muted italic m-0">
              Chưa có đánh giá nào từ học viên cho khóa học này.
            </p>
          ) : (
            /* Review Submission Form */
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <span className="text-caption font-semibold text-fg block">
                  Mức độ hài lòng của bạn (1 đến 5 sao):
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-surface p-2 rounded-brand-md border border-border inline-flex">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const isFilled = starValue <= (hoverRating || rating);
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none"
                          aria-label={`${starValue} sao`}
                        >
                          <Icon
                            name="star"
                            size="md"
                            filled={isFilled}
                            className={cn(
                              'transition-colors',
                              isFilled ? 'text-brand-secondary-500' : 'text-neutral-300'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-caption font-bold text-fg-secondary">
                    {hoverRating || rating} / 5 sao (
                    {(hoverRating || rating) === 5
                      ? 'Xuất sắc'
                      : (hoverRating || rating) === 4
                        ? 'Tốt'
                        : (hoverRating || rating) === 3
                          ? 'Đạt yêu cầu'
                          : (hoverRating || rating) === 2
                            ? 'Chưa hài lòng'
                            : 'Kém'}
                    )
                  </span>
                </div>
              </div>

              <Field
                label="Lời nhận xét chi tiết (chia sẻ phương pháp dạy, thái độ, kiến thức truyền đạt...):"
                htmlFor="review-comment"
              >
                <Textarea
                  id="review-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Gia sư dạy rất nhiệt tình, giải thích cặn kẽ và chuẩn bị giáo án chu đáo..."
                />
              </Field>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submittingReview}
                  icon={<Icon name="send" size="xs" />}
                >
                  Gửi đánh giá công khai
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
