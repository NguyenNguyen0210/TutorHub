import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { scrollToSection, SECTION_IDS } from './sectionNav';

/**
 * MobileBookingBar — CTA kép dính đáy màn hình, chỉ hiện trên mobile.
 *
 * Ở desktop rail sticky đã có CTA nên thanh này bị ẩn để không trùng lặp.
 * Không có animation: tôn trọng prefers-reduced-motion).
 */
export default function MobileBookingBar({ tutorId, show = true }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_-8px_rgb(var(--brand-navy-900)/0.15)]">
      <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2.5">
        <Button
          as={Link}
          to={`/app/messages?tutorId=${tutorId}`}
          variant="outline"
          size="md"
          className="flex-1 min-h-[44px]"
          icon={<Icon name="chat" size="sm" />}
        >
          Nhắn tin
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 min-h-[44px]"
          icon={<Icon name="lock_clock" size="sm" />}
          onClick={() => scrollToSection(SECTION_IDS.services)}
        >
          Xem gói học
        </Button>
      </div>
    </div>
  );
}

MobileBookingBar.propTypes = {
  tutorId: PropTypes.string.isRequired,
  show: PropTypes.bool,
};

