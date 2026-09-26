import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { formatRelativeTime } from '@/utils/formatters';

const TONE_CLASS = {
  holding: 'border-holding/30 bg-holding-subtle',
  danger: 'border-danger/30 bg-danger-subtle',
  info: 'border-info/30 bg-info-subtle',
  default: 'border-border bg-surface',
};

const SPINE_CLASS = {
  holding: 'bg-holding',
  danger: 'bg-danger',
  info: 'bg-info',
  default: 'bg-neutral-300',
};

/**
 * ActionQueue — "việc đang chờ mình", xếp theo hạn chót tăng dần.
 *
 * Đây là phần "memorable" của Operational Ledger: mọi màn vận hành đều dựng
 * từ cùng một nguyên tắc — thứ tiền bị giữ phải nằm trên cùng, không phải sau
 * 4 thẻ số liệu.
 *
 * Renders nothing when `items` is empty: không có việc thì không hiện "mọi thứ
 * ổn" ảo — im lặng là thông tin đúng.
 */
export default function ActionQueue({ items, title = 'Việc đang chờ bạn', className }) {
  const sorted = useMemo(() => {
    return [...items]
      .filter(Boolean)
      .sort((a, b) => {
        // `priority` thắng `deadlineAt`: một số việc không có mốc hạn (buổi chưa xếp
        // lịch → `startAt` null) nhưng vẫn phải lên trước việc có deadline, vì
        // học viên đang chờ mình chứ không phải vì đồng hồ đang đếm ngược.
        const pa = a.priority ?? 0;
        const pb = b.priority ?? 0;
        if (pa !== pb) return pa - pb;
        const at = a.deadlineAt ? Date.parse(a.deadlineAt) : Number.MAX_SAFE_INTEGER;
        const bt = b.deadlineAt ? Date.parse(b.deadlineAt) : Number.MAX_SAFE_INTEGER;
        return at - bt;
      });
  }, [items]);

  if (sorted.length === 0) return null;

  return (
    <section className={cn('space-y-2', className)} aria-label={title}>
      <h2 className="text-caption font-semibold uppercase tracking-wide text-fg-secondary">
        {title}
      </h2>
      <ul className="space-y-2">
        {sorted.map((item) => (
          <li
            key={item.key}
            className={cn(
              'flex flex-col sm:flex-row sm:items-center gap-3 rounded-brand-lg border pl-0 pr-0 overflow-hidden',
              TONE_CLASS[item.tone] || TONE_CLASS.default
            )}
          >
            <span
              aria-hidden="true"
              className={cn('hidden sm:block w-1 self-stretch shrink-0', SPINE_CLASS[item.tone])}
            />
            <div className="flex-1 min-w-0 px-3.5 sm:px-4 py-3 flex items-start gap-3">
              <Icon
                name={item.icon || 'pending_actions'}
                size="sm"
                className={cn(
                  'shrink-0 mt-0.5',
                  item.tone === 'danger'
                    ? 'text-danger-strong'
                    : item.tone === 'holding'
                      ? 'text-holding-strong'
                      : 'text-info'
                )}
              />
              <div className="min-w-0">
                <p className="text-caption font-semibold text-fg leading-snug">{item.title}</p>
                {item.detail && (
                  <p className="text-[12px] text-fg-secondary leading-snug mt-0.5">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 px-3.5 sm:px-4 sm:pl-0 pb-3 sm:pb-0 sm:flex-col sm:items-end sm:gap-1.5">
              {item.deadlineAt && (
                <span className="text-[12px] text-fg-muted whitespace-nowrap tabular-nums">
                  {formatRelativeTime(item.deadlineAt)}
                </span>
              )}
              {item.action}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

ActionQueue.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      /** Số nhỏ hơn = lên trước. Mặc định 0. Ưu tiên trên deadlineAt. */
      priority: PropTypes.number,
      detail: PropTypes.string,
      deadlineAt: PropTypes.string,
      icon: PropTypes.string,
      tone: PropTypes.oneOf(['holding', 'danger', 'info', 'default']),
      action: PropTypes.node,
    })
  ),
  title: PropTypes.string,
  className: PropTypes.string,
};

