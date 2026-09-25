import React from 'react';
import PropTypes from 'prop-types';
import Input, { Textarea, Select, Field } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Drawer } from '@/components/ui/Avatar';
import { TEACHING_MODE } from '@/config/enums';

export const TEACHING_MODE_OPTIONS = [
  { value: TEACHING_MODE.ONLINE, label: 'Trực tuyến (Online)' },
  { value: TEACHING_MODE.OFFLINE, label: 'Tại nhà học viên (Offline)' },
  { value: TEACHING_MODE.BOTH, label: 'Cả Online & tại nhà' },
];

const DESCRIPTION_MAX = 2000;

function SectionTitle({ step, children }) {
  return (
    <h3 className="flex items-center gap-2 text-body-reg font-bold text-fg">
      <span
        aria-hidden="true"
        className="w-6 h-6 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center text-caption font-bold shrink-0"
      >
        {step}
      </span>
      {children}
    </h3>
  );
}

SectionTitle.propTypes = {
  step: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

function SuffixInput({ suffix, id, ...rest }) {
  return (
    <div className="flex">
      <Input id={id} {...rest} className="rounded-r-none border-r-0" />
      <span
        aria-hidden="true"
        className="inline-flex items-center px-3 rounded-r-brand-md border border-border bg-neutral-50 text-caption text-fg-secondary shrink-0"
      >
        {suffix}
      </span>
    </div>
  );
}

SuffixInput.propTypes = {
  suffix: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

/**
 * ServiceDrawer — form tạo/sửa gói dịch vụ trong panel trượt phải,
 * chia 3 nhóm đánh số theo thiết kế: thông tin · môn học · chi tiết gói.
 */
export default function ServiceDrawer({
  open,
  onClose,
  editingService,
  subjects,
  formData,
  onFieldChange,
  onSubmit,
  submitting,
}) {
  const isPublished = editingService?.status === 'Published';
  const sessions = Number(formData.totalSessions) || 0;
  const price = Number(formData.price) || 0;
  const pricePerSession = sessions > 0 ? Math.round(price / sessions) : 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      widthClass="w-[440px]"
      title={editingService ? 'Chỉnh sửa gói dịch vụ' : 'Tạo dịch vụ mới'}
    >
      <p className="text-caption text-fg-secondary -mt-2 mb-5">
        Thiết lập thông tin gói học của bạn
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ── 1. Thông tin cơ bản ─────────────────────────── */}
        <section className="space-y-4" aria-label="Thông tin cơ bản">
          <SectionTitle step={1}>Thông tin cơ bản</SectionTitle>

          <Field label="Tên dịch vụ" htmlFor="service-title" required>
            <Input
              id="service-title"
              maxLength={120}
              placeholder="Ví dụ: Luyện thi IELTS 6.5+ (4 kỹ năng)"
              value={formData.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              required
            />
          </Field>

          <Field
            label="Mô tả chi tiết"
            htmlFor="service-desc"
            required
            hint="Giới thiệu lộ trình, phương pháp giảng dạy và đối tượng phù hợp (tối thiểu 20 ký tự)."
          >
            <Textarea
              id="service-desc"
              rows={5}
              maxLength={DESCRIPTION_MAX}
              aria-describedby="service-desc-count"
              placeholder="Mô tả chi tiết về nội dung, phương pháp giảng dạy, đối tượng phù hợp..."
              value={formData.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              required
            />
            <p id="service-desc-count" className="text-right text-caption text-fg-secondary mt-1">
              {formData.description.length}/{DESCRIPTION_MAX}
            </p>
          </Field>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Giáo trình / Phạm vi kiến thức" htmlFor="service-scope">
              <Input
                id="service-scope"
                placeholder="Ví dụ: SGK Kết nối tri thức + đề nâng cao"
                value={formData.learningScope}
                onChange={(e) => onFieldChange('learningScope', e.target.value)}
              />
            </Field>
            <Field label="Cam kết đầu ra" htmlFor="service-outcome">
              <Input
                id="service-outcome"
                placeholder="Ví dụ: Nắm chắc căn bản sau 4 tuần"
                value={formData.expectedOutcome}
                onChange={(e) => onFieldChange('expectedOutcome', e.target.value)}
              />
            </Field>
            <Field
              label="Link video học thử"
              htmlFor="service-trial"
              hint="Không bắt buộc — video giới thiệu giúp học viên tin tưởng hơn."
            >
              <Input
                id="service-trial"
                type="url"
                inputMode="url"
                placeholder="https://..."
                value={formData.trialLessonUrl}
                onChange={(e) => onFieldChange('trialLessonUrl', e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* ── 2. Môn học ──────────────────────────────────── */}
        <section className="space-y-4" aria-label="Môn học giảng dạy">
          <SectionTitle step={2}>Môn học giảng dạy</SectionTitle>
          {!editingService ? (
            <Field label="Môn học" htmlFor="service-subject" required>
              <Select
                id="service-subject"
                value={formData.subjectId}
                onChange={(e) => onFieldChange('subjectId', e.target.value)}
                required
              >
                <option value="" disabled>
                  Chọn môn học
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.categoryName || 'Chung'})
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="p-3 bg-neutral-50 rounded-brand-md border border-border flex justify-between items-center text-caption">
              <span className="text-fg-secondary">Môn học đã đăng ký (không đổi được):</span>
              <strong className="text-fg">{editingService.subjectName}</strong>
            </div>
          )}
        </section>

        {/* ── 3. Chi tiết gói học ─────────────────────────── */}
        <section className="space-y-4" aria-label="Chi tiết gói học">
          <SectionTitle step={3}>Chi tiết gói học</SectionTitle>

          {isPublished && (
            <div className="p-3 bg-holding-subtle text-holding-strong rounded-brand-md text-caption" role="note">
              <strong>Khóa điều khoản thương mại:</strong> gói đang tuyển sinh không sửa
              được số buổi, thời lượng, giá và hình thức dạy. Hãy <strong>Tạm ẩn</strong> gói
              nếu muốn đổi các thông tin này.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Số buổi học" htmlFor="service-sessions" required>
              <SuffixInput
                id="service-sessions"
                type="number"
                min="1"
                max="100"
                suffix="buổi"
                disabled={isPublished}
                value={formData.totalSessions}
                onChange={(e) => onFieldChange('totalSessions', e.target.value)}
                required
              />
            </Field>
            <Field label="Thời lượng mỗi buổi" htmlFor="service-duration" required>
              <SuffixInput
                id="service-duration"
                type="number"
                min="30"
                step="15"
                max="240"
                suffix="phút"
                disabled={isPublished}
                value={formData.sessionDurationMinutes}
                onChange={(e) => onFieldChange('sessionDurationMinutes', e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Hình thức học" htmlFor="service-mode" required>
            <Select
              id="service-mode"
              value={formData.teachingMode}
              disabled={isPublished}
              onChange={(e) => onFieldChange('teachingMode', e.target.value)}
            >
              {TEACHING_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Giá gói học" htmlFor="service-price" required>
            <SuffixInput
              id="service-price"
              type="number"
              min="50000"
              step="50000"
              suffix="₫"
              disabled={isPublished}
              value={formData.price}
              onChange={(e) => onFieldChange('price', e.target.value)}
              required
            />
            {pricePerSession > 0 && (
              <p className="text-caption text-fg-secondary mt-1.5">
                Tương đương {pricePerSession.toLocaleString('vi-VN')} ₫/buổi
              </p>
            )}
          </Field>
        </section>

        {/* Sticky footer */}
        <div className="sticky bottom-[-1.25rem] -mx-5 -mb-5 border-t border-border bg-surface px-5 py-4 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="md" onClick={onClose} icon={<Icon name="close" size="xs" />}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            icon={<Icon name="check" size="xs" />}
          >
            {editingService ? 'Lưu thay đổi' : 'Tạo gói dịch vụ'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

ServiceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editingService: PropTypes.shape({
    status: PropTypes.string,
    subjectName: PropTypes.string,
  }),
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      categoryName: PropTypes.string,
    })
  ).isRequired,
  formData: PropTypes.shape({
    subjectId: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    learningScope: PropTypes.string,
    expectedOutcome: PropTypes.string,
    totalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sessionDurationMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    teachingMode: PropTypes.string,
    trialLessonUrl: PropTypes.string,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
