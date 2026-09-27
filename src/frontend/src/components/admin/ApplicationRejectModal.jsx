import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Button, { IconButton } from '@/components/ui/Button';

/**
 * Modal từ chối hồ sơ gia sư kèm lý do (Operational Ledger — SPEC §4.2).
 *
 * Hành động phá hủy nên dùng `danger-outline` / `danger` — không bao giờ
 * `success` (SPEC §4.2). Endpoint và payload do page cha giữ nguyên.
 */
const REASON_PRESETS = [
  'Thiếu bằng cấp minh chứng',
  'Ảnh chụp bằng cấp mờ, không rõ dấu mộc',
  'Chưa có chứng chỉ nghiệp vụ sư phạm',
  'Thông tin kinh nghiệm giảng dạy chưa đầy đủ',
];

export default function ApplicationRejectModal({
  open,
  applicantName,
  reason,
  onReasonChange,
  processing = false,
  onSubmit,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-brand-xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2 text-danger-strong font-bold text-[16px]">
            <Icon name="error" size="md" />
            Từ chối hồ sơ gia sư
          </div>
          <IconButton
            label="Đóng hộp thoại từ chối"
            size="sm"
            onClick={onClose}
            icon={<Icon name="close" size="sm" />}
          />
        </div>

        <p className="text-xs text-fg-secondary">
          Nhập lý do từ chối để hệ thống gửi thông báo chi tiết đến email của ứng viên{' '}
          <strong>{applicantName}</strong>:
        </p>

        <textarea
          rows={4}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Nhập lý do từ chối chi tiết..."
          aria-label="Lý do từ chối hồ sơ gia sư"
          className="w-full p-3 rounded-xl border border-border text-xs text-fg focus:outline-none focus:ring-2 focus:ring-danger transition-all resize-none"
        />

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide">
            Gợi ý lý do nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {REASON_PRESETS.map((txt) => (
              <button
                key={txt}
                type="button"
                onClick={() => onReasonChange(txt)}
                className="px-2.5 py-1 rounded-lg border border-border bg-neutral-50 hover:bg-neutral-100 text-[11.5px] text-fg-secondary cursor-pointer"
              >
                {txt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="h-10 px-4 text-xs">
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={processing}
            disabled={processing}
            onClick={onSubmit}
            className="h-10 px-5 text-xs"
          >
            Xác nhận từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}

ApplicationRejectModal.propTypes = {
  open: PropTypes.bool,
  applicantName: PropTypes.string,
  reason: PropTypes.string,
  onReasonChange: PropTypes.func.isRequired,
  processing: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
