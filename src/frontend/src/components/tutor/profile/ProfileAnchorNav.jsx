import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@/components/ui/Tabs';
import { scrollToSection, observeActiveSection } from './sectionNav';

/**
 * ProfileAnchorNav — thanh điều hướng neo sticky dưới topbar (SPEC §4.3).
 *
 * Dùng lại component `Tabs` chung để giữ đúng ngôn ngữ thị giác + focus ring
 * của design system; nội dung tabpanel rỗng nên được ẩn đi vì đây là
 * điều hướng trong trang, không phải bộ chuyển panel.
 *
 * Active tab theo vị trí đang đọc (IntersectionObserver), click thì cuộn mượt
 * và tôn trọng `prefers-reduced-motion`.
 */
export default function ProfileAnchorNav({ sections }) {
  const ids = sections.map((s) => s.id);
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = observeActiveSection(ids);
    // Observer bắn sự kiện bất đồng bộ; poll nhẹ theo nhịp scroll là đủ và
    // tránh thêm state/render cho từng entry.
    const timer = window.setInterval(() => {
      const id = observer.read();
      if (id) setActive(id);
    }, 200);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const handleChange = (id) => {
    setActive(id);
    scrollToSection(id);
  };

  return (
    <Tabs
      className="sticky top-[64px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-surface/95 backdrop-blur-sm border-b border-border [&_[role=tabpanel]]:hidden"
      tabs={sections.map((s) => ({ key: s.id, label: s.label }))}
      value={active}
      onChange={handleChange}
    />
  );
}

ProfileAnchorNav.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
};
