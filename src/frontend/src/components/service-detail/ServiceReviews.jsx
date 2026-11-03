import React, { useState } from 'react';
import ReportAction from '@/components/reports/ReportAction';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatDateTime } from '@/utils/formatters';

export default function ServiceReviews({
  reviews,
  ratingAvg,
  totalReviews,
  satisfactionRate,
  serviceTitle = '',
  ratingDistribution,
}) {
  const [filterRating, setFilterRating] = useState('all');

  const rawList = Array.isArray(reviews) ? reviews : [];
  const avg = (Number(ratingAvg) || 0).toFixed(1);
  const total = Number(totalReviews) || 0;
  const reviewList = rawList;
  const distribution = ratingDistribution || [0, 0, 0, 0, 0];
  const displaySatisfaction = satisfactionRate ?? 0;

  const filterTabs = [
    { key: 'all', label: `Tất cả đánh giá (${total})`, count: total },
    { key: '5', label: `5 Sao (${distribution[4]})`, count: distribution[4] },
    { key: '4', label: `4 Sao (${distribution[3]})`, count: distribution[3] },
    { key: '3', label: `3 Sao (${distribution[2]})`, count: distribution[2] },
  ];

  const filteredList = reviewList.filter((item) => {
    if (filterRating === 'all') return true;
    return Math.round(Number(item.rating) || 5) === Number(filterRating);
  });

  return (
    <div id="reviews" className="bg-white rounded-brand-lg border border-border p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-secondary-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
          Đánh giá & Nhận xét từ học viên
        </h2>
      </div>

      {/* Rating Overview Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-neutral-50/70 rounded-2xl border border-neutral-100 mb-8 items-center">
        {/* Left score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-neutral-200/80 pb-6 md:pb-0 md:pr-6">
          <span className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-2 tabular-nums">
            {avg}
          </span>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Icon key={s} name="star" size="sm" filled={s <= Math.round(Number(avg))} className={s <= Math.round(Number(avg)) ? 'w-4 h-4 text-amber-500' : 'w-4 h-4 text-neutral-300'} />
            ))}
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Dựa trên {total} lượt đánh giá của gói học
          </span>
          <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full text-xs font-bold bg-success-subtle text-success-strong">
            {total > 0 ? `${displaySatisfaction}% học viên hài lòng` : 'Chưa có đánh giá'}
          </span>
        </div>

        {/* Right bars */}
        <div className="md:col-span-8 flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-fg-secondary font-semibold flex items-center gap-1 tabular-nums">
                  {star} <Icon name="star" size="xs" filled className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-neutral-200/70 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-fg-muted font-medium tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs with count & disabled states for 0% */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filterTabs.map((tab) => {
          const isSelected = filterRating === tab.key;
          const isDisabled = tab.count === 0 && tab.key !== 'all';

          return (
            <button
              key={tab.key}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) setFilterRating(tab.key);
              }}
              title={isDisabled ? 'Chưa có đánh giá nào ở mức sao này' : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-brand-primary-600 text-white shadow-xs'
                  : isDisabled
                  ? 'bg-neutral-100/60 text-neutral-400 opacity-40 cursor-not-allowed border border-dashed border-neutral-200'
                  : 'bg-neutral-100 text-fg-secondary hover:bg-neutral-200 hover:text-fg cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
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
          {filteredList.map((item) => {
            const comment = item.comment || '';
            const tutorReply = item.tutorReply || null;
            const itemCourseName = item.serviceTitle || serviceTitle;

            return (
              <div key={item.id} className="py-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={item.studentAvatarUrl} name={item.studentName} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-fg">
                          {item.studentName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary-50 text-brand-primary-700">
                          <Icon name="verified" size="xs" className="w-3 h-3 text-brand-primary-600" />
                          Đã học
                        </span>
                        {/* Tên gói học cụ thể gắn kèm nhãn Đã học */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                          <Icon name="local_library" size="xs" className="w-3 h-3 text-brand-primary-600" />
                          <span>{itemCourseName}</span>
                        </span>
                      </div>
                      <span className="text-xs text-fg-muted mt-0.5 block">
                        {formatDateTime(item.createdAt, 'DD/MM/YYYY')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: Math.max(0, Math.min(5, Number(item.rating) || 0)) }).map((_, i) => (
                      <Icon key={i} name="star" size="xs" filled className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                </div>

                {comment && (
                  <p className="text-sm text-neutral-700 leading-relaxed pl-[52px]">
                    {comment}
                  </p>
                )}

                {/* Tutor Official Reply */}
                <ReportAction type="review" targetId={item.id} />
                {tutorReply && (
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
                      {tutorReply}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ServiceReviews.propTypes = {
  ratingDistribution: PropTypes.arrayOf(PropTypes.number),
  reviews: PropTypes.array,
  ratingAvg: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  totalReviews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  satisfactionRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  serviceTitle: PropTypes.string,
};
