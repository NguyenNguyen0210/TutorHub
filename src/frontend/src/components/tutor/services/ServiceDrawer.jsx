import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Drawer } from '@/components/ui/Avatar';
import {
  SectionTitle,
  BasicInfoFields,
  ScopeOutcomeFields,
  TrialFields,
  SubjectFields,
  PackageTermsFields,
  ModeFields,
  CurriculumFields,
  FaqFields,
} from './ServiceFormSections';

// Re-exported for backward compatibility (helpers moved to ServiceFormSections / serviceFormUtils).
export {
  TEACHING_MODE_OPTIONS,
  teachingModeFromPlaces,
  placesFromTeachingMode,
} from './ServiceFormSections';
export { parseTags } from './serviceFormUtils';

/**
 * ServiceDrawer — form tạo/sửa gói dịch vụ trong panel trượt phải,
 * chia 4 nhóm đánh số theo thiết kế: thông tin · môn học · chi tiết gói · nội dung từng buổi.
 */
export default function ServiceDrawer({
  open,
  onClose,
  editingService = null,
  subjects,
  formData,
  onFieldChange,
  onSubmit,
  submitting = false,
}) {
  const isPublished = editingService?.status === 'Published';

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
          <BasicInfoFields formData={formData} onFieldChange={onFieldChange} />
          <ScopeOutcomeFields formData={formData} onFieldChange={onFieldChange} />
          <TrialFields formData={formData} onFieldChange={onFieldChange} />
        </section>

        {/* ── 2. Môn học ──────────────────────────────────── */}
        <section className="space-y-4" aria-label="Môn học giảng dạy">
          <SectionTitle step={2}>Môn học giảng dạy</SectionTitle>
          <SubjectFields
            formData={formData}
            onFieldChange={onFieldChange}
            subjects={subjects}
            editingService={editingService}
          />
        </section>

        {/* ── 3. Chi tiết gói học ─────────────────────────── */}
        <section className="space-y-4" aria-label="Chi tiết gói học">
          <SectionTitle step={3}>Chi tiết gói học</SectionTitle>
          <PackageTermsFields formData={formData} onFieldChange={onFieldChange} locked={isPublished} />
          <ModeFields formData={formData} onFieldChange={onFieldChange} locked={isPublished} />
        </section>

        {/* ── 4. Nội dung từng buổi ─────────────────────── */}
        <section className="space-y-4" aria-label="Nội dung từng buổi">
          <CurriculumFields formData={formData} onFieldChange={onFieldChange} step={4} />
          <FaqFields formData={formData} onFieldChange={onFieldChange} />
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
    categoryName: PropTypes.string,
  }),
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      categoryName: PropTypes.string,
    })
  ).isRequired,
  formData: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

