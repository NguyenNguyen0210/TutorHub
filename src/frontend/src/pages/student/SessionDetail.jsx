import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, Button, Tag, Avatar, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  VideoCameraFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  SafetyCertificateFilled,
  MessageOutlined,
  AlertFilled,
} from '@ant-design/icons';
import AttendanceCard from '@/components/feedback/AttendanceCard';
import sessionService from '@/services/session.service';
import { formatCurrency } from '@/utils/formatters';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const data = await sessionService.getSessionById(id);
        setSession(data);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết buổi học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang tải phòng học & đối soát điểm danh..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-12 text-center">
        <h3>Không tìm thấy buổi học!</h3>
        <Button onClick={() => navigate('/student/dashboard')}>Về Bàn Học</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/student/dashboard">Bàn học</Link> },
              { title: <Link to={`/student/enrollments/${session.enrollmentId}`}>Hợp đồng</Link> },
              { title: `Buổi ${session.sessionNumber}` },
            ]}
          />
          <Link
            to={`/student/enrollments/${session.enrollmentId}`}
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600"
          >
            <ArrowLeftOutlined /> Quay lại hợp đồng
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* SESSION HEADER HERO */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-indigo-600 bg-brand-indigo-50 px-2.5 py-0.5 rounded-md">
                  {session.contractCode} • BUỔI {session.sessionNumber}
                </span>
                <Tag color="processing" className="font-bold border-0 px-2.5 py-0.5 rounded-full text-xs">
                  {session.status === 'Scheduled' ? 'ĐÃ CÓ LỊCH HỌC' : session.status}
                </Tag>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 mb-1">
                {session.title}
              </h1>

              <p className="text-xs text-slate-500 m-0 flex items-center gap-2">
                <span>Gia sư: <strong className="text-slate-800">{session.tutorName}</strong></span>
                <span>•</span>
                <span>Học viên: <strong className="text-slate-800">{session.studentName}</strong></span>
              </p>
            </div>

            {/* Meet button */}
            <div className="flex items-center gap-3">
              <Button
                type="primary"
                size="large"
                icon={<VideoCameraFilled />}
                className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500 border-0 h-11 px-5 shadow-md shadow-emerald-600/25"
                href={session.meetUrl}
                target="_blank"
              >
                Vào Phòng Google Meet
              </Button>
            </div>
          </div>
        </div>

        {/* 2-WAY ATTENDANCE CARD (TRỌNG TÂM NGHIỆP VỤ) */}
        <AttendanceCard
          session={session}
          onAttendanceSubmitted={(outcome) => {
            console.log('Đã điểm danh:', outcome);
          }}
        />

        {/* CẢNH BÁO TRANH CHẤP NẾU CÓ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 m-0">
              Có Bất Kỳ Vấn Đề Nào Về Buổi Học Này?
            </h4>
            <p className="text-xs text-slate-500 m-0 mt-1">
              Nếu gia sư vắng mặt, vào muộn quá 15 phút hoặc không dạy đúng nội dung cam kết, bạn có thể gửi đơn khiếu nại lên Ban Trọng Tài DEC-S8.
            </p>
          </div>

          <Button
            danger
            className="rounded-xl font-bold text-xs"
            onClick={() => navigate('/student/disputes/new')}
          >
            Khiếu Nại Buổi Học Này
          </Button>
        </div>
      </div>
    </div>
  );
}
