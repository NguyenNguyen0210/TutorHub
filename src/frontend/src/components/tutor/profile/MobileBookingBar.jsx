import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { scrollToSection, SECTION_IDS } from './sectionNav';

/**
 * MobileBookingBar — CTA kép dính đáy màn hình, chỉ hiện trên mobile (SPEC §3.2).
 *
 * Ở desktop rail sticky đã có CTA nên thanh này bị ẩn để không trùng lặp.
 * Không có animation (SPEC §5: tôn trọng prefers-reduced-motion).
 */
export default function MobileBookingBar({ tutorId, show = true }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface border-t border-border shadow-[0_-4px_16px_-8px_rgb(15_23_42/0.15)]">
      <div className="px-4 py-3 flex items-center gap-2.5">
        <Button
          as={Link}
          to={`/app/messages?tutorId=${tutorId}`}
          variant="outline"
          size="md"
          className="flex-1"
          icon={<Icon name="chat" size="sm" />}
        >
          Nhắn tin
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
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

