import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Money from '@/components/ui/Money';

/**
 * SignedAmount — biến động tiền có dấu, là neo thị giác của mọi bảng sổ cái.
 *
 * Quy tắc SPEC §2.4: tiền KHÔNG dùng `font-mono` (chỉ mã kỹ thuật/timestamp mới
 * dùng mono). Vì vậy ở đây chỉ `tabular-nums` + font semibold.
 */
export default function SignedAmount({ amount, direction, className, showZero = true }) {
  const value = Number(amount) || 0;
  if (value === 0 && !showZero) return <span className="text-fg-muted">—</span>;

  const isCredit = direction === 'Credit';
  return (
    <span
      className={cn(
        'font-semibold tabular-nums whitespace-nowrap',
        isCredit ? 'text-success-strong' : 'text-danger-strong',
        className
      )}
    >
      {isCredit ? '+' : '−'}
      <Money value={Math.abs(value)} />
    </span>
  );
}

SignedAmount.propTypes = {
  amount: PropTypes.number,
  direction: PropTypes.oneOf(['Credit', 'Debit']).isRequired,
  className: PropTypes.string,
  showZero: PropTypes.bool,
};

