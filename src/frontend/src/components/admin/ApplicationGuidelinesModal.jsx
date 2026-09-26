import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Button, { IconButton } from '@/components/ui/Button';

/**
 * Modal "Quy chuẩn xét duyệt hồ sơ gia sư" (Operational Ledger — SPEC §4.2).
 *
 * Số thứ tự là huy hiệu trung tính, không phải màu trạng thái: dùng
 * `brand-primary-*` cho số thứ tự (giống màu CTA) và tiêu đề dùng `text-fg`.
 */
const GUIDELINES = [
  {
    title: 'Xác minh văn bằng & học vị:',
    body: 'Đối chiếu bằng tốt nghiệp, bảng điểm và chứng chỉ sư phạm, bảo đảm có dấu mộc của trường đại học hoặc cơ quan cấp phép uy tín.',
  },
  {
    title: 'Kiểm tra danh tính KYC & liên lạc:',
    body: 'Xác minh số điện thoại, email và khu vực nhận dạy trực tiếp có trùng khớp với hồ sơ đăng ký.',
  },
  {
    title: 'Thẩm định phương pháp sư phạm:',
    body: 'Đảm bảo gia sư có phong cách giảng dạy rõ ràng, giáo trình minh bạch và cam kết chất lượng đầu ra cho học viên.',
  },
  {
    title: 'Thời hạn SLA cam kết:',
    body: 'Phê duyệt hoặc từ chối có lý do trong vòng tối đa 1–3 ngày làm việc kể từ thời điểm nhận hồ sơ.',
  },
];

export default function ApplicationGuidelinesModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-brand-xl max-w-xl w-full p-6 space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center">
              <Icon name="info" size="md" />
            </div>
            <h3 className="font-extrabold text-[16px] text-fg">
              Quy chuẩn xét duyệt hồ sơ gia sư
            </h3>
          </div>
          <IconButton
            label="Đóng hướng dẫn"
            size="sm"
            onClick={onClose}
            icon={<Icon name="close" size="sm" />}
          />
        </div>

        <div className="space-y-3.5 text-xs text-fg-secondary leading-relaxed">
          {GUIDELINES.map((item, idx) => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-primary-100 text-brand-primary-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p>
                <strong>{item.title}</strong> {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <Button variant="primary" size="md" onClick={onClose}>
            Đã hiểu quy chuẩn
          </Button>
        </div>
      </div>
    </div>
  );
}

ApplicationGuidelinesModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};
