import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Avatar,
  Tag,
  Button,
  Tabs,
  Rate,
  Spin,
  Breadcrumb,
  Card,
  Divider,
} from 'antd';
import {
  CheckCircleFilled,
  SafetyCertificateFilled,
  EnvironmentOutlined,
  CalendarOutlined,
  MessageOutlined,
  StarFilled,
  TrophyFilled,
  ClockCircleFilled,
  PlayCircleOutlined,
  ArrowLeftOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import AvailabilityMatrix from '@/components/discovery/AvailabilityMatrix';
import ServiceCard from '@/components/discovery/ServiceCard';
import ReviewsList from '@/components/discovery/ReviewsList';
import tutorService from '@/services/tutor.service';
import { formatCurrency } from '@/utils/formatters';

export default function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services'); // Mặc định mở Tab Gói học

  useEffect(() => {
    async function loadTutor() {
      setLoading(true);
      try {
        const data = await tutorService.getTutorById(id);
        setTutor(data);
      } catch (err) {
        console.error('Lỗi khi tải hồ sơ gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTutor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang tải hồ sơ gia sư & gói học..." />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="p-12 text-center">
        <h3>Không tìm thấy gia sư!</h3>
        <Button onClick={() => navigate('/tutors')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'services',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <ThunderboltFilled className="text-amber-500" />
          Danh Mục Gói Học ({tutor.services?.length || 0})
        </span>
      ),
      children: (
        <div className="space-y-6 pt-2">
          <div className="rounded-xl border border-brand-indigo-100 bg-brand-indigo-50/50 p-4 text-xs text-brand-indigo-900 flex items-start gap-3">
            <SafetyCertificateFilled className="text-brand-indigo-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <strong>Quy trình bảo chứng hợp đồng học tập trọn gói:</strong> Khi đặt mua gói học, học phí sẽ được giữ trong ví Escrow. TutorHub sẽ cấp phát tự động N buổi học con tương ứng với lộ trình. Mỗi buổi học hoàn thành và đối soát điểm danh 24h, sàn mới giải ngân đơn giá từng buổi cho gia sư.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutor.services?.map((svc) => (
              <ServiceCard key={svc.id} service={svc} tutor={tutor} />
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'availability',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <CalendarOutlined />
          Thời Khóa Biểu Tuần
        </span>
      ),
      children: (
        <div className="pt-2">
          <AvailabilityMatrix availability={tutor.availability} />
        </div>
      ),
    },
    {
      key: 'bio',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <PlayCircleOutlined />
          Giới Thiệu & Video Dạy Thử
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Tiểu Sử & Phương Pháp Sư Phạm
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </p>
            </div>

            {/* Trial Video Embed */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <PlayCircleOutlined className="text-brand-indigo-600" /> Video Bài Giảng Học Thử 30 Phút
              </h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner">
                <iframe
                  src={tutor.trialLessonUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                  title="Video học thử"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                * Video bài giảng mẫu đã qua kiểm định âm thanh và tác phong sư phạm bởi ban chuyên môn TutorHub.
              </p>
            </div>
          </div>

          {/* Right sidebar credentials */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Bằng Cấp & Chứng Chỉ Đã Xác Minh
              </h4>
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircleFilled className="text-emerald-600" /> Bằng Cử Nhân / Thạc Sĩ
                  </div>
                  <p className="m-0 mt-1 text-slate-600 font-medium">
                    {tutor.education}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="font-bold text-slate-800">Kinh Nghiệm Giảng Dạy</div>
                  <p className="m-0 mt-1 text-slate-600">
                    {tutor.experienceYears} năm kinh nghiệm chuyên sâu
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="font-bold text-slate-800">Khu Vực & Địa Chỉ</div>
                  <p className="m-0 mt-1 text-slate-600">
                    {tutor.address || 'Hỗ trợ giảng dạy Online toàn quốc'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'reviews',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <StarFilled className="text-amber-500" />
          Đánh Giá Đối Soát ({tutor.totalReviews})
        </span>
      ),
      children: (
        <div className="pt-2">
          <ReviewsList
            reviews={tutor.reviews}
            rating={tutor.rating}
            totalReviews={tutor.totalReviews}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/tutors">Gia sư</Link> },
              { title: tutor.fullName },
            ]}
          />
          <Link
            to="/tutors"
            className="flex items-center gap-1 text-slate-500 hover:text-brand-indigo-600 font-medium"
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </Link>
        </div>
      </div>

      {/* HEADER PROFILE HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy-950 via-slate-900 to-brand-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-md">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar & Bio title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <Avatar
                  src={tutor.avatarUrl}
                  size={96}
                  className="border-4 border-white/20 bg-brand-indigo-50 shadow-xl"
                />
                <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-2 border-slate-900">
                  <CheckCircleFilled className="text-sm" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white m-0">
                    {tutor.fullName}
                  </h1>
                  <Tag color="emerald" className="font-bold border-0 px-2.5 py-0.5 rounded-full">
                    ĐÃ KIỂM ĐỊNH KYC
                  </Tag>
                </div>

                <p className="mt-1 text-sm font-medium text-brand-indigo-300">
                  {tutor.education}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-amber-400 text-sm">
                    ★ {tutor.rating.toFixed(1)} <span className="text-xs font-normal text-slate-400">({tutor.totalReviews} đánh giá)</span>
                  </span>
                  <span>•</span>
                  <span>{tutor.experienceYears} năm kinh nghiệm</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <EnvironmentOutlined /> {tutor.address || 'Toàn quốc'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Escrow Badge & Action */}
            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-base font-extrabold text-emerald-400">
                    {tutor.totalCompletedSessions || 86}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Buổi Đã Dạy</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-base font-extrabold text-brand-indigo-400">
                    0/2
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Strikes Phạt</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-base font-extrabold text-amber-400">
                    100%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Hoàn Thành</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto mt-1">
                <Button
                  icon={<MessageOutlined />}
                  className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 h-10 px-4"
                  onClick={() => navigate('/app/messages')}
                >
                  Nhắn Tin
                </Button>
                <Button
                  type="primary"
                  className="flex-1 md:flex-none rounded-xl bg-brand-indigo-600 font-bold hover:bg-brand-indigo-500 h-10 px-6 shadow-md shadow-brand-indigo-600/30"
                  onClick={() => setActiveTab('services')}
                >
                  Chọn Gói Học Ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY CONTENT: TABS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
            className="custom-tutor-tabs"
          />
        </div>
      </div>
    </div>
  );
}
