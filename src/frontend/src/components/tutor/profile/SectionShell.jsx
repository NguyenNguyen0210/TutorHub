import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

/**
 * SectionShell — vỏ chung cho mọi section của hồ sơ: id neo + scroll-mt +
 * tiêu đề 22px/600. Tách riêng để các section chỉ lo nội dung, không lặp lại
 * class `scroll-mt` (dễ lệch nhau gây neo scroll bị lệch vị trí).
 */
export function SectionShell({
  id,
  title = null,
  icon = null,
  action = null,
  children = null,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section id={id} className={cn('scroll-mt-28', className)} aria-labelledby={`${id}-title`}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4 mb-4">
          {title && (
            <h2
              id={`${id}-title`}
              className="text-[22px] leading-tight font-semibold text-fg tracking-tight flex items-center gap-2"
            >
              {icon && <Icon name={icon} size="sm" className="text-brand-primary-600" />}
              {title}
            </h2>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

SectionShell.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.node,
  icon: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

