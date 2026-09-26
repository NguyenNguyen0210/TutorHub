import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button, { IconButton } from '@/components/ui/Button';
import StateBadge from '@/components/ledger/StateBadge';

/**
 * Bảng chi tiết hồ sơ gia sư (Operational Ledger — SPEC §4.2).
 *
 * Tách ra khỏi `pages/admin/AdminTutorApplications.jsx` vì file chính vượt ~700
 * dòng. Toàn bộ màu ở đây đi qua token (`fg-*` / `border` / `success*` /
 * `holding*` / `brand-primary-*`); badge trạng thái dùng chung `StateBadge` với
 * domain `application` nên không tự chọn màu theo tên trạng thái.
 */

const VERIFICATION_CHECKS = [
  { key: 'personal', label: 'Thông tin cá nhân & liên hệ hợp lệ' },
  { key: 'degrees', label: 'Văn bằng & chứng chỉ chuyên môn phù hợp' },
  { key: 'experience', label: 'Kinh nghiệm giảng dạy đạt chuẩn' },
  { key: 'methodology', label: 'Phương pháp & lộ trình giảng dạy rõ ràng' },
];

// Ô dữ liệu dạng "nhãn / giá trị" dùng lại ở tab Thông tin.
const FIELD_CARD = 'p-3 rounded-xl bg-neutral-50 border border-border';
const FIELD_LABEL = 'text-[11.5px] text-fg-muted block';
const FIELD_VALUE = 'font-bold text-fg block mt-0.5';

// Khối văn bản dài (giới thiệu / phương pháp / thành tích).
const PROSE_LABEL = 'font-bold text-fg-secondary block';
const PROSE_BODY = 'text-fg-secondary bg-neutral-50 p-3 rounded-xl border border-border leading-relaxed whitespace-pre-line text-[12.5px]';
const PROSE_BODY_WRAP = 'text-fg-secondary bg-neutral-50 p-3 rounded-xl border border-border leading-relaxed text-[12.5px]';

export default function ApplicationReviewDrawer({
  applicant,
  activeTab,
  onTabChange,
  notes = [],
  noteInput = '',
  onNoteInputChange,
  onAddNote,
  checks = {},
  onToggleCheck,
  onPreviewDoc,
  onClose,
  processing = false,
  onApprove,
  onReject,
}) {
  const documents = applicant.documents || [];

  const tabs = [
    { key: 'info', label: 'Thông tin' },
    { key: 'degrees', label: `Bằng cấp (${documents.length || 1})` },
    { key: 'experience', label: `Kinh nghiệm (${applicant.experienceYears}n)` },
    { key: 'notes', label: `Ghi chú (${notes.length})` },
  ];

  return (
    <div className="lg:col-span-5 xl:col-span-4 bg-surface rounded-2xl border border-border shadow-brand-sm p-5 sm:p-6 space-y-5 sticky top-20">
      {/* Drawer Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <Avatar
            src={applicant.userAvatarUrl}
            name={applicant.userFullName}
            size="lg"
            className="w-14 h-14 rounded-full object-cover border-2 border-border shadow-brand-sm shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-[16px] text-fg truncate">
                {applicant.userFullName}
              </h3>
            </div>
            <div className="mt-0.5">
              <StateBadge status={applicant.status} domain="application" />
            </div>
            <div className="text-[12px] text-fg-secondary space-y-0.5 mt-2">
              <div className="flex items-center gap-1.5 truncate">
                <Icon name="mail" size="xs" className="text-fg-muted shrink-0" />
                <span className="truncate">{applicant.userEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="call" size="xs" className="text-fg-muted shrink-0" />
                <span>{applicant.userPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Drawer Button */}
        <IconButton
          label="Đóng bảng chi tiết"
          size="sm"
          onClick={onClose}
          icon={<Icon name="close" size="sm" />}
          className="shrink-0"
        />
      </div>

      {/* Drawer Tabs: Thông tin · Bằng cấp (3) · Kinh nghiệm (2) · Ghi chú (0) */}
      <div className="border-b border-border">
        <nav className="flex items-center justify-between text-[13px] font-semibold text-fg-secondary">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={cn(
                'pb-2.5 transition-all relative cursor-pointer',
                activeTab === t.key
                  ? 'text-brand-primary-600 font-bold'
                  : 'hover:text-fg'
              )}
            >
              {t.label}
              {activeTab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB CONTENT: BẰNG CẤP & CHỨNG CHỈ */}
      {activeTab === 'degrees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[13.5px] text-fg">Bằng cấp & chứng chỉ</h4>
            <span className="text-[11px] text-fg-muted">
              {documents.length || 1} tài liệu đính kèm
            </span>
          </div>

          {/* Documents List */}
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-border bg-surface hover:border-brand-primary-200 transition-colors flex items-center justify-between gap-3 shadow-brand-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Certificate Thumbnail */}
                  <img
                    src={doc.previewUrl}
                    alt={doc.title}
                    className="w-12 h-10 object-cover rounded-lg border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-[13px] text-fg block truncate">
                      {doc.title}
                    </span>
                    <span className="text-[11.5px] text-fg-secondary block truncate">
                      {doc.institution}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-fg-muted font-mono">{doc.format}</span>
                      {doc.verified ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-success-strong">
                          <Icon name="check" size="xs" /> Hợp lệ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-holding-strong">
                          <Icon name="schedule" size="xs" /> Chờ xác minh
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    label="Xem trước văn bằng"
                    size="sm"
                    onClick={() => onPreviewDoc(doc)}
                    icon={<Icon name="visibility" size="sm" />}
                    className="text-fg-muted hover:text-brand-primary-600 hover:bg-brand-primary-50"
                  />
                  <a
                    href={doc.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-fg-muted hover:text-fg inline-flex items-center justify-center transition-colors cursor-pointer"
                    title="Tải tệp"
                  >
                    <Icon name="download" size="sm" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Kết quả xác minh (Checklist) */}
          <div className="pt-2 border-t border-border space-y-2.5">
            <h4 className="font-bold text-[13.5px] text-fg">Kết quả xác minh</h4>
            <div className="space-y-2">
              {VERIFICATION_CHECKS.map((c) => {
                const checked = checks[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onToggleCheck(c.key)}
                    className="w-full flex items-center gap-2.5 text-left text-[12.5px] text-fg-secondary font-medium cursor-pointer group"
                  >
                    <span
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                        checked
                          ? 'bg-success border-success text-white'
                          : 'border-neutral-300 bg-surface group-hover:border-neutral-400'
                      )}
                    >
                      {checked && <Icon name="check" size="xs" />}
                    </span>
                    <span className={cn(checked ? 'text-fg' : 'text-fg-muted')}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: THÔNG TIN */}
      {activeTab === 'info' && (
        <div className="space-y-4 text-[13px]">
          <div className="space-y-1">
            <span className={PROSE_LABEL}>Giới thiệu bản thân</span>
            <p className={PROSE_BODY}>{applicant.bio}</p>
          </div>

          {/* Trình độ học vấn & Trường đại học */}
          <div className="grid grid-cols-2 gap-3">
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Trường đào tạo</span>
              <span
                className={FIELD_VALUE}
                title={applicant.university || applicant.education}
              >
                {applicant.university || applicant.education}
              </span>
            </div>
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Học vị</span>
              <span className={FIELD_VALUE}>{applicant.degreeLevel || 'Cử nhân'}</span>
            </div>
          </div>

          {applicant.major && (
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Chuyên ngành</span>
              <span className={FIELD_VALUE}>{applicant.major}</span>
            </div>
          )}

          {applicant.certifications && (
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Chứng chỉ</span>
              <span className="font-bold text-brand-primary-700 block mt-0.5">
                {applicant.certifications}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Hình thức dạy</span>
              <span className={FIELD_VALUE}>
                {applicant.teachingMode === 'Both'
                  ? 'Online & Offline'
                  : applicant.teachingMode}
              </span>
            </div>
            <div className={FIELD_CARD}>
              <span className={FIELD_LABEL}>Kinh nghiệm</span>
              <span className={FIELD_VALUE}>{applicant.experienceYears} năm</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className={PROSE_LABEL}>Địa chỉ nhận dạy</span>
            <p className="text-fg-secondary text-[12.5px]">{applicant.address}</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: KINH NGHIỆM */}
      {activeTab === 'experience' && (
        <div className="space-y-4 text-[13px]">
          <div className="space-y-1">
            <span className={PROSE_LABEL}>Phương pháp giảng dạy</span>
            <p className={PROSE_BODY_WRAP}>{applicant.methodology}</p>
          </div>
          <div className="space-y-1">
            <span className={PROSE_LABEL}>Thành tích nổi bật</span>
            <p className={PROSE_BODY_WRAP}>{applicant.achievements}</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GHI CHÚ */}
      {activeTab === 'notes' && (
        <div className="space-y-3 text-[13px]">
          <div className="space-y-2">
            <span className={PROSE_LABEL}>Ghi chú nội bộ Admin</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => onNoteInputChange(e.target.value)}
                placeholder="Thêm ghi chú đánh giá..."
                aria-label="Nội dung ghi chú nội bộ"
                className="flex-1 h-9 px-3 rounded-xl border border-border text-xs focus:ring-2 focus:ring-brand-primary-600 focus:outline-none"
              />
              <Button variant="primary" size="sm" onClick={onAddNote} className="h-9 px-3 text-xs">
                Lưu
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {notes.length === 0 ? (
              <span className="text-xs text-fg-muted italic block py-4 text-center">
                Chưa có ghi chú nào cho ứng viên này.
              </span>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-lg bg-neutral-50 border border-border text-xs flex justify-between"
                >
                  <span className="text-fg-secondary">{n.text}</span>
                  <span className="text-fg-muted font-mono">{n.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DECISION ACTION BUTTONS (BOTTOM) */}
      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
        <Button
          variant="danger-outline"
          size="md"
          fullWidth
          disabled={processing}
          onClick={onReject}
          className="h-11 text-[13.5px]"
          icon={<Icon name="close" size="sm" />}
        >
          Từ chối
        </Button>

        <Button
          variant="primary"
          size="md"
          fullWidth
          disabled={processing}
          onClick={onApprove}
          className="h-11 text-[13.5px]"
          loading={processing}
          icon={<Icon name="check" size="sm" />}
        >
          {processing ? 'Đang duyệt...' : 'Phê duyệt'}
        </Button>
      </div>
    </div>
  );
}

ApplicationReviewDrawer.propTypes = {
  applicant: PropTypes.shape({
    userFullName: PropTypes.string,
    userEmail: PropTypes.string,
    userPhone: PropTypes.string,
    userAvatarUrl: PropTypes.string,
    status: PropTypes.string,
    experienceYears: PropTypes.number,
    degreeLevel: PropTypes.string,
    university: PropTypes.string,
    education: PropTypes.string,
    major: PropTypes.string,
    certifications: PropTypes.string,
    teachingMode: PropTypes.string,
    address: PropTypes.string,
    bio: PropTypes.string,
    methodology: PropTypes.string,
    achievements: PropTypes.string,
    documents: PropTypes.array,
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  notes: PropTypes.array,
  noteInput: PropTypes.string,
  onNoteInputChange: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  checks: PropTypes.objectOf(PropTypes.bool),
  onToggleCheck: PropTypes.func.isRequired,
  onPreviewDoc: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  processing: PropTypes.bool,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
