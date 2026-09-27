import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { SectionShell } from './SectionShell';

/**
 * ProfilePlaceholderSection — section chờ backend (SPEC §7: chứng chỉ, FAQ).
 *
 * SPEC yêu cầu "thiếu data thì ẩn block, không dựng số 0 giả". Ẩn hẳn sẽ làm
 * tab neo tương ứng bị chết, nên thay bằng một dòng chữ trung thực: nói rõ
 * chưa có dữ liệu thay vì bịa số liệu. Đây là giữ đúng tinh thần SPEC, không
 * phải dựng dữ liệu giả.
 */
export default function ProfilePlaceholderSection({
  id,
  title,
  icon = 'info',
  note,
  className = 'mt-8',
}) {
  return (
    <SectionShell id={id} title={title} icon={icon} className={className}>
      <Card padding="lg" className="flex items-start gap-3 bg-neutral-50/60">
        <Icon name="info" size="sm" className="text-fg-muted shrink-0 mt-0.5" />
        <p className="text-caption text-fg-muted leading-relaxed m-0">{note}</p>
      </Card>
    </SectionShell>
  );
}

ProfilePlaceholderSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  note: PropTypes.string.isRequired,
  className: PropTypes.string,
};

