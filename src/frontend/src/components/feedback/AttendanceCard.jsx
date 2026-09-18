import React, { useState, useEffect } from 'react';
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

export default function AttendanceCard({ session = {}, onAttendanceSubmitted }) {
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
  const sessionAmount = Number(session.earningAmount || 0);

  const handleSubmit = async (outcome) => {
    try {
      setIsSubmitting(true);
      if (onAttendanceSubmitted) {
        await onAttendanceSubmitted(outcome);
      }
      setStudentChoice(outcome === 'Attended');
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
              variant={session.status === 'Completed' ? 'success' : 'info'}
              size="sm"
            >
              {session.status === 'Completed' ? 'ĐÃ HOÀN TẤT' : 'ĐANG MỞ ĐỐI SOÁT'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="rounded-brand-md border border-brand-primary-100 bg-brand-primary-50/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-caption text-fg uppercase">1. Học Viên (Bạn)</span>
            {studentChoice === true ? (
              <Badge variant="success" size="sm" icon={<Icon name="check_circle" size="sm" />}>
                ĐÃ XÁC NHẬN CÓ MẶT
              </Badge>
            ) : studentChoice === false ? (
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
            Bạn đã tham gia buổi học và gia sư có giảng dạy đầy đủ nội dung không?
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant={studentChoice === true ? 'success' : 'outline'}
              size="sm"
              className="flex-1"
              loading={isSubmitting}
              onClick={() => handleSubmit('Attended')}
            >
              Tôi Đã Tham Gia (Attended)
            </Button>
            <Button
              variant={studentChoice === false ? 'danger' : 'outline'}
              size="sm"
              loading={isSubmitting}
              onClick={() => handleSubmit('Absent')}
            >
              Gia Sư Vắng Mặt
            </Button>
          </div>
        </div>

        <div className="rounded-brand-md border border-border bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-caption text-fg uppercase">
              2. Gia Sư ({tutorDisplayName})
            </span>
            {tutorChoice === true ? (
              <Badge variant="success" size="sm" icon={<Icon name="check_circle" size="sm" />}>
                GIA SƯ ĐÃ XÁC NHẬN CÓ MẶT
              </Badge>
            ) : tutorChoice === false ? (
              <Badge variant="danger" size="sm">
                GIA SƯ BÁO VẮNG MẶT
              </Badge>
            ) : (
              <Badge size="sm">ĐANG CHỜ GIA SƯ ĐỐI SOÁT</Badge>
            )}
          </div>

          <p className="text-caption text-fg-muted mb-3 leading-relaxed">
            {tutorDisplayName} có trách nhiệm xác nhận điểm danh trong vòng 24 giờ sau khi lớp học
            kết thúc.
          </p>

          <div className="text-caption text-fg-muted italic">
            Trạng thái hệ thống:{' '}
            {tutorChoice === true
              ? 'Gia sư đã xác nhận hoàn thành buổi học.'
              : 'Đang chờ đối soát từ gia sư...'}
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
              <Button
                variant="danger"
                size="sm"
                as="a"
                href={`/student/disputes/new?sessionId=${session.id || ''}`}
              >
                Mở Đơn Khiếu Nại Ngay
              </Button>
            }
          >
            Có sự bất đồng giữa xác nhận của Học viên và Gia sư. Số tiền{' '}
            {formatCurrency(sessionAmount)} của buổi học này đã được{' '}
            <strong>tự động phong tỏa trong Escrow</strong> để đảm bảo an toàn.
          </Callout>
        </div>
      )}
    </div>
  );
}
