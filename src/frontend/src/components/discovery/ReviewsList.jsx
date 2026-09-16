import React from 'react';
import { Avatar, Rate, Progress } from 'antd';
import { CheckCircleFilled, MessageOutlined } from '@ant-design/icons';

export default function ReviewsList({ reviews = [], rating = 4.9, totalReviews = 18 }) {
  return (
    <div className="space-y-6">
      {/* Overall Score Summary */}
      <div className="glass-surface flex flex-col md:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-8 text-center">
          <div className="text-5xl font-extrabold text-slate-900 leading-none">
            {rating.toFixed(1)}
          </div>
          <div className="mt-2 text-amber-400 text-lg">
            {'★'.repeat(5)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Dựa trên {totalReviews} đánh giá đối soát thực tế
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="flex-1 w-full space-y-1.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-12 text-slate-600 font-medium">5 sao</span>
            <Progress percent={88} strokeColor="#F59E0B" showInfo={false} className="m-0 flex-1" />
            <span className="w-8 text-slate-400 text-right">88%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-slate-600 font-medium">4 sao</span>
            <Progress percent={12} strokeColor="#F59E0B" showInfo={false} className="m-0 flex-1" />
            <span className="w-8 text-slate-400 text-right">12%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-slate-400">3 sao</span>
            <Progress percent={0} strokeColor="#F59E0B" showInfo={false} className="m-0 flex-1" />
            <span className="w-8 text-slate-300 text-right">0%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-slate-400">2 sao</span>
            <Progress percent={0} strokeColor="#F59E0B" showInfo={false} className="m-0 flex-1" />
            <span className="w-8 text-slate-300 text-right">0%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-slate-400">1 sao</span>
            <Progress percent={0} strokeColor="#F59E0B" showInfo={false} className="m-0 flex-1" />
            <span className="w-8 text-slate-300 text-right">0%</span>
          </div>
        </div>
      </div>

      {/* Review items list */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
          >
            {/* Header: Student & Rating */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={rev.studentAvatar} size={42} className="border border-slate-200" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {rev.studentName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircleFilled className="text-[10px]" /> Đã hoàn thành {rev.completedSessions} buổi
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{rev.date}</div>
                </div>
              </div>

              <div className="flex items-center text-amber-400 text-sm">
                {'★'.repeat(Math.round(rev.rating))}
              </div>
            </div>

            {/* Comment */}
            <p className="mt-3 text-xs text-slate-700 leading-relaxed">
              “{rev.comment}”
            </p>

            {/* Tutor Reply if any */}
            {rev.tutorReply && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-brand-indigo-700 mb-1">
                  <MessageOutlined /> Phản hồi từ gia sư:
                </div>
                <p className="m-0 text-slate-600 leading-relaxed">
                  {rev.tutorReply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
