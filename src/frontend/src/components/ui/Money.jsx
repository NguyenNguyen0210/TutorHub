import React from 'react';
import { cn } from '@/lib/cn';

const groupFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/**
 * Money — hiển thị số tiền VND theo chuẩn fintech.
 *
 * Inter semibold + tabular-nums (chữ số thẳng cột nhưng gọn, hiện đại — thay cho
 * JetBrains Mono vốn trông như máy đánh chữ khi dùng cho tiền tệ); đơn vị ₫ thu
 * nhỏ 0.8em để tạo phân cấp thị giác.
 *
 * JetBrains Mono (`font-mono`) chỉ giữ cho: mã GD, correlationId, countdown,
 * traceId — KHÔNG dùng cho tiền.
 */
export default function Money({ value, className, unitClassName, unit = '₫' }) {
  const num = groupFormatter.format(Number(value) || 0);
  return (
    <span className={cn('tabular-nums tracking-tight', className)}>
      {num}
      <span className={cn('text-[0.8em] font-semibold opacity-70 ml-0.5', unitClassName)}>
        {unit}
      </span>
    </span>
  );
}
