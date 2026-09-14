import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Tag,
  Progress,
  Avatar,
  Divider,
  Spin,
  Alert,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  SafetyCertificateFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  VideoCameraFilled,
  MessageOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  StopOutlined,
} from '@ant-design/icons';
import ProRataRefundModal from '@/components/financial/ProRataRefundModal';
import enrollmentService from '@/services/enrollment.service';
import { formatCurrency } from '@/utils/formatters';

export default function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await enrollmentService.getEnrollmentById(id);
        setEnrollment(data);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết hợp đồng:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleConfirmCancel = async (reason) => {
    await enrollmentService.cancelEnrollment(enrollment.id, reason);
    // Cập nhật trạng thái hợp đồng cục bộ
    setEnrollment((prev) => ({
      ...prev,
      status: 'Cancelled',
      escrowHoldingAmount: 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang tải hợp đồng học tập & timeline 10 buổi con..." />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="p-12 text-center">
        <h3>Không tìm thấy hợp đồng học tập!</h3>
        <Button onClick={() => navigate('/student/dashboard')}>Về Bàn Học</Button>
      </div>
    );
  }

  const percent = Math.round((enrollment.completedSessions / enrollment.totalSessions) * 100);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/student/dashboard">Bàn học</Link> },
              { title: 'Hợp đồng học tập' },
              { title: enrollment.contractCode },
            ]}
          />
          <Link
            to="/student/dashboard"
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600"
          >
            <ArrowLeftOutlined /> Quay lại bàn học
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* CONTRACT HEADER HERO */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="flex items-start gap-4">
              <Avatar
                src={enrollment.tutorAvatar}
                size={72}
                className="border-2 border-brand-indigo-100 bg-brand-indigo-50 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-indigo-700 bg-brand-indigo-50 px-2.5 py-1 rounded-lg">
                    {enrollment.contractCode}
                  </span>
                  <Tag
                    color={enrollment.status === 'Active' ? 'emerald' : 'default'}
                    className="font-bold border-0 px-2.5 py-0.5 rounded-full text-xs"
                  >
                    {enrollment.status === 'Active' ? 'ĐANG HIỆU LỰC' : 'ĐÃ HỦY / DỪNG'}
                  </Tag>
                  <Tag color="purple" className="text-xs">
                    Chính sách phí sàn 10% (v{enrollment.feePolicyVersion || 1})
                  </Tag>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 mt-2 mb-1">
                  {enrollment.serviceTitle}
                </h1>

                <p className="text-xs text-slate-500 m-0">
                  Gia sư:{' '}
                  <strong className="text-slate-800 font-semibold">{enrollment.tutorName}</strong> •{' '}
                  {enrollment.tutorEducation} • SĐT: {enrollment.tutorPhone}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <Button
                icon={<MessageOutlined />}
                className="rounded-xl border-slate-200 text-slate-600 hover:text-brand-indigo-600"
                onClick={() => navigate('/app/messages')}
              >
                Nhắn Tin Gia Sư
              </Button>

              {enrollment.status === 'Active' && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  className="rounded-xl font-semibold"
                  onClick={() => setShowCancelModal(true)}
                >
                  Hủy Hợp Đồng Sớm (Hoàn Tiền)
                </Button>
              )}
            </div>
          </div>

          {/* Progress & Financial Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-bold">Tiến Độ Lộ Trình</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {enrollment.completedSessions} / {enrollment.totalSessions} buổi con
              </div>
              <Progress percent={percent} strokeColor="#4F46E5" size="small" className="mt-1" />
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider font-bold">Đang Ký Quỹ Trong Escrow</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {formatCurrency(enrollment.escrowHoldingAmount)}
              </div>
              <p className="m-0 text-slate-500 text-[11px] mt-0.5">
                Bảo chứng cho {enrollment.totalSessions - enrollment.completedSessions} buổi học còn lại
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider font-bold">Đã Giải Ngân Cho Gia Sư</span>
              <div className="text-xl font-extrabold text-slate-700 mt-1">
                {formatCurrency(enrollment.disbursedAmount)}
              </div>
              <p className="m-0 text-slate-500 text-[11px] mt-0.5">
                Đã giải ngân sau đối soát 2 buổi hoàn thành
              </p>
            </div>
          </div>
        </div>

        {/* TIMELINE 10 BUỔI HỌC CON */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 m-0">
                Lộ Trình Phân Rã 10 Buổi Học Con (Sessions Breakdown)
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Mỗi buổi học được khóa bảo chứng 200.000 ₫ trong Escrow. Hoàn thành buổi nào giải ngân buổi đó.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-indigo-600 bg-brand-indigo-50 px-3 py-1 rounded-full">
              Đơn giá: {formatCurrency(enrollment.perSessionPrice)} / buổi
            </span>
          </div>

          <div className="space-y-4">
            {enrollment.sessions?.map((sess) => {
              const isDone = sess.status === 'Completed';
              const isToday = sess.status === 'Scheduled';
              const isPendingSchedule = sess.status === 'Unscheduled';

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isToday
                      ? 'border-brand-indigo-300 bg-brand-indigo-50/30 shadow-sm ring-1 ring-brand-indigo-400/30'
                      : isDone
                      ? 'border-slate-200 bg-slate-50/60'
                      : 'border-slate-200/70 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Session info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-700'
                            : isToday
                            ? 'bg-brand-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isDone ? <CheckCircleFilled /> : sess.sessionNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 m-0">
                            {sess.title}
                          </h4>
                          {isDone && (
                            <Tag color="success" className="font-bold text-[10px] rounded-full border-0">
                              ĐÃ HOÀN THÀNH
                            </Tag>
                          )}
                          {isToday && (
                            <Tag color="processing" className="font-bold text-[10px] rounded-full border-0 animate-pulse">
                              HÔM NAY 18:00
                            </Tag>
                          )}
                          {isPendingSchedule && (
                            <Tag color="default" className="text-[10px] rounded-full">
                              CHƯA XẾP LỊCH
                            </Tag>
                          )}
                        </div>

                        {/* Schedule time */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          {sess.startAt ? (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <CalendarOutlined /> {new Date(sess.startAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Chưa chọn thời gian học</span>
                          )}
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            {isDone ? '✓ Đã giải ngân 200.000 ₫' : '🔒 Đang giữ trong Escrow 200.000 ₫'}
                          </span>
                        </div>

                        {/* Learning Record if done */}
                        {sess.learningRecord && (
                          <div className="mt-2 rounded-xl bg-white border border-slate-200/80 p-2.5 text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Nhật ký buổi học: </span>
                            {sess.learningRecord}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {isToday && (
                        <>
                          <Button
                            type="primary"
                            icon={<VideoCameraFilled />}
                            className="rounded-xl bg-emerald-600 font-bold border-0 hover:bg-emerald-500 text-xs h-9"
                            href={sess.meetUrl}
                            target="_blank"
                          >
                            Vào Google Meet
                          </Button>
                          <Button
                            className="rounded-xl border-brand-indigo-300 text-brand-indigo-600 hover:bg-brand-indigo-50 font-semibold text-xs h-9"
                            onClick={() => navigate(`/student/sessions/${sess.id}`)}
                          >
                            Đối Soát Điểm Danh
                          </Button>
                        </>
                      )}

                      {isPendingSchedule && (
                        <Button
                          size="small"
                          className="rounded-lg text-xs font-medium text-slate-600 hover:text-brand-indigo-600"
                          onClick={() => message.info('Chọn giờ từ lịch rảnh tuần của gia sư An để xếp lịch.')}
                        >
                          Xếp Lịch Học
                        </Button>
                      )}

                      {isDone && (
                        <Button
                          type="text"
                          size="small"
                          className="text-xs text-slate-400 hover:text-slate-600"
                          onClick={() => navigate(`/student/sessions/${sess.id}`)}
                        >
                          Xem Lại Biên Bản
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL HỦY HỢP ĐỒNG PRO-RATA */}
      <ProRataRefundModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        enrollment={enrollment}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
