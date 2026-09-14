import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import {
  SafetyCertificateFilled,
  ClockCircleOutlined,
  CalendarOutlined,
  ThunderboltFilled,
  MessageOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function ServiceCard({ service, tutor }) {
  const navigate = useNavigate();

  const handleBooking = () => {
    // Chuyển tới checkout đặt chỗ giữ chỗ 15 phút
    navigate('/student/bookings/new-booking-hold/checkout', {
      state: {
        serviceId: service.id,
        serviceTitle: service.title,
        tutorName: tutor.fullName,
        tutorAvatar: tutor.avatarUrl,
        price: service.price,
        totalSessions: service.totalSessions,
        sessionDurationMinutes: service.sessionDurationMinutes,
        teachingMode: service.teachingMode,
      },
    });
  };

  const perSessionPrice = Math.round(service.price / service.totalSessions);

  return (
    <div className="glass-surface relative flex flex-col justify-between rounded-2xl border-2 border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-brand-indigo-500 hover:shadow-xl">
      {/* Best value tag if 10 or 15 sessions */}
      {service.totalSessions >= 10 && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-brand-indigo-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">
          <ThunderboltFilled className="text-[10px]" /> GÓI TIẾT KIỆM PHỔ BIẾN
        </span>
      )}

      <div>
        {/* Header Title & Tag */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {service.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>

        {/* Specs Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo-50 px-2.5 py-1 font-semibold text-brand-indigo-700">
            <CalendarOutlined /> {service.totalSessions} Buổi Học
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            <ClockCircleOutlined /> {service.sessionDurationMinutes} phút / buổi
          </span>
          <Tag color="purple" className="m-0 rounded-lg px-2 py-0.5 text-xs">
            {service.teachingMode === 'Both' ? 'Online / Tại nhà' : service.teachingMode}
          </Tag>
        </div>

        {/* Value Highlights */}
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckOutlined className="text-emerald-500 font-bold" />
            <span>Phân rã lộ trình {service.totalSessions} buổi con có nhật ký học tập</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckOutlined className="text-emerald-500 font-bold" />
            <span>Được quyền hủy hợp đồng sớm nhận lại tiền các buổi chưa học</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckOutlined className="text-emerald-500 font-bold" />
            <span>Link học Google Meet chất lượng cao & đối soát điểm danh 24h</span>
          </div>
        </div>
      </div>

      {/* Pricing & Escrow Guarantee Footer */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-2xl font-extrabold text-brand-indigo-600">
              {formatCurrency(service.price)}
            </div>
            <div className="text-xs text-slate-400">
              Tương đương <span className="font-semibold text-slate-600">{formatCurrency(perSessionPrice)}</span> / buổi
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              Miễn phí sàn cho học viên (0%)
            </span>
          </div>
        </div>

        {/* Escrow callout banner */}
        <div className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 flex items-start gap-2">
          <SafetyCertificateFilled className="text-emerald-600 text-sm mt-0.5 flex-shrink-0" />
          <span>
            <strong>Bảo chứng Escrow 2 chiều:</strong> Toàn bộ số tiền được giữ trong ví ký quỹ TutorHub. Sàn chỉ giải ngân từng buổi ({formatCurrency(perSessionPrice)}) sau khi bạn hoàn thành buổi học và điểm danh 24h.
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Button
            icon={<MessageOutlined />}
            className="rounded-xl text-slate-600 hover:text-brand-indigo-600"
            onClick={() => navigate('/app/messages')}
          >
            Thương Lượng
          </Button>

          <Button
            type="primary"
            className="flex-1 rounded-xl bg-brand-indigo-600 font-bold shadow-md shadow-brand-indigo-600/20 hover:bg-brand-indigo-500 h-10 text-sm"
            onClick={handleBooking}
          >
            Đặt Mua Gói (Giữ Chỗ 15p)
          </Button>
        </div>
      </div>
    </div>
  );
}
