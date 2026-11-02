import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { formatDateTime } from '@/utils/formatters';
import { SectionShell } from './SectionShell';
import tutorService from '@/services/tutor.service';

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
          className={i < rounded ? 'text-amber-400' : 'text-neutral-200'}
        />
      ))}
    </span>
  );
}

Stars.propTypes = { rating: PropTypes.number, className: PropTypes.string };

/**
 * ReviewsSection — Khu vực đánh giá từ học viên.
 * Đã đồng bộ số lượng đánh giá trên từng thanh sao, bổ sung nút Xem thêm,
 * chuyển icon phản hồi sang Reply và chuẩn hóa nội dung mẫu về Tiếng Anh.
 */
export default function ReviewsSection({ tutor, reviews = [] }) {
  const [items, setItems] = useState(() => (Array.isArray(reviews) ? reviews : []));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setItems(Array.isArray(reviews) ? reviews : []);
  }, [reviews]);

  const totalReviews = Number(tutor.totalReviews) || 0;
  const ratingValue = Number(tutor.ratingAvg) || 0;
  const distribution = tutor.ratingDistribution || [0, 0, 0, 0, 0];
  const loaded = items.length;

  // Xử lý nạp thêm đánh giá khi bấm nút "Xem thêm đánh giá"
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      let newItems = [];

      // 1. Thử gọi API backend phân trang
      if (tutor?.id) {
        const nextPage = Math.floor(items.length / 10) + 1;
        const res = await tutorService.getTutorReviews(tutor.id, nextPage, 10);
        if (res?.items?.length > 0) {
          newItems = res.items.filter((item) => !items.some((ex) => ex.id === item.id));
        }
      }

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setHasMore(false);
      }
    } catch {
      // Leave the existing reviews intact; the user may retry loading.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SectionShell id="danh-gia" title="Đánh giá từ học viên" icon="star" className="mt-8">
      <Card padding="lg" className="space-y-6 rounded-2xl border border-border shadow-sm">
        {items.length === 0 && totalReviews === 0 ? (
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
                <p className="text-headline-page leading-none font-extrabold text-slate-900 tabular-nums">
                  {ratingValue.toFixed(1)}
                </p>
                <div className="mt-2">
                  <Stars rating={ratingValue} />
                </div>
                <p className="text-[12px] text-fg-muted mt-1.5 tabular-nums font-medium">
                  {totalReviews > 0 ? `${totalReviews} đánh giá` : `${loaded} đánh giá`}
                </p>
              </div>

              <ul className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star - 1] || 0;
                  const totalCountForBar = totalReviews > 0 ? totalReviews : loaded;
                  const pct = totalCountForBar > 0 ? Math.round((count / totalCountForBar) * 100) : 0;

                  return (
                    <li key={star} className="flex items-center gap-2.5">
                      <span className="text-[12px] text-fg-secondary tabular-nums w-6 shrink-0 font-medium">
                        {star}★
                      </span>
                      <span
                        className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden"
                        role="img"
                        aria-label={`${star} sao: ${count} đánh giá`}
                      >
                        <span
                          className="block h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-[12px] text-fg-muted tabular-nums w-8 text-right shrink-0 font-medium">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Danh sách các đánh giá */}
            <ul className="space-y-4">
              {items.map((review) => {
                const comment = review.comment || '';
                const reply = review.tutorReply || null;
                const courseBadge = review.serviceTitle || null;

                return (
                  <li
                    key={review.id}
                    className="p-4 rounded-xl bg-neutral-50/70 border border-border space-y-3"
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
                            <span className="text-body-reg font-semibold text-slate-900">
                              {review.studentName}
                            </span>
                            <span className="text-[10px] text-success-strong bg-success-subtle border border-success/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                              Đã hoàn thành khóa học
                            </span>
                            {courseBadge && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-neutral-700 border border-neutral-200/90 shadow-xs">
                                <Icon name="local_library" size="xs" className="w-3 h-3 text-brand-primary-600" />
                                <span>{courseBadge}</span>
                              </span>
                            )}
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

                    {comment && (
                      <p className="text-caption text-fg-secondary leading-relaxed m-0">
                        {comment}
                      </p>
                    )}

                    {/* Phản hồi từ gia sư với icon reply */}
                    {reply && (
                      <div className="p-3.5 rounded-xl bg-surface border border-blue-100/90 text-caption text-fg-secondary ml-3 sm:ml-4 space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <p className="flex items-center gap-1.5 text-blue-800 font-semibold text-[12px] m-0">
                          <Icon name="reply" size="xs" className="text-blue-600" />
                          <span>Phản hồi từ gia sư {tutor.fullName || ''}:</span>
                        </p>
                        <p className="text-fg-secondary leading-relaxed m-0">{reply}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Dòng trạng thái + Nút Xem thêm đánh giá */}
            {totalReviews > loaded && (
              <div className="pt-2 text-center space-y-2.5 border-t border-border/60">
                <p className="text-caption text-fg-muted m-0">
                  Đang hiển thị {loaded} trong {totalReviews} đánh giá.
                </p>
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    icon={!loadingMore && <Icon name="expand_more" size="xs" />}
                    className="font-medium text-[13px] px-4 shadow-xs"
                  >
                    Xem thêm đánh giá
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </SectionShell>
  );
}

ReviewsSection.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    ratingAvg: PropTypes.number,
    totalReviews: PropTypes.number,
    ratingDistribution: PropTypes.arrayOf(PropTypes.number),
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
