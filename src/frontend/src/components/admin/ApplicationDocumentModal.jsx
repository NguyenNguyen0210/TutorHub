import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/Button';

/**
 * Modal xem trước văn bằng (Operational Ledger — SPEC §4.2).
 *
 * Nền overlay dùng `brand-navy-950` thay cho `black` cứng (SPEC §3.8); mọi
 * viền/nền trong điều kiện đi qua `border` / `surface` / `neutral-*`.
 */
export default function ApplicationDocumentModal({ doc, onClose }) {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-brand-xl max-w-2xl w-full overflow-hidden animate-fadeIn space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-extrabold text-[16px] text-fg">{doc.title}</h3>
            <span className="text-xs text-fg-secondary font-medium">{doc.institution}</span>
          </div>
          <IconButton
            label="Đóng xem trước"
            size="sm"
            onClick={onClose}
            icon={<Icon name="close" size="sm" />}
          />
        </div>

        <div className="relative rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center max-h-[460px]">
          <img
            src={doc.previewUrl}
            alt={doc.title}
            className="w-full h-auto object-contain max-h-[460px]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-fg-muted">{doc.format}</span>
          <div className="flex items-center gap-2">
            <a
              href={doc.previewUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-border hover:bg-neutral-50 text-fg text-xs font-semibold cursor-pointer"
            >
              <Icon name="download" size="xs" />
              Tải về
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-xl bg-brand-navy-900 text-white text-xs font-semibold hover:bg-brand-navy-800 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ApplicationDocumentModal.propTypes = {
  doc: PropTypes.shape({
    title: PropTypes.string,
    institution: PropTypes.string,
    format: PropTypes.string,
    previewUrl: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};
