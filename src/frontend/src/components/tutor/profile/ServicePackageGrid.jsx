import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/common/EmptyState';
import { SectionShell } from './SectionShell';
import ServicePackageCard from './ServicePackageCard';

const VISIBLE_LIMIT = 4;

/**
 * ServicePackageGrid — Section "Dịch vụ học tập" của hồ sơ gia sư.
 * Sử dụng lưới 2 cột rộng 100% giúp các thẻ gói học giãn đều, đẹp mắt
 * và ngang bằng hoàn hảo với khung Giới thiệu ở trên.
 */
export default function ServicePackageGrid({
  services = [],
  tutorId,
  bookingId = null,
  onBook,
}) {
  const list = Array.isArray(services) ? services : [];
  const visible = list.slice(0, VISIBLE_LIMIT);

  return (
    <SectionShell
      id="goi-hoc"
      title="Dịch vụ học tập"
      icon="inventory_2"
      className="mt-8"
      action={
        <div className="flex items-center gap-3">
          {list.length > VISIBLE_LIMIT && (
            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-caption font-semibold text-brand-primary-700 hover:text-brand-primary-800 transition-colors whitespace-nowrap"
            >
              Xem tất cả
              <Icon name="arrow_forward" size="xs" />
            </Link>
          )}
          <Badge variant="primary" size="sm">
            {list.length} gói học
          </Badge>
        </div>
      }
    >
      {list.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="Gia sư chưa niêm yết gói học nào"
          description="Bạn có thể gửi tin nhắn để trao đổi lộ trình và thương lượng gói học riêng."
          actionLabel="Nhắn tin với gia sư"
          actionPath={`/app/messages?tutorId=${tutorId}`}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full items-stretch">
            {visible.map((service) => (
              <ServicePackageCard
                key={service.id}
                service={service}
                isBooking={bookingId === service.id}
                onBook={onBook}
              />
            ))}
          </div>

          {list.length > VISIBLE_LIMIT && (
            <p className="text-caption text-fg-muted mt-4 text-center">
              Đang hiển thị {VISIBLE_LIMIT} trong {list.length} gói học. Xem thêm trên sàn giao dịch
              để xem toàn bộ.
            </p>
          )}
        </>
      )}
    </SectionShell>
  );
}

ServicePackageGrid.propTypes = {
  services: PropTypes.arrayOf(PropTypes.object),
  tutorId: PropTypes.string.isRequired,
  bookingId: PropTypes.string,
  onBook: PropTypes.func.isRequired,
};
