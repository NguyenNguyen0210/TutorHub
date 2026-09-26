import React from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/ui/Badge';
import {
  SESSION_STATUS,
  SESSION_STATUS_META,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_META,
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_META,
} from '@/config/enums';

/**
 * Map trạng thái → (nhãn, màu) theo domain.
 *
 * Trước đây mỗi page tự viết chuỗi `status === 'X' ? ... : ...` (4 file, dễ lệch
 * nhãn với màu). Ở đây gom một chỗ; resolver truyền vào từ `config/enums` nên
 * không lặp lại nhãn.
 */
const ENROLLMENT_STATUS_META = {
  Pending: { label: 'Chờ kích hoạt', color: 'holding' },
  Active: { label: 'Đang hiệu lực', color: 'success' },
  Completed: { label: 'Đã hoàn tất', color: 'info' },
  Cancelled: { label: 'Đã hủy', color: 'danger' },
};

const TOPUP_STATUS_META = {
  Pending: { label: 'Chờ xác nhận', color: 'holding' },
  Confirmed: { label: 'Đã cộng tiền', color: 'success' },
  Rejected: { label: 'Đã từ chối', color: 'danger' },
};

const RESOLVERS = {
  session: (v) => SESSION_STATUS_META[v] || { label: v, color: 'neutral' },
  enrollment: (v) => ENROLLMENT_STATUS_META[v] || { label: v, color: 'neutral' },
  attendance: (v) => ATTENDANCE_STATUS_META[v] || { label: v, color: 'neutral' },
  withdrawal: (v) => WITHDRAWAL_STATUS_META[v] || { label: v, color: 'neutral' },
  topup: (v) => TOPUP_STATUS_META[v] || { label: v, color: 'neutral' },
};

export function getStateMeta(domain, value) {
  if (value === null || value === undefined || value === '') {
    return { label: '—', color: 'neutral' };
  }
  const resolve = RESOLVERS[domain] || RESOLVERS.session;
  return resolve(value) || { label: String(value), color: 'neutral' };
}

/**
 * StateBadge — badge trạng thái duy nhất của vùng workspace.
 * Màu = trạng thái (SPEC §2.2), không phải trang trí.
 */
export default function StateBadge({ status, domain = 'session', size = 'sm', className }) {
  const { label, color } = getStateMeta(domain, status);
  return (
    <Badge variant={color} size={size} className={className}>
      {label}
    </Badge>
  );
}

StateBadge.propTypes = {
  status: PropTypes.string,
  domain: PropTypes.oneOf([
    'session',
    'enrollment',
    'attendance',
    'withdrawal',
    'topup',
  ]),
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
};


export { ENROLLMENT_STATUS_META, TOPUP_STATUS_META, SESSION_STATUS, ATTENDANCE_STATUS, WITHDRAWAL_STATUS };
