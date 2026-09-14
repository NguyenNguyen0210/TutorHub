import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Progress,
  Avatar,
  Badge,
  Alert,
  Spin,
  Tooltip,
} from 'antd';
import {
  SafetyCertificateFilled,
  LockFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  VideoCameraFilled,
  ArrowRightOutlined,
  BookOutlined,
  AlertFilled,
  ThunderboltFilled,
} from '@ant-design/icons';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { formatCurrency } from '@/utils/formatters';

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [ens, sess] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          sessionService.getMySessions(),
        ]);
        setEnrollments(ens || []);
        setSessions(sess || []);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang tải bàn học sinh & két bảo chứng Escrow..." />
      </div>
    );
  }

  const activeContract = enrollments[0];
  const nextSession = sessions[0];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 space-y-8">
      {/* 1. TOP WELCOME & ESCROW FINANCIAL METRICS (4 CARDS) */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bàn Học Của Tôi — Chào Tuấn! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi lộ trình học tập, bảo chứng học phí Escrow và đối soát điểm danh hai chiều.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              className="rounded-xl bg-brand-indigo-600 font-bold shadow-sm hover:bg-brand-indigo-500"
              onClick={() => navigate('/tutors')}
            >
              + Tìm Thêm Gia Sư
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Escrow Holding */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
                Tiền Ký Quỹ Escrow An Toàn
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <SafetyCertificateFilled />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-emerald-700">
              {formatCurrency(activeContract?.escrowHoldingAmount || 1600000)}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600/90 font-medium">
              ✓ Bảo chứng 100% • Chưa giải ngân
            </p>
          </div>

          {/* Card 2: Lớp học hôm nay */}
          <div className="rounded-2xl border border-brand-indigo-100 bg-gradient-to-br from-brand-indigo-50/60 via-white to-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-brand-indigo-800 tracking-wider">
                Lớp Học Kế Tiếp
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo-100 text-brand-indigo-600">
                <CalendarOutlined />
              </div>
            </div>
            <div className="mt-3 text-xl font-extrabold text-slate-900">
              Hôm nay 18:00
            </div>
            <p className="mt-1 text-[11px] text-brand-indigo-600 font-medium line-clamp-1">
              Toán THPT • ThS. Nguyễn Văn An
            </p>
          </div>

          {/* Card 3: Tiến độ khóa học */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Tiến Độ Hợp Đồng
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <ThunderboltFilled />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-slate-900">
              2 / 10 <span className="text-xs font-normal text-slate-400">buổi</span>
            </div>
            <Progress percent={20} size="small" strokeColor="#4F46E5" className="m-0 mt-1" />
          </div>

          {/* Card 4: Cảnh báo đối soát */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">
                Đối Soát Điểm Danh
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/80 text-amber-700">
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="mt-3 text-xl font-extrabold text-amber-900">
              Cửa Sổ 24h Mở
            </div>
            <p className="mt-1 text-[11px] text-amber-700 font-medium">
              Cần điểm danh Buổi 3 sau khi học xong
            </p>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING SESSIONS & MEET LINK BANNER */}
      {nextSession && (
        <div className="rounded-2xl border border-brand-indigo-200 bg-gradient-to-r from-brand-indigo-900 to-brand-navy-950 p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo-500/30 px-3 py-1 text-xs font-bold text-brand-indigo-200 border border-brand-indigo-400/30 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                BUỔI HỌC SẮP DIỄN RA HÔM NAY
              </span>
              <h3 className="text-xl font-bold text-white m-0">
                {nextSession.title}
              </h3>
              <p className="m-0 mt-1.5 text-xs text-slate-300">
                Gia sư: <strong className="text-white">{nextSession.tutorName}</strong> • Thời gian: 18:00 - 19:00 (60 phút) • Múi giờ GMT+7
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Button
                type="primary"
                size="large"
                icon={<VideoCameraFilled />}
                className="rounded-xl bg-emerald-600 font-bold border-0 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 h-11"
                href={nextSession.meetUrl}
                target="_blank"
              >
                Vào Lớp Google Meet
              </Button>
              <Button
                size="large"
                className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 h-11"
                onClick={() => navigate(`/student/sessions/${nextSession.id}`)}
              >
                Cửa Sổ Đối Soát Điểm Danh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE LEARNING CONTRACTS (HỢP ĐỒNG ĐANG HỌC) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 m-0">
            Hợp Đồng Học Tập Đang Hoạt Động (Escrow Contracts)
          </h2>
          <span className="text-xs text-slate-500">
            Tổng giá trị bảo vệ: {formatCurrency(2000000)}
          </span>
        </div>

        {enrollments.map((en) => (
          <div
            key={en.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-brand-indigo-300 hover:shadow-md"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Tutor & Title */}
              <div className="flex items-start gap-4">
                <Avatar
                  src={en.tutorAvatar}
                  size={56}
                  className="border border-brand-indigo-100 bg-brand-indigo-50"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-indigo-600 bg-brand-indigo-50 px-2 py-0.5 rounded">
                      {en.contractCode}
                    </span>
                    <Tag color="emerald" className="font-bold border-0 px-2.5 py-0.5 rounded-full text-xs">
                      ĐANG HỌC
                    </Tag>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1.5 mb-0.5">
                    {en.serviceTitle}
                  </h3>

                  <p className="text-xs text-slate-500 m-0">
                    Gia sư: <strong className="text-slate-700">{en.tutorName}</strong> • {en.tutorEducation}
                  </p>
                </div>
              </div>

              {/* Progress & Escrow Status */}
              <div className="flex flex-col md:items-end gap-1 w-full md:w-auto">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Tiến độ:</span>{' '}
                    <strong className="text-slate-800">{en.completedSessions}/{en.totalSessions} buổi</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Escrow giữ an toàn:</span>{' '}
                    <strong className="text-emerald-700">{formatCurrency(en.escrowHoldingAmount)}</strong>
                  </div>
                </div>

                <div className="w-full md:w-56 mt-2">
                  <Progress
                    percent={Math.round((en.completedSessions / en.totalSessions) * 100)}
                    strokeColor="#4F46E5"
                    size="small"
                  />
                </div>
              </div>

              {/* Action */}
              <div>
                <Button
                  type="primary"
                  className="rounded-xl bg-brand-indigo-600 font-bold hover:bg-brand-indigo-500"
                  onClick={() => navigate(`/student/enrollments/${en.id}`)}
                >
                  Quản Trị Hợp Đồng <ArrowRightOutlined />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
