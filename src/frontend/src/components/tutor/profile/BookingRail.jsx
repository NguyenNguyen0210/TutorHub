import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import { scrollToSection, SECTION_IDS } from './sectionNav';

/**
 * BookingRail — Cột phải sticky: Hiển thị mức giá khởi điểm, nút chọn nhanh gói học
 * và cam kết bảo chứng học phí Escrow nhằm tối ưu tỷ lệ chuyển đổi.
 *
 * Đã loại bỏ hoàn toàn các thông tin trùng lặp (điểm số, số năm kinh nghiệm)
 * vốn đã được trình bày trang trọng tại phần đầu trang.
 */
export default function BookingRail({ tutor }) {
  const services = Array.isArray(tutor.services) ? tutor.services : [];
  const publishedServices = services.filter((s) => s.status !== 'Draft');
  const activeServices = publishedServices.length > 0 ? publishedServices : services;

  const prices = activeServices
    .map((s) => Number(s.price) || 0)
    .filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : (Number(tutor.minPrice) || null);

  return (
    <aside className="lg:sticky lg:top-[124px] space-y-4 transition-all">
      <Card padding="lg" variant="raised" className="space-y-4 shadow-sm border border-border rounded-2xl">
        {/* Khối hiển thị mức giá khởi điểm */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-indigo-50/70 border border-blue-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-caption text-slate-600 font-medium">
              <span>Học phí trọn gói từ</span>
              {activeServices.length > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full text-[11px]">
                  {activeServices.length} gói học
                </span>
              )}
            </div>
            <div className="pt-0.5">
              {minPrice != null ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                    <Money value={minPrice} />
                  </span>
                  <span className="text-[13px] text-slate-500 font-medium">/ gói</span>
                </div>
              ) : (
                <span className="text-body-reg font-semibold text-slate-800">Liên hệ báo giá</span>
              )}
            </div>
            <p className="text-[12px] text-slate-600 m-0 pt-0.5 flex items-center gap-1.5">
              <Icon name="verified_user" size="xs" className="text-brand-primary-600 shrink-0" />
              <span>TutorHub giữ học phí trong 12 giờ sau mỗi buổi để bạn phản hồi</span>
            </p>
          </div>

          {/* Các nút hành động chính */}
          <div className="space-y-2.5 pt-1">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              icon={<Icon name="school" size="sm" />}
              onClick={() => scrollToSection(SECTION_IDS.services)}
              className="font-semibold shadow-sm text-[15px]"
            >
              Chọn gói học ngay
            </Button>

            <Button
              as={Link}
              to={`/app/messages?tutorId=${tutor.id}`}
              variant="outline"
              fullWidth
              size="md"
              icon={<Icon name="chat" size="sm" />}
              className="font-medium text-[14px]"
            >
              Nhắn tin với gia sư
            </Button>

            <p className="text-[12px] text-fg-muted text-center m-0 pt-1">
              Trao đổi trực tiếp để được tư vấn lộ trình và giải đáp chi tiết.
            </p>
          </div>

          {/* Khối bảo chứng an tâm & uy tín */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-start gap-2.5 text-[12px] text-fg-secondary leading-relaxed">
              <Icon name="security" size="xs" className="text-brand-primary-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-fg font-semibold block">Học phí được TutorHub giữ an toàn</strong>
                <span>
                  Học phí được giữ an toàn tuyệt đối, chỉ giải ngân cho gia sư sau khi từng buổi học
                  hoàn tất và bạn xác nhận.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-[12px] text-fg-secondary leading-relaxed">
              <Icon name="swap_horiz" size="xs" className="text-brand-primary-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-fg font-semibold block">Đổi gia sư nếu không hợp</strong>
                <span>
                  Bảo vệ tối đa quyền lợi học viên với quy trình hỗ trợ đổi gia sư hoặc xử lý khiếu
                  nại nhanh chóng.
                </span>
              </div>
            </div>
          </div>
        </Card>
    </aside>
  );
}

BookingRail.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    minPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    services: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        status: PropTypes.string,
      })
    ),
  }).isRequired,
};
