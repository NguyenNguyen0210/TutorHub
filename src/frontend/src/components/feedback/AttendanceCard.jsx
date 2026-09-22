import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

function getInitialStudentChoice(session = {}) {
  if (session.studentAttendance === 'Attended' || session.studentAttendance === 0) return true;
  if (session.studentAttendance === 'Absent' || session.studentAttendance === 1) return false;
  return session.studentAttended ?? null;
}

function getInitialTutorChoice(session = {}) {
  if (session.tutorAttendance === 'Attended' || session.tutorAttendance === 0) return true;
  if (session.tutorAttendance === 'Absent' || session.tutorAttendance === 1) return false;
  return session.tutorAttended ?? null;
}

export default function AttendanceCard({ session = {}, onAttendanceSubmitted, isTutor = false }) {
  const toast = useToast();
  const [studentChoice, setStudentChoice] = useState(() => getInitialStudentChoice(session));
  const [tutorChoice, setTutorChoice] = useState(() => getInitialTutorChoice(session));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStudentChoice(getInitialStudentChoice(session));
    setTutorChoice(getInitialTutorChoice(session));
  }, [session]);

  const hasConflict =
    session.hasAttendanceConflict ||
    (studentChoice !== null && tutorChoice !== null && studentChoice !== tutorChoice);

  const hasConsensus =
    session.isPayoutReleased ||
    session.status === 'Completed' ||
    (studentChoice === true && tutorChoice === true);

  const tutorDisplayName = session.tutorName || 'Gia sư';
  const studentDisplayName = session.studentName || 'Học viên';
  const sessionAmount = Number(session.earningAmount || 0);

  const isSessionFinished = session.endAt && dayjs(session.endAt).isBefore(dayjs());
  const isUnscheduled = session.status === 'Unscheduled';
  const isCompleted = session.status === 'Completed';
  const isCancelled = session.status === 'Cancelled';

  const hasStudentSubmitted = Boolean(
    session.studentAttendanceSubmittedAt ||
    session.studentAttendance !== null && session.studentAttendance !== undefined
  );
  const hasTutorSubmitted = Boolean(
    session.tutorAttendanceSubmittedAt ||
    session.tutorAttendance !== null && session.tutorAttendance !== undefined
  );

  const hasMySideSubmitted = isTutor ? hasTutorSubmitted : hasStudentSubmitted;
  const myCurrentChoice = isTutor ? tutorChoice : studentChoice;

  const handleSubmit = async (outcome) => {
    if (!isSessionFinished) {
      toast.error('Cửa sổ đối soát chỉ mở sau khi buổi học kết thúc.');
      return;
    }

    if (hasMySideSubmitted) {
      toast.warning('Bạn đã gửi kết quả điểm danh cho buổi học này rồi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (onAttendanceSubmitted) {
        await onAttendanceSubmitted(outcome);
      }
      if (isTutor) {
        setTutorChoice(outcome === 'Attended');
      } else {
        setStudentChoice(outcome === 'Attended');
      }
      toast.success(`Đã gửi xác nhận điểm danh: ${outcome === 'Attended' ? 'Có Mặt' : 'Vắng Mặt'}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi điểm danh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-brand-lg border border-border bg-surface p-6 shadow-brand-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-body-reg text-fg uppercase tracking-wide">
              Cửa Sổ Đối Soát Điểm Danh 2 Chiều 24 Giờ
            </span>
            <Badge
              variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'info'}
              size="sm"
            >
              {isCompleted ? 'ĐÃ HOÀN TẤT' : isCancelled ? 'ĐÃ HỦY' : 'ĐANG MỞ ĐỐI SOÁT'}
            </Badge>
          </div>
          <p className="m-0 text-caption text-fg-muted mt-1">
            Hạn chót đối soát:{' '}
            <strong className="text-fg-secondary">
              {session.attendanceVerificationDueAt
                ? formatDateTime(session.attendanceVerificationDueAt)
                : 'Trong vòng 24h sau buổi học'}
            </strong>
            . Tiền sẽ tự động giải ngân khi hai bên cùng xác nhận có mặt.
          </p>
        </div>

        {sessionAmount > 0 && (
          <div className="flex items-center gap-2 text-caption font-semibold text-success-strong bg-success-subtle px-3 py-1.5 rounded-brand-md border border-success/20">
            <Icon name="shield" size="sm" />
            <span>Số tiền bảo chứng: {formatCurrency(sessionAmount)}</span>
          </div>
        )}
      </div>

      {/* Session not finished warning */}
      {!isSessionFinished && !isCompleted && !isCancelled && !isUnscheduled && (
        <Callout
          variant="holding"
          title="Buổi học chưa kết thúc"
          icon={<Icon name="schedule" size="md" />}
          className="mb-5"
        >
          Cửa sổ đối soát điểm danh sẽ tự động kích hoạt sau khi buổi học kết thúc lúc{' '}
          <strong>{formatDateTime(session.endAt)}</strong>. Vui lòng quay lại sau giờ học để thực hiện điểm danh.
        </Callout>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Box 1: Current User's Side */}
        <div className="rounded-brand-md border border-brand-primary-100 bg-brand-primary-50/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-caption text-fg uppercase">
              1. {isTutor ? 'Gia Sư (Bạn)' : 'Học Viên (Bạn)'}
            </span>
            {myCurrentChoice === true ? (
              <Badge variant="success" size="sm" icon={<Icon name="check_circle" size="sm" />}>
                ĐÃ XÁC NHẬN CÓ MẶT
              </Badge>
            ) : myCurrentChoice === false ? (
              <Badge variant="danger" size="sm" icon={<Icon name="close" size="sm" />}>
                ĐÃ BÁO VẮNG MẶT
              </Badge>
            ) : (
              <Badge variant="holding" size="sm">
                CHỜ BẠN ĐIỂM DANH
              </Badge>
            )}
          </div>

          <p className="text-caption text-fg-secondary mb-3 leading-relaxed">
            {isTutor
              ? 'Bạn đã hoàn thành việc giảng dạy buổi học này đúng cam kết thời lượng và nội dung chưa?'
              : 'Bạn đã tham gia buổi học và gia sư có giảng dạy đầy đủ nội dung không?'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant={myCurrentChoice === true ? 'success' : 'outline'}
              size="sm"
              className="flex-1"
              disabled={isSubmitting || hasMySideSubmitted || !isSessionFinished || isCompleted || isCancelled}
              loading={isSubmitting}
              onClick={() => handleSubmit('Attended')}
              icon={myCurrentChoice === true ? <Icon name="check" size="xs" /> : undefined}
            >
              {isTutor ? 'Tôi Đã Dạy Buổi Này' : 'Tôi Đã Tham Gia (Attended)'}
            </Button>
            <Button
              variant={myCurrentChoice === false ? 'danger' : 'outline'}
              size="sm"
              disabled={isSubmitting || hasMySideSubmitted || !isSessionFinished || isCompleted || isCancelled}
              loading={isSubmitting}
              onClick={() => handleSubmit('Absent')}
            >
              {isTutor ? 'Báo Học Viên Vắng' : 'Gia Sư Vắng Mặt'}
            </Button>
          </div>

          {hasMySideSubmitted && (
            <p className="text-[11px] text-fg-muted mt-2 italic m-0">
              * Điểm danh là bất biến (INV-ATT-001). Nếu có sai sót cần đính chính, vui lòng liên hệ Ban Trọng Tài.
            </p>
          )}
        </div>

        {/* Box 2: Counterpart's Side */}
        <div className="rounded-brand-md border border-border bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-caption text-fg uppercase">
              2. {isTutor ? `Học Viên (${studentDisplayName})` : `Gia Sư (${tutorDisplayName})`}
            </span>
            {(isTutor ? studentChoice : tutorChoice) === true ? (
              <Badge variant="success" size="sm" icon={<Icon name="check_circle" size="sm" />}>
                ĐỐI TÁC ĐÃ XÁC NHẬN CÓ MẶT
              </Badge>
            ) : (isTutor ? studentChoice : tutorChoice) === false ? (
              <Badge variant="danger" size="sm">
                ĐỐI TÁC BÁO VẮNG MẶT
              </Badge>
            ) : (
              <Badge size="sm">ĐANG CHỜ ĐỐI SOÁT</Badge>
            )}
          </div>

          <p className="text-caption text-fg-muted mb-3 leading-relaxed">
            {isTutor
              ? `${studentDisplayName} có trách nhiệm xác nhận điểm danh trong vòng 24 giờ sau khi lớp học kết thúc.`
              : `${tutorDisplayName} có trách nhiệm xác nhận điểm danh trong vòng 24 giờ sau khi lớp học kết thúc.`}
          </p>

          <div className="text-caption text-fg-muted italic">
            Trạng thái đối tác:{' '}
            {(isTutor ? studentChoice : tutorChoice) === true
              ? 'Đối tác đã xác nhận hoàn thành buổi học.'
              : (isTutor ? studentChoice : tutorChoice) === false
              ? 'Đối tác đã báo vắng mặt.'
              : 'Đang chờ đối soát...'}
          </div>
        </div>
      </div>

      {hasConsensus && (
        <Callout
          variant="success"
          title="Đối Soát Thành Công — Hai Bên Đều Xác Nhận Hoàn Thành"
          className="mb-2"
        >
          Buổi học đã được ghi nhận hoàn tất.
          {session.isPayoutReleased
            ? ` Hệ thống đã giải ngân thu nhập buổi học (${formatCurrency(sessionAmount)}) từ Escrow vào ví của gia sư.`
            : ' Hệ thống đang tiến hành thủ tục giải ngân từ quỹ bảo chứng Escrow.'}
        </Callout>
      )}

      {hasConflict && (
        <div className="animate-shake">
          <Callout
            variant="danger"
            title="Cảnh Báo Xung Đột Điểm Danh (Attendance Conflict)"
            className="mb-2"
            action={
              !isTutor ? (
                <Button
                  variant="danger"
                  size="sm"
                  as="a"
                  href={`/student/disputes/new?sessionId=${session.id || ''}`}
                >
                  Mở Đơn Khiếu Nại Ngay
                </Button>
              ) : undefined
            }
          >
            Có sự bất đồng giữa xác nhận của Học viên và Gia sư. Số tiền{' '}
            {formatCurrency(sessionAmount)} của buổi học này đã được{' '}
            <strong>tự động phong tỏa trong Escrow</strong> để bảo vệ quyền lợi hai bên.
            {isTutor && (
              <span className="block mt-1 text-xs">
                Ban Trọng Tài sẽ tiếp nhận hồ sơ để tiến hành đối soát và phán quyết.
              </span>
            )}
          </Callout>
        </div>
      )}
    </div>
  );
}
