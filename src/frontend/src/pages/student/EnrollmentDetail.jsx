import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import enrollmentService from '@/services/enrollment.service';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { SESSION_STATUS, getSessionStatusMeta } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { Progress } from '@/components/ui/Callout';
import { DetailSkeleton } from '@/components/common/Skeleton';
import { Textarea, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function EnrollmentDetail() {
  const toast = useToast();
  const { id } = useParams();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const meta = getSessionStatusMeta(session.status);
    return <Badge variant={meta.color} size="sm">{meta.label}</Badge>;
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
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại bàn học
        </Link>
        <ErrorState
          error={error}
          title="Không tìm thấy hợp đồng học tập"
          backPath="/student/dashboard"
          backLabel="Về bàn học"
        />
      </div>
    );
  }

  const sessions = Array.isArray(enrollment.sessions) ? enrollment.sessions : [];
  const completedCount = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED).length;
  const progressPercent = Math.round((completedCount / (enrollment.totalSessions || 1)) * 100);
  const isCompleted = enrollment.status === 'Completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        Quay lại bàn học
      </Link>

      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-caption font-bold text-brand-primary-700 block">
              HỢP ĐỒNG #{enrollment.id}
            </span>
            <h1 className="text-headline-1 text-fg mt-1">
              {enrollment.serviceTitle || enrollment.subjectName || 'Hợp đồng học tập'}
            </h1>
            <p className="text-caption text-fg-muted mt-0.5">
              Gia sư phụ trách:{' '}
              <strong>
                {enrollment.tutorName || enrollment.sessions?.[0]?.tutorName || 'Gia sư'}
              </strong>
            </p>
          </div>
          <Badge
            variant={enrollment.status === 'Active' ? 'success' : enrollment.status === 'Completed' ? 'primary' : 'info'}
            icon={<Icon name="shield" size="sm" />}
          >
            {enrollment.status === 'Active'
              ? 'Đang hiệu lực (Escrow Locked)'
              : enrollment.status === 'Completed'
                ? 'Đã hoàn tất toàn bộ khóa học'
                : enrollment.status}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption border-t border-border pt-4">
          <div className="p-3 bg-neutral-50 rounded-brand-md">
            <dt className="text-fg-muted block">Tổng học phí:</dt>
            <dd className="font-bold text-fg">
              <Money value={enrollment.totalPrice} />
            </dd>
          </div>
          <div className="p-3 bg-neutral-50 rounded-brand-md">
            <dt className="text-fg-muted block">Số buổi:</dt>
            <dd className="font-bold text-fg font-mono">
              {enrollment.totalSessions} buổi ({enrollment.sessionDurationMinutes || 60}p/buổi)
            </dd>
          </div>
          <div className="p-3 bg-neutral-50 rounded-brand-md">
            <dt className="text-fg-muted block">Tiến độ hoàn thành:</dt>
            <dd className="font-bold text-brand-primary-700 tabular-nums">
              {completedCount} / {enrollment.totalSessions} buổi
            </dd>
          </div>
          <div className="p-3 bg-success-subtle rounded-brand-md">
            <dt className="text-success-strong block font-semibold">Tỷ lệ phí sàn:</dt>
            <dd className="font-bold text-success-strong tabular-nums">
              {(Number(enrollment.platformFeeRate || 0.1) * 100).toFixed(0)}% (Snapshot)
            </dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <div className="flex justify-between text-caption text-fg-secondary">
            <span>Tiến độ hợp đồng:</span>
            <span className="font-bold tabular-nums">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} label="Tiến độ hợp đồng" />
        </div>
      </Card>

      {/* Review Section (for Completed Enrollment) */}
      {isCompleted && (
        <Card padding="lg" className="space-y-5 border-brand-primary-200 bg-brand-primary-50/20 shadow-brand-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <CardHeader
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
                <div className="flex items-center justify-between">
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
                    <span className="text-[11px] text-fg-muted">
                      {formatDateTime(review.createdAt, 'DD/MM/YYYY HH:mm')}
                    </span>
                  )}
                </div>

                <p className="text-caption text-fg-secondary leading-relaxed m-0 italic bg-neutral-50 p-3 rounded-brand-sm border border-border/60">
                  &ldquo;{review.comment || 'Học viên không để lại lời bình.'}&rdquo;
                </p>

                {/* Tutor Reply if available */}
                {review.tutorReply && (
                  <div className="mt-3 p-3 rounded-brand-md bg-brand-primary-50/60 border border-brand-primary-200 text-caption space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-primary-800 font-bold text-xs">
                      <Icon name="chat" size="xs" />
                      <span>Phản hồi từ gia sư ({enrollment.tutorName || 'Gia sư'}):</span>
                      {review.tutorRepliedAt && (
                        <span className="text-fg-muted font-normal text-[11px] ml-auto">
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

      <Card padding="lg" className="space-y-5">
        <CardHeader
          title={`Lộ trình & Tiến độ phân rã ${enrollment.totalSessions} buổi học`}
          subtitle="Mỗi buổi học tương ứng một khoản ký quỹ riêng biệt được giải ngân sau khi đối soát thành công"
          icon={<Icon name="timeline" size="sm" />}
        />

        <ol className="space-y-3">
          {sessions.map((sess) => (
            <li
              key={sess.id}
              className={cn(
                'p-4 rounded-brand-md border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                sess.hasAttendanceConflict
                  ? 'border-danger/40 bg-danger-subtle'
                  : sess.status === SESSION_STATUS.COMPLETED
                    ? 'border-success/40 bg-success-subtle'
                    : sess.status === SESSION_STATUS.SCHEDULED
                      ? 'border-info/40 bg-info-subtle'
                      : 'border-border bg-neutral-50'
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'w-10 h-10 rounded-brand-md flex items-center justify-center font-mono font-bold text-body-reg shrink-0',
                    sess.status === SESSION_STATUS.COMPLETED
                      ? 'bg-success text-white'
                      : sess.status === SESSION_STATUS.SCHEDULED
                        ? 'bg-info text-white'
                        : 'bg-neutral-200 text-fg-secondary'
                  )}
                  aria-hidden="true"
                >
                  {sess.sessionNumber}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-body-reg text-fg">
                      Buổi học #{sess.sessionNumber}
                    </span>
                    {getStatusBadge(sess)}
                  </div>
                  <p className="text-caption text-fg-muted mt-0.5">
                    Thời gian:{' '}
                    {sess.startAt
                      ? formatDateTime(sess.startAt, 'DD/MM/YYYY HH:mm')
                      : 'Chưa xếp lịch'}
                    {sess.endAt ? ` - ${formatDateTime(sess.endAt, 'HH:mm')}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-caption">
                <div className="text-right">
                  <span className="text-[10px] text-fg-muted block">Ký quỹ buổi:</span>
                  <span className="font-bold text-fg">
                    <Money value={sess.earningAmount || 0} />
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    as={Link}
                    to={`/student/sessions/${sess.id}`}
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
                      variant="danger"
                      size="sm"
                    >
                      Khiếu nại
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
