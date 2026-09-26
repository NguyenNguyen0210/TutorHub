import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatDateTime } from '@/utils/formatters';

export default function ServiceReviews({ reviews, ratingAvg, totalReviews, satisfactionRate }) {
  const [filterRating, setFilterRating] = useState('all');

  const reviewList = Array.isArray(reviews) ? reviews : [];
  const avg = Number(ratingAvg) > 0 ? Number(ratingAvg).toFixed(1) : '5.0';
  const total = Number(totalReviews) || reviewList.length;

  const filteredList = reviewList.filter((item) => {
    if (filterRating === 'all') return true;
    return item.rating === Number(filterRating);
  });

  return (
    <div id="reviews" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-secondary-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
          Đánh giá & Nhận xét từ học viên
        </h2>
      </div>

      {/* Rating Overview Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-neutral-50/70 rounded-xl border border-neutral-100 mb-8 items-center">
        {/* Left score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-neutral-200/80 pb-6 md:pb-0 md:pr-6">
          <span className="text-5xl font-black text-fg tracking-tight leading-none mb-2">
            {avg}
          </span>
          <div className="flex items-center gap-1 text-brand-secondary-400 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Icon key={s} name="star" size="sm" className="w-4 h-4 fill-brand-secondary-400" />
            ))}
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Dựa trên {total} lượt đánh giá thực tế
          </span>
          {satisfactionRate != null && (
            <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full text-xs font-bold bg-success-subtle text-success-strong">
              {satisfactionRate}% học viên hài lòng
            </span>
          )}
        </div>

        {/* Right bars */}
        <div className="md:col-span-8 flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviewList.filter((r) => r.rating === star).length;
            const pct = reviewList.length > 0 ? (count / reviewList.length) * 100 : star === 5 ? 90 : 10;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-fg-secondary font-semibold flex items-center gap-1">
                  {star} <Icon name="star" size="xs" className="w-3.5 h-3.5 text-brand-secondary-400 fill-brand-secondary-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-neutral-200/70 overflow-hidden">
                  <div
                    className="h-full bg-brand-secondary-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-fg-muted font-medium">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả đánh giá' },
          { key: '5', label: '5 Sao' },
          { key: '4', label: '4 Sao' },
          { key: '3', label: '3 Sao' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterRating(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterRating === tab.key
                ? 'bg-brand-primary-600 text-white shadow-sm'
                : 'bg-neutral-100 text-fg-secondary hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review Items List */}
      {filteredList.length === 0 ? (
        <div className="text-center py-10 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
          <Icon name="rate_review" size="lg" className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500 font-medium">
            Chưa có đánh giá nào cho bộ lọc này.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100">
          {filteredList.map((item) => (
            <div key={item.id} className="py-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={item.studentAvatarUrl} name={item.studentName} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-fg">
                        {item.studentName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary-50 text-brand-primary-700">
                        <Icon name="verified" size="xs" className="w-3 h-3 text-brand-primary-600" />
                        Đã học
                      </span>
                    </div>
                    <span className="text-xs text-fg-muted">
                      {formatDateTime(item.createdAt, 'DD/MM/YYYY')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-brand-secondary-400">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Icon key={i} name="star" size="xs" className="w-4 h-4 fill-brand-secondary-400" />
                  ))}
                </div>
              </div>

              {item.comment && (
                <p className="text-sm text-neutral-700 leading-relaxed pl-[52px]">
                  {item.comment}
                </p>
              )}

              {/* Tutor Official Reply */}
              {item.tutorReply && (
                <div className="ml-[52px] p-3.5 bg-brand-primary-50/50 rounded-xl border border-brand-primary-100/80 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary-800">
                    <Icon name="reply" size="xs" className="w-3.5 h-3.5 text-brand-primary-600" />
                    <span>Phản hồi từ gia sư</span>
                    {item.tutorRepliedAt && (
                      <span className="text-[11px] font-normal text-fg-muted ml-1">
                        • {formatDateTime(item.tutorRepliedAt, 'DD/MM/YYYY')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {item.tutorReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ServiceReviews.propTypes = {
  reviews: PropTypes.array,
  ratingAvg: PropTypes.number,
  totalReviews: PropTypes.number,
  satisfactionRate: PropTypes.number,
};
