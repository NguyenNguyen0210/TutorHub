import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { getTeachingModeMeta } from '@/config/enums';

/**
 * BookingRail — cột phải sticky: hành động + số liệu tin cậy (SPEC §4.6).
 *
 * Rail cố tình **không** lặp lại nội dung headline: headline kể con người và
 * học vấn, rail trả lời "tôi có thể làm gì tiếp" và "con số này đáng tin bao
 * nhiêu". Số liệu thiếu (tỷ lệ phản hồi, số học viên đã dạy) là V2 theo SPEC §7
 * nên bị bỏ hẳn thay vì điền 0.
 */
export default function BookingRail({ tutor }) {
  const ratingValue = Number(tutor.ratingAvg) || 0;
  const hasRating = ratingValue > 0;
  const modeMeta = getTeachingModeMeta(tutor.teachingMode);

  const stats = [];
  if (hasRating) {
    stats.push({
      key: 'rating',
      icon: 'star',
      label: 'Đánh giá trung bình',
      value: `${ratingValue.toFixed(1)} / 5`,
      extra: `${tutor.totalReviews ?? 0} đánh giá`,
    });
  }
  if (tutor.experienceYears > 0) {
    stats.push({
      key: 'exp',
      icon: 'history_edu',
      label: 'Kinh nghiệm giảng dạy',
      value: `${tutor.experienceYears} năm`,
    });
  }
  if (modeMeta.label) {
    stats.push({ key: 'mode', icon: 'videocam', label: 'Hình thức học', value: modeMeta.label });
  }
  if (tutor.address) {
    stats.push({ key: 'addr', icon: 'location_on', label: 'Khu vực', value: tutor.address });
  }

  return (
    <aside className="space-y-4">
      <div className="lg:sticky lg:top-28 space-y-4">
        <Card padding="lg" className="space-y-4">
          <div>
            <Button
              as={Link}
              to={`/app/messages?tutorId=${tutor.id}`}
              variant="primary"
              fullWidth
              size="lg"
              icon={<Icon name="chat" size="sm" />}
            >
              Nhắn tin với gia sư
            </Button>
            <p className="text-[12px] text-fg-muted text-center mt-2 m-0">
              Trao đổi trực tiếp để được tư vấn lộ trình phù hợp.
            </p>
          </div>

          {stats.length > 0 && (
            <>
              <div className="border-t border-border" />
              <ul className="space-y-3">
                {stats.map((s) => (
                  <li key={s.key} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0"
                    >
                      <Icon name={s.icon} size="xs" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-fg-muted m-0">{s.label}</p>
                      <p className="text-caption font-semibold text-fg tabular-nums m-0 break-words">
                        {s.value}
                      </p>
                      {s.extra && (
                        <p className="text-[12px] text-fg-muted m-0 tabular-nums">{s.extra}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-caption font-semibold text-fg m-0 mb-1">
              Học phí bảo chứng Escrow
            </p>
            <p className="text-[12px] text-fg-muted leading-relaxed m-0">
              Học phí được giữ an toàn, chỉ giải ngân cho gia sư sau khi từng buổi học
              hoàn thành và bạn xác nhận.
            </p>
          </div>
        </Card>
      </div>
    </aside>
  );
}

BookingRail.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ratingAvg: PropTypes.number,
    totalReviews: PropTypes.number,
    experienceYears: PropTypes.number,
    teachingMode: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
};
