import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Input, { Textarea, Select, Field, Checkbox } from '@/components/ui/Input';
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
const SHORT_DESCRIPTION_MAX = 200;
const TAGS_MAX = 10;

/**
 * Parse a comma-separated tags string into a trimmed, deduped array
 * (case-insensitive dedupe, first occurrence wins).
 */
export function parseTags(raw) {
  if (!raw) return [];
  const seen = new Set();
  const out = [];
  String(raw)
    .split(',')
    .forEach((part) => {
      const tag = part.trim();
      if (!tag) return;
      const key = tag.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(tag);
    });
  return out;
}

/**
 * Map the 3 teaching-place checkboxes to the backend TeachingMode enum:
 * only-Online → Online, only-offline-ish → Offline, mixed → Both.
 */
export function teachingModeFromPlaces({ online, atHome, otherPlace }) {
  if (online && !atHome && !otherPlace) return TEACHING_MODE.ONLINE;
  if (!online && (atHome || otherPlace)) return TEACHING_MODE.OFFLINE;
  return TEACHING_MODE.BOTH;
}

/** Reverse mapping, used to initialise the checkboxes from a stored enum value. */
export function placesFromTeachingMode(mode) {
  switch (mode) {
    case TEACHING_MODE.OFFLINE:
      return { online: false, atHome: true, otherPlace: false };
    case TEACHING_MODE.BOTH:
      return { online: true, atHome: true, otherPlace: false };
    default:
      return { online: true, atHome: false, otherPlace: false };
  }
}

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
  const description = formData.description || '';
  const shortDescription = formData.shortDescription || '';
  const coverImageUrl = (formData.coverImageUrl || '').trim();

  const selectedSubject = subjects.find((s) => s.id === formData.subjectId);
  const categoryName =
    selectedSubject?.categoryName || editingService?.categoryName || '';

  const places = placesFromTeachingMode(formData.teachingMode);
  const handlePlaceToggle = (key) => {
    const next = { ...places, [key]: !places[key] };
    // Keep at least one place checked so the enum mapping stays valid.
    if (!next.online && !next.atHome && !next.otherPlace) return;
    onFieldChange('teachingMode', teachingModeFromPlaces(next));
  };

  // Minimal markdown toolbar: wrap selection (or a placeholder word) at cursor.
  const descRef = useRef(null);
  const insertMarkdown = (kind) => {
    const el = descRef.current;
    const start = el?.selectionStart ?? description.length;
    const end = el?.selectionEnd ?? description.length;
    const selected = description.slice(start, end);
    let next;
    let caretOffset;
    if (kind === 'bold') {
      const word = selected || 'văn bản';
      next = `${description.slice(0, start)}**${word}**${description.slice(end)}`;
      caretOffset = [start + 2, start + 2 + word.length];
    } else if (kind === 'italic') {
      const word = selected || 'văn bản';
      next = `${description.slice(0, start)}*${word}*${description.slice(end)}`;
      caretOffset = [start + 1, start + 1 + word.length];
    } else {
      const block = selected || 'Mục mới';
      const listed = block
        .split('\n')
        .map((line) => `- ${line}`)
        .join('\n');
      next = `${description.slice(0, start)}${listed}${description.slice(end)}`;
      caretOffset = [start, start + listed.length];
    }
    onFieldChange('description', next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caretOffset[0], caretOffset[1]);
    });
  };

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

          <Field label="Mô tả ngắn" htmlFor="service-short">
            <Input
              id="service-short"
              maxLength={SHORT_DESCRIPTION_MAX}
              placeholder="Tóm tắt gói học trong một câu ngắn…"
              value={formData.shortDescription}
              onChange={(e) => onFieldChange('shortDescription', e.target.value)}
            />
            <p className="text-right text-caption text-fg-secondary mt-1">
              {shortDescription.length}/{SHORT_DESCRIPTION_MAX}
            </p>
          </Field>

          <Field
            label="Mô tả chi tiết"
            htmlFor="service-desc"
            required
            hint="Giới thiệu lộ trình, phương pháp giảng dạy và đối tượng phù hợp (tối thiểu 20 ký tự)."
          >
            <div
              className="flex items-center gap-1 mb-1.5"
              role="toolbar"
              aria-label="Định dạng mô tả"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="In đậm"
                title="In đậm"
                onClick={() => insertMarkdown('bold')}
              >
                <strong>B</strong>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="In nghiêng"
                title="In nghiêng"
                onClick={() => insertMarkdown('italic')}
              >
                <em>I</em>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Danh sách gạch đầu dòng"
                title="Danh sách gạch đầu dòng"
                onClick={() => insertMarkdown('list')}
              >
                <Icon name="list" size="sm" />
              </Button>
            </div>
            <Textarea
              id="service-desc"
              ref={descRef}
              rows={5}
              maxLength={DESCRIPTION_MAX}
              aria-describedby="service-desc-count"
              placeholder="Mô tả chi tiết về nội dung, phương pháp giảng dạy, đối tượng phù hợp..."
              value={description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              required
            />
            <p id="service-desc-count" className="text-right text-caption text-fg-secondary mt-1">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </Field>

          <Field
            label="Ảnh bìa (URL)"
            htmlFor="service-cover"
            hint="Không bắt buộc — ảnh minh họa giúp gói học nổi bật hơn."
          >
            <div className="flex items-start gap-3">
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="Xem trước ảnh bìa"
                  className="w-14 h-14 rounded-brand-md object-cover border border-border shrink-0"
                />
              )}
              <Input
                id="service-cover"
                type="url"
                inputMode="url"
                placeholder="https://..."
                value={formData.coverImageUrl}
                onChange={(e) => onFieldChange('coverImageUrl', e.target.value)}
              />
            </div>
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

          <Field label="Danh mục" htmlFor="service-category">
            <Input
              id="service-category"
              value={categoryName}
              placeholder="—"
              readOnly
              aria-readonly="true"
              className="bg-neutral-50"
              tabIndex={-1}
            />
          </Field>

          <Field
            label="Các thẻ liên quan"
            htmlFor="service-tags"
            hint={`Không bắt buộc — các thẻ cách nhau bằng dấu phẩy (tối đa ${TAGS_MAX}).`}
          >
            <Input
              id="service-tags"
              placeholder="Thêm thẻ (ví dụ: IELTS, Giao tiếp, THPT...)"
              value={formData.tags}
              onChange={(e) => onFieldChange('tags', e.target.value)}
            />
          </Field>
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

          <Field
            label="Hình thức học"
            required
            hint="Chọn ít nhất một hình thức."
          >
            <div className="space-y-2.5" role="group" aria-label="Hình thức học">
              <Checkbox
                id="service-mode-online"
                label="Online"
                checked={places.online}
                disabled={isPublished}
                onChange={() => handlePlaceToggle('online')}
              />
              <Checkbox
                id="service-mode-athome"
                label="Tại nhà học viên"
                checked={places.atHome}
                disabled={isPublished}
                onChange={() => handlePlaceToggle('atHome')}
              />
              <Checkbox
                id="service-mode-other"
                label="Tại địa điểm khác"
                checked={places.otherPlace}
                disabled={isPublished}
                onChange={() => handlePlaceToggle('otherPlace')}
              />
            </div>
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
    categoryName: PropTypes.string,
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
    shortDescription: PropTypes.string,
    description: PropTypes.string,
    learningScope: PropTypes.string,
    expectedOutcome: PropTypes.string,
    totalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sessionDurationMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    teachingMode: PropTypes.string,
    trialLessonUrl: PropTypes.string,
    tags: PropTypes.string,
    coverImageUrl: PropTypes.string,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
