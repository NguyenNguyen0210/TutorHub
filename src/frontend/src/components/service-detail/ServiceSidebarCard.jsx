import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Money from '@/components/ui/Money';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import bookingService from '@/services/booking.service';

export default function ServiceSidebarCard({ service, onBookNow }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, role } = useAuthStore();
  const [bookingLoading, setBookingLoading] = useState(false);

  const tutor = service.tutor || {};
  const totalSessions = Number(service.totalSessions) > 0 ? Number(service.totalSessions) : null;
  const sessionDuration = Number(service.sessionDurationMinutes) > 0
    ? Number(service.sessionDurationMinutes)
    : null;
  const price = Number(service.price) || 0;
  const pricePerSession = Number(service.pricePerSession) > 0
    ? Number(service.pricePerSession)
    : price > 0 && totalSessions
    ? Math.round(price / totalSessions)
    : null;

  const handleMessageTutor = () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/services/${service.id}`);
      return;
    }
    // Navigate to messages with tutor's userId
    navigate(`/app/messages?userId=${tutor.userId}`);
  };

  const handlePrimaryAction = async () => {
    if (onBookNow) {
      onBookNow();
      return;
    }
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập với tài khoản học viên để tiến hành đăng ký.');
      navigate(`/auth/login?redirect=/services/${service.id}`);
      return;
    }
    if (role === 'Tutor') {
      toast.warning('Bạn đang đăng nhập bằng tài khoản Gia sư. Vui lòng dùng tài khoản Học viên để đặt lịch.');
      return;
    }
    try {
      setBookingLoading(true);
      const booking = await bookingService.createBooking(service.id);
      if (booking?.id) {
        toast.success('Đã giữ chỗ thành công 15 phút! Đang chuyển đến cổng thanh toán...');
        navigate(`/student/bookings/${booking.id}/checkout`);
      }
    } catch (err) {
      toast.error(err?.message || 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="sticky top-24 bg-white rounded-brand-xl border border-neutral-200/90 shadow-brand-md p-6 flex flex-col gap-6">
      {/* Price Header */}
      <div>
        <span className="text-xs font-medium text-neutral-500 block mb-1">
          Học phí trọn gói khóa học
        </span>
        <div className="flex items-baseline gap-2">
          {price > 0 ? (
            <Money value={price} className="text-3xl font-black text-fg tracking-tight" />
          ) : (
            <span className="text-2xl font-bold text-fg">Liên hệ</span>
          )}
        </div>
        {pricePerSession && totalSessions && <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
          <span>Trung bình:</span>
          <strong className="text-neutral-700">
            <Money value={pricePerSession} />
          </strong>
          <span>/ buổi ({totalSessions} buổi học)</span>
        </p>}
      </div>

      {/* Package Key Specifications */}
      <div className="py-4 border-y border-neutral-100 flex flex-col gap-3 text-xs sm:text-sm">
        {totalSessions && <div className="flex items-center justify-between">
          <span className="text-neutral-500 flex items-center gap-2">
            <Icon name="event_repeat" size="xs" className="w-4 h-4 text-brand-primary-600" />
            Số lượng buổi:
          </span>
          <span className="font-bold text-fg">{totalSessions} buổi học</span>
        </div>}

        {sessionDuration && <div className="flex items-center justify-between">
          <span className="text-neutral-500 flex items-center gap-2">
            <Icon name="schedule" size="xs" className="w-4 h-4 text-brand-primary-600" />
            Thời lượng mỗi buổi:
          </span>
          <span className="font-bold text-fg">
            {sessionDuration} phút / buổi
          </span>
        </div>}

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 flex items-center gap-2">
            <Icon name="laptop_chromebook" size="xs" className="w-4 h-4 text-brand-primary-600" />
            Hình thức đào tạo:
          </span>
          <span className="font-bold text-fg">
            {service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
              ? 'Tại nhà / Offline'
              : service.teachingMode === 'Both'
              ? 'Online hoặc Tại nhà'
              : 'Online 1 kèm 1'}
          </span>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={bookingLoading}
          onClick={handlePrimaryAction}
          className="w-full !rounded-xl !py-3.5 text-base font-bold shadow-brand-sm hover:shadow-brand-md gap-2"
        >
          <span>Đăng ký học ngay</span>
          <Icon name="arrow_forward" size="sm" className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleMessageTutor}
          className="w-full !rounded-xl !py-2.5 text-sm font-semibold gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        >
          <Icon name="chat" size="sm" className="w-4 h-4 text-brand-primary-600" />
          <span>Nhắn tin tư vấn với gia sư</span>
        </Button>
      </div>

      {/* Trust & Guarantee Box */}
      <div className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-200/70 flex flex-col gap-3">
        <span className="text-xs font-semibold text-neutral-700 block">
          Cơ chế bảo vệ học phí
        </span>

        <div className="flex items-start gap-2.5 text-xs text-fg-secondary">
          <Icon name="security" size="xs" className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
          <span>
            <strong className="text-fg">Bảo chứng Escrow:</strong> Tiền học được bảo đảm, gia sư chỉ nhận tiền sau khi từng buổi học hoàn tất.
          </span>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-fg-secondary">
          <Icon name="autorenew" size="xs" className="w-4 h-4 text-brand-primary-600 shrink-0 mt-0.5" />
          <span>
            <strong className="text-fg">Khiếu nại trước giải ngân:</strong> Tiền của buổi học được giữ lại trong lúc sự cố được xử lý.
          </span>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-fg-secondary">
          <Icon name="schedule" size="xs" className="w-4 h-4 text-holding shrink-0 mt-0.5" />
          <span>
            <strong className="text-fg">Grace period 12 giờ:</strong> Học viên có thời gian báo cáo sự cố trước khi buổi học tự động giải ngân.
          </span>
        </div>
      </div>
    </div>
  );
}

ServiceSidebarCard.propTypes = {
  service: PropTypes.object.isRequired,
  onBookNow: PropTypes.func,
};
