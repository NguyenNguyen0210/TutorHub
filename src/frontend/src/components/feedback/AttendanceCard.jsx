import React, { useState, useEffect } from 'react';
import { Button, Tag, Alert, message } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  SafetyCertificateFilled,
  AlertFilled,
} from '@ant-design/icons';
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
      message.success(`Đã gửi xác nhận điểm danh: ${outcome === 'Attended' ? 'Có Mặt' : 'Vắng Mặt'}`);
    } catch (err) {
      message.error(err?.message || 'Không thể gửi điểm danh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Cửa Sổ Đối Soát Điểm Danh 2 Chiều 24 Giờ
            </span>
            <Tag color={session.status === 'Completed' ? 'success' : 'processing'} className="font-bold text-[10px] rounded-full border-0 px-2 py-0.5">
              {session.status === 'Completed' ? 'ĐÃ HOÀN TẤT' : 'ĐANG MỞ ĐỐI SOÁT'}
            </Tag>
          </div>
          <p className="m-0 text-xs text-slate-500 mt-1">
            Hạn chót đối soát:{' '}
            <strong className="text-slate-700">
              {session.attendanceVerificationDueAt
                ? formatDateTime(session.attendanceVerificationDueAt)
                : 'Trong vòng 24h sau buổi học'}
            </strong>
            . Tiền sẽ tự động giải ngân khi hai bên cùng xác nhận có mặt.
          </p>
        </div>

        {sessionAmount > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <SafetyCertificateFilled className="text-emerald-600" />
            <span>Số tiền bảo chứng: {formatCurrency(sessionAmount)}</span>
          </div>
        )}
      </div>

      {/* 2-Column Direct Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Column 1: Học Viên (Tôi) */}
        <div className="rounded-xl border border-brand-indigo-100 bg-brand-indigo-50/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs text-slate-800 uppercase">1. Học Viên (Bạn)</span>
            {studentChoice === true ? (
              <Tag color="success" className="font-bold border-0 px-2 py-0.5 text-xs">
                <CheckCircleFilled /> ĐÃ XÁC NHẬN CÓ MẶT
              </Tag>
            ) : studentChoice === false ? (
              <Tag color="error" className="font-bold border-0 px-2 py-0.5 text-xs">
                <CloseCircleFilled /> ĐÃ BÁO VẮNG MẶT
              </Tag>
            ) : (
              <Tag color="warning" className="font-bold border-0 px-2 py-0.5 text-xs">
                CHỜ BẠN ĐIỂM DANH
              </Tag>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Bạn đã tham gia buổi học và gia sư có giảng dạy đầy đủ nội dung không?
          </p>

          <div className="flex items-center gap-2">
            <Button
              type={studentChoice === true ? 'primary' : 'default'}
              className={`flex-1 rounded-xl text-xs font-bold h-9 ${
                studentChoice === true ? 'bg-emerald-600 hover:bg-emerald-500 border-0' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
              loading={isSubmitting}
              onClick={() => handleSubmit('Attended')}
            >
              ✓ Tôi Đã Tham Gia (Attended)
            </Button>
            <Button
              danger
              type={studentChoice === false ? 'primary' : 'default'}
              className="rounded-xl text-xs font-bold h-9"
              loading={isSubmitting}
              onClick={() => handleSubmit('Absent')}
            >
              ✕ Gia Sư Vắng Mặt
            </Button>
          </div>
        </div>

        {/* Column 2: Gia Sư */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs text-slate-800 uppercase">2. Gia Sư ({tutorDisplayName})</span>
            {tutorChoice === true ? (
              <Tag color="success" className="font-bold border-0 px-2 py-0.5 text-xs">
                <CheckCircleFilled /> GIA SƯ ĐÃ XÁC NHẬN CÓ MẶT
              </Tag>
            ) : tutorChoice === false ? (
              <Tag color="error" className="font-bold border-0 px-2 py-0.5 text-xs">
                GIA SƯ BÁO VẮNG MẶT
              </Tag>
            ) : (
              <Tag color="default" className="font-medium text-xs">
                ĐANG CHỜ GIA SƯ ĐỐI SOÁT
              </Tag>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            {tutorDisplayName} có trách nhiệm xác nhận điểm danh trong vòng 24 giờ sau khi lớp học kết thúc.
          </p>

          <div className="text-xs text-slate-400 italic">
            Trạng thái hệ thống: {tutorChoice === true ? 'Gia sư đã xác nhận hoàn thành buổi học.' : 'Đang chờ đối soát từ gia sư...'}
          </div>
        </div>
      </div>

      {/* Status Alerts: Consensus vs Conflict */}
      {hasConsensus && (
        <Alert
          type="success"
          showIcon
          message="Đối Soát Thành Công — Hai Bên Đều Xác Nhận Hoàn Thành"
          description={
            <span>
              Buổi học đã được ghi nhận hoàn tất.
              {session.isPayoutReleased
                ? ` Hệ thống đã giải ngân thu nhập buổi học (${formatCurrency(sessionAmount)}) từ Escrow vào ví của gia sư.`
                : ' Hệ thống đang tiến hành thủ tục giải ngân từ quỹ bảo chứng Escrow.'}
            </span>
          }
          className="rounded-xl mb-2"
        />
      )}

      {hasConflict && (
        <Alert
          type="error"
          showIcon
          icon={<AlertFilled />}
          message="Cảnh Báo Xung Đột Điểm Danh (Attendance Conflict)"
          description={
            <div className="space-y-2">
              <p className="m-0 text-xs text-rose-800">
                Có sự bất đồng giữa xác nhận của Học viên và Gia sư. Số tiền {formatCurrency(sessionAmount)} của buổi học này đã được <strong>tự động phong tỏa trong Escrow</strong> để đảm bảo an toàn.
              </p>
              <div className="pt-1">
                <Button
                  danger
                  type="primary"
                  size="small"
                  className="rounded-lg font-bold text-xs"
                  href={`/student/disputes/new?sessionId=${session.id || ''}`}
                >
                  Mở Đơn Khiếu Nại Tranh Chấp Ngay
                </Button>
              </div>
            </div>
          }
          className="rounded-xl mb-2 border-rose-300 bg-rose-50"
        />
      )}
    </div>
  );
}
