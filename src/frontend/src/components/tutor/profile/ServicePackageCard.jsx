import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import { getTeachingModeMeta } from '@/config/enums';

/**
 * ServicePackageCard — card gói học trong hồ sơ gia sư (SPEC §4.4).
 *
 * Giá theo mô hình **package-first** đồng bộ với màn hình quản lý gia sư:
 * giá trọn gói là thông tin chính (20px/700), giá quy đổi mỗi buổi chỉ là
 * tham khảo (12px muted) — tránh tạo cảm giác TutorHub bán lẻ từng buổi.
 */
export default function ServicePackageCard({ service, isBooking = false, onBook }) {
  const totalSessions = Number(service.totalSessions) || 0;
  const price = Number(service.price) || 0;
  const perSession = totalSessions > 0 ? Math.round(price / totalSessions) : null;
  const modeMeta = getTeachingModeMeta(service.teachingMode);
  const hasTrial = Boolean(service.hasTrialLesson);

  const benefits = [
    { key: 'sessions', text: `${totalSessions} buổi học 1 kèm 1 (${service.sessionDurationMinutes} phút/buổi)` },
    { key: 'mode', text: `Hình thức: ${modeMeta.label}` },
    { key: 'escrow', text: 'Giải ngân từng buổi sau khi bạn xác nhận' },
    { key: 'reschedule', text: 'Được đổi lịch báo trước tối thiểu 24 giờ' },
  ];

  return (
    <Card
      as="article"
      padding="none"
      className={`flex flex-col overflow-hidden transition-all duration-200 ${
        hasTrial
          ? 'border-brand-primary-300 shadow-brand-md'
          : 'border-border hover:border-brand-primary-200 hover:shadow-brand-md'
      }`}
    >
      {hasTrial && (
        <p className="bg-brand-primary-600 text-white text-[11px] font-bold px-3 py-1.5 text-center tracking-wide flex items-center justify-center gap-1.5">
          <Icon name="star" size="xs" filled />
          HỖ TRỢ BUỔI HỌC THỬ
        </p>
      )}

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-brand-primary-700 uppercase tracking-wide truncate">
              {service.subjectName}
            </span>
            <Badge variant={modeMeta.color} size="sm">
              {modeMeta.label}
            </Badge>
          </div>
          <Link
            to={`/services/${service.id}`}
            className="block text-[16px] font-semibold text-fg leading-snug hover:text-brand-primary-600 transition-colors line-clamp-2"
          >
            {service.title}
          </Link>
        </div>

        {/* Giá: gói học là thông tin chính, giá/buổi chỉ để tham khảo */}
        <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border space-y-1.5">
          <p className="text-caption text-fg-muted font-medium">Học phí trọn gói</p>
          <p className="text-[20px] font-bold text-fg leading-none">
            <Money value={price} />
          </p>
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border">
            <span className="text-[13px] text-fg-secondary">Gói {totalSessions} buổi</span>
            <span className="text-[12px] text-fg-muted tabular-nums">
              {perSession === null ? '—' : `≈ ${perSession.toLocaleString('vi-VN')}đ/buổi`}
            </span>
          </div>
        </div>

        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b.key} className="flex items-start gap-2 text-caption text-fg-secondary">
              <Icon
                name="check_circle"
                size="xs"
                className="text-brand-primary-600 shrink-0 mt-0.5"
              />
              <span className="min-w-0">{b.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5 pt-0 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            as={Link}
            to={`/services/${service.id}`}
            variant="outline"
            size="md"
            iconRight={<Icon name="arrow_forward" size="xs" />}
          >
            Chi tiết
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isBooking}
            onClick={() => onBook(service)}
            icon={!isBooking && <Icon name="lock_clock" size="sm" />}
          >
            Giữ chỗ ngay
          </Button>
        </div>
        <p className="text-[10px] text-center text-fg-muted flex items-center justify-center gap-1.5">
          <Icon name="verified_user" size="xs" />
          Thanh toán VNPay · Học phí bảo chứng Escrow
        </p>
      </div>
    </Card>
  );
}

ServicePackageCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    subjectName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
    teachingMode: PropTypes.string,
    hasTrialLesson: PropTypes.bool,
  }).isRequired,
  isBooking: PropTypes.bool,
  onBook: PropTypes.func.isRequired,
};

