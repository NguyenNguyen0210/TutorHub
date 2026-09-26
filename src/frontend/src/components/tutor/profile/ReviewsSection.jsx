import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { formatDateTime } from '@/utils/formatters';
import { SectionShell } from './SectionShell';

/** Phân bố sao 5→1 tính từ danh sách đánh giá đã tải (không bịa số liệu). */
function buildDistribution(reviews) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
    counts[star - 1] += 1;
  });
  return counts;
}

function Stars({ rating = 0, className = '' }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size="xs"
          filled={i < rounded}
          className={i < rounded ? 'text-brand-secondary-500' : 'text-neutral-300'}
        />
      ))}
    </span>
  );
}

Stars.propTypes = { rating: PropTypes.number, className: PropTypes.string };

/**
 * ReviewsSection — đánh giá từ học viên (SPEC §4.5).
 *
 * Thanh phân bố sao chỉ hiện khi có đánh giá thật trong payload; `totalReviews`
 * từ hồ sơ có thể lớn hơn số bản ghi đã tải nên phần thống kê ghi rõ
 * "trên tổng số" thay vì bịa tỷ lệ.
 */
export default function ReviewsSection({ tutor, reviews = [] }) {
  const list = Array.isArray(reviews) ? reviews : [];
  const totalReviews = Number(tutor.totalReviews) || 0;
  const ratingValue = Number(tutor.ratingAvg) || 0;
  const distribution = buildDistribution(list);
  const loaded = list.length;

  return (
    <SectionShell id="danh-gia" title="Đánh giá từ học viên" icon="star" className="mt-8">
      <Card padding="lg" className="space-y-5">
        {list.length === 0 ? (
          <div className="py-8 text-center">
            <Icon name="chat" size="md" className="mx-auto text-neutral-300 mb-2" />
            <p className="text-caption text-fg-muted m-0">
              Gia sư chưa có đánh giá nào từ học viên.
            </p>
          </div>
        ) : (
          <>
            {/* Tóm tắt: điểm trung bình + phân bố sao */}
            <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center pb-5 border-b border-border">
              <div className="text-center sm:text-left">
                <p className="text-headline-page leading-none font-bold text-fg tabular-nums">
                  {ratingValue.toFixed(1)}
                </p>
                <div className="mt-1.5">
                  <Stars rating={ratingValue} />
                </div>
                <p className="text-[12px] text-fg-muted mt-1.5 tabular-nums">
                  {totalReviews > 0 ? `${totalReviews} đánh giá` : 'Chưa có đánh giá'}
                </p>
              </div>

              <ul className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star - 1];
                  const pct = loaded > 0 ? (count / loaded) * 100 : 0;
                  return (
                    <li key={star} className="flex items-center gap-2.5">
                      <span className="text-[12px] text-fg-secondary tabular-nums w-6 shrink-0">
                        {star}★
                      </span>
                      <span
                        className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden"
                        role="img"
                        aria-label={`${star} sao: ${count} đánh giá`}
                      >
                        <span
                          className="block h-full rounded-full bg-brand-secondary-500"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-[12px] text-fg-muted tabular-nums w-6 text-right shrink-0">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <ul className="space-y-4">
              {list.map((review) => (
                <li
                  key={review.id}
                  className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={review.studentAvatarUrl}
                        name={review.studentName}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-body-reg font-semibold text-fg">
                            {review.studentName}
                          </span>
                          <span className="text-[10px] text-success-strong bg-success-subtle border border-success/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                            Đã hoàn thành khóa học
                          </span>
                        </div>
                        <span className="text-[12px] text-fg-muted">
                          {formatDateTime(review.createdAt, 'DD/MM/YYYY')}
                        </span>
                      </div>
                    </div>

                    <div role="img" aria-label={`Đánh giá ${review.rating} trên 5 sao`}>
                      <Stars rating={review.rating} />
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-caption text-fg-secondary leading-relaxed m-0">
                      {review.comment}
                    </p>
                  )}

                  {review.tutorReply && (
                    <div className="p-3.5 rounded-brand-md bg-surface border border-brand-primary-100 text-caption text-fg-secondary ml-4 space-y-1.5">
                      <p className="flex items-center gap-1.5 text-brand-primary-700 font-semibold text-[12px] m-0">
                        <Icon name="support_agent" size="xs" className="text-brand-primary-600" />
                        <span>Phản hồi từ gia sư {tutor.fullName}:</span>
                      </p>
                      <p className="text-fg-secondary leading-relaxed m-0">{review.tutorReply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {totalReviews > loaded && (
              <p className="text-caption text-fg-muted text-center pt-1">
                Đang hiển thị {loaded} trong {totalReviews} đánh giá.
              </p>
            )}
          </>
        )}
      </Card>
    </SectionShell>
  );
}

ReviewsSection.propTypes = {
  tutor: PropTypes.shape({
    fullName: PropTypes.string,
    ratingAvg: PropTypes.number,
    totalReviews: PropTypes.number,
  }).isRequired,
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      studentName: PropTypes.string,
      studentAvatarUrl: PropTypes.string,
      rating: PropTypes.number,
      comment: PropTypes.string,
      tutorReply: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
};

