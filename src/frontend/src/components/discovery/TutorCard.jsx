import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Tag, Button } from 'antd';
import {
  CheckCircleFilled,
  EnvironmentOutlined,
  MessageOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';
import { getTeachingModeMeta } from '@/config/enums';

/**
 * Thẻ gia sư cho danh sách marketplace.
 *
 * Prop `tutor` là TutorSummaryDto đã chuẩn hoá (xem tutorService.normalizeTutorSummary):
 * { id, fullName, avatarUrl, bio, education, experienceYears, teachingMode, address,
 *   ratingAvg, totalReviews, subjects: string[], minPrice: number|null, isVerified: boolean }
 *
 * Lưu ý: `MinPrice` / `IsVerified` là field backend đang bổ sung ⇒ đọc defensive,
 * và KHÔNG bao giờ gọi .toFixed() trực tiếp trên giá trị có thể null.
 */
export default function TutorCard({ tutor }) {
  const navigate = useNavigate();

  const modeMeta = getTeachingModeMeta(tutor?.teachingMode);
  const subjects = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
  const ratingValue = Number(tutor?.ratingAvg);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;

  return (
    <div className="glass-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-indigo-300 hover:shadow-xl hover:shadow-brand-indigo-500/10">
      {/* Top Banner & Avatar Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="relative">
            <Avatar
              src={tutor?.avatarUrl}
              size={64}
              className="border-2 border-brand-indigo-100 bg-brand-indigo-50 shadow-sm transition-transform duration-300 group-hover:scale-105"
            />
            {tutor?.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md" title="Đã kiểm định bằng cấp bởi TutorHub">
                <CheckCircleFilled className="text-xs" />
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <Tag color={modeMeta.color} className="rounded-full px-2.5 py-0.5 text-xs font-medium m-0">
              {modeMeta.label}
            </Tag>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <SafetyCertificateOutlined /> Escrow Bảo Chứng
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5">
          <div className="flex items-center gap-2">
            <Link
              to={`/tutors/${tutor?.id}`}
              className="text-lg font-bold text-slate-900 transition-colors hover:text-brand-indigo-600 line-clamp-1"
            >
              {tutor?.fullName}
            </Link>
          </div>

          <p className="text-xs font-medium text-brand-indigo-600 line-clamp-1 mt-0.5">
            {tutor?.education}
          </p>

          {/* Rating & Stats */}
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <span>★</span>
              <span>{hasRating ? ratingValue.toFixed(1) : '—'}</span>
            </div>
            <span className="text-slate-300">•</span>
            <span>({tutor?.totalReviews ?? 0} đánh giá)</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">{tutor?.experienceYears ?? 0} năm KN</span>
          </div>

          {/* Bio snippet */}
          <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {tutor?.bio}
          </p>

          {/* Address if any */}
          {tutor?.address && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <EnvironmentOutlined className="text-slate-400" />
              <span className="line-clamp-1">{tutor.address}</span>
            </div>
          )}

          {/* Subjects Tag List — tutor summary trả về mảng TÊN môn (List<string>) */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subjects.slice(0, 3).map((subject) => (
              <span
                key={subject}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 transition-colors group-hover:bg-brand-indigo-50 group-hover:text-brand-indigo-700"
              >
                {subject}
              </span>
            ))}
            {subjects.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">
                +{subjects.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Price & Actions */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-slate-500">Gói học từ</span>
            <div className="text-base font-extrabold text-brand-indigo-600">
              {tutor?.minPrice === null || tutor?.minPrice === undefined ? (
                <span className="text-sm font-bold text-slate-500">Liên hệ</span>
              ) : (
                // Backend MinPrice = giá gói dịch vụ thấp nhất (không phải giá/buổi).
                formatCurrency(tutor.minPrice)
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              icon={<MessageOutlined />}
              size="small"
              className="rounded-lg text-slate-600 hover:text-brand-indigo-600 hover:border-brand-indigo-300"
              onClick={() => navigate('/app/messages')}
              title="Nhắn tin trao đổi"
            />
            <Button
              type="primary"
              size="small"
              className="rounded-lg bg-brand-indigo-600 px-3 font-semibold shadow-sm hover:bg-brand-indigo-500 flex items-center gap-1"
              onClick={() => navigate(`/tutors/${tutor?.id}`)}
            >
              Xem Hồ Sơ <ArrowRightOutlined className="text-[10px]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
