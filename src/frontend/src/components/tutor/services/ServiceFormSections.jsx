import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input, { Textarea, Select, Field, Checkbox } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { TEACHING_MODE } from '@/config/enums';
import {
  SHORT_DESCRIPTION_MAX,
  DESCRIPTION_MAX,
  TAGS_MAX,
  AUDIENCE_MAX,
  FAQ_MAX,
  EMPTY_SESSION,
  EMPTY_FAQ,
} from './serviceFormUtils';

export const TEACHING_MODE_OPTIONS = [
  { value: TEACHING_MODE.ONLINE, label: 'Trực tuyến (Online)' },
  { value: TEACHING_MODE.OFFLINE, label: 'Tại nhà học viên (Offline)' },
  { value: TEACHING_MODE.BOTH, label: 'Cả Online & tại nhà' },
];

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

export function SectionTitle({ step, children }) {
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

const formDataShape = PropTypes.shape({
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
  sessions: PropTypes.array,
  targetAudienceText: PropTypes.string,
  prerequisitesText: PropTypes.string,
  faqs: PropTypes.array,
});

/* ── Basic info: title, short description, rich description, cover ── */
export function BasicInfoFields({ formData, onFieldChange }) {
  const description = formData.description || '';
  const shortDescription = formData.shortDescription || '';
  const coverImageUrl = (formData.coverImageUrl || '').trim();

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
    <>
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
    </>
  );
}

BasicInfoFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

/* ── Goals: learning scope + expected outcome ── */
export function ScopeOutcomeFields({ formData, onFieldChange }) {
  return (
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
    </div>
  );
}

ScopeOutcomeFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

/* ── Trial lesson video ── */
export function TrialFields({ formData, onFieldChange }) {
  return (
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
  );
}

TrialFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

/* ── Subject: select (create) or locked box (edit) + category + tags ── */
export function SubjectFields({ formData, onFieldChange, subjects, editingService }) {
  const selectedSubject = subjects.find((s) => s.id === formData.subjectId);
  const categoryName =
    selectedSubject?.categoryName || editingService?.categoryName || '';

  return (
    <>
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
    </>
  );
}

SubjectFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, categoryName: PropTypes.string })
  ).isRequired,
  editingService: PropTypes.shape({
    subjectName: PropTypes.string,
    categoryName: PropTypes.string,
  }),
};

SubjectFields.defaultProps = {
  editingService: null,
};

/* ── Package terms: sessions, duration, price ── */
export function PackageTermsFields({ formData, onFieldChange, locked }) {
  const sessions = Number(formData.totalSessions) || 0;
  const price = Number(formData.price) || 0;
  const pricePerSession = sessions > 0 ? Math.round(price / sessions) : 0;

  return (
    <>
      {locked && (
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
            disabled={locked}
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
            disabled={locked}
            value={formData.sessionDurationMinutes}
            onChange={(e) => onFieldChange('sessionDurationMinutes', e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Giá gói học" htmlFor="service-price" required>
        <SuffixInput
          id="service-price"
          type="number"
          min="50000"
          step="50000"
          suffix="₫"
          disabled={locked}
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
    </>
  );
}

PackageTermsFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  locked: PropTypes.bool,
};

PackageTermsFields.defaultProps = {
  locked: false,
};

/* ── Teaching mode checkboxes ── */
export function ModeFields({ formData, onFieldChange, locked }) {
  const places = placesFromTeachingMode(formData.teachingMode);
  const handlePlaceToggle = (key) => {
    const next = { ...places, [key]: !places[key] };
    // Keep at least one place checked so the enum mapping stays valid.
    if (!next.online && !next.atHome && !next.otherPlace) return;
    onFieldChange('teachingMode', teachingModeFromPlaces(next));
  };

  return (
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
          disabled={locked}
          onChange={() => handlePlaceToggle('online')}
        />
        <Checkbox
          id="service-mode-athome"
          label="Tại nhà học viên"
          checked={places.atHome}
          disabled={locked}
          onChange={() => handlePlaceToggle('atHome')}
        />
        <Checkbox
          id="service-mode-other"
          label="Tại địa điểm khác"
          checked={places.otherPlace}
          disabled={locked}
          onChange={() => handlePlaceToggle('otherPlace')}
        />
      </div>
    </Field>
  );
}

ModeFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  locked: PropTypes.bool,
};

ModeFields.defaultProps = {
  locked: false,
};

/* ── Curriculum: per-session editors + audience + prerequisites ── */
export function CurriculumFields({ formData, onFieldChange, step }) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [openSessions, setOpenSessions] = useState({});
  const sessionsList = Array.isArray(formData.sessions) ? formData.sessions : [];
  const maxSessions = Number(formData.totalSessions) || 0;
  const packageDuration = Number(formData.sessionDurationMinutes) || 60;

  const updateSession = (index, key, value) => {
    onFieldChange(
      'sessions',
      sessionsList.map((s, i) => (i === index ? { ...s, [key]: value } : s))
    );
  };
  const handleAddSession = () => {
    if (sessionsList.length >= maxSessions) return;
    const next = [...sessionsList, { ...EMPTY_SESSION }];
    onFieldChange('sessions', next);
    setOpenSessions((prev) => ({ ...prev, [next.length - 1]: true }));
  };
  const handleRemoveSession = (index) => {
    // sessionIndex is positional, so it recomputes automatically on submit.
    onFieldChange(
      'sessions',
      sessionsList.filter((_, i) => i !== index)
    );
    setOpenSessions((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const n = Number(k);
        if (Number.isNaN(n) || n === index || !prev[k]) return;
        next[n > index ? n - 1 : n] = true;
      });
      return next;
    });
  };
  const toggleSession = (index) => {
    setOpenSessions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <SectionTitle step={step}>Nội dung từng buổi</SectionTitle>
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          aria-expanded={sectionOpen}
          aria-label={sectionOpen ? 'Thu gọn nội dung từng buổi' : 'Mở rộng nội dung từng buổi'}
          className="w-7 h-7 rounded-full bg-neutral-50 border border-border flex items-center justify-center text-fg-secondary hover:text-fg shrink-0"
        >
          <Icon name={sectionOpen ? 'expand_less' : 'expand_more'} size="sm" />
        </button>
      </div>

      {sectionOpen && (
      <>
      <div className="space-y-2.5">
        {sessionsList.map((s, i) => {
          const isOpen = Boolean(openSessions[i]);
          const label = (s.title || '').trim() || 'Chưa đặt tên';
          return (
            <div key={i} className="border border-border rounded-brand-md overflow-hidden">
              <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleSession(i)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Thu gọn' : 'Mở rộng'} buổi ${i + 1}`}
                  className="flex-1 min-w-0 flex items-center gap-1.5 text-left py-1"
                >
                  <span className="text-caption font-bold text-fg truncate">
                    Buổi {i + 1} — {label}
                  </span>
                  <Icon name={isOpen ? 'expand_less' : 'expand_more'} size="xs" className="shrink-0 text-fg-secondary" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSession(i)}
                  aria-label={`Xóa buổi ${i + 1}`}
                  title={`Xóa buổi ${i + 1}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-fg-secondary hover:text-danger-strong hover:bg-danger-subtle shrink-0"
                >
                  <Icon name="delete" size="xs" />
                </button>
              </div>
              {isOpen && (
                <div className="px-2.5 pb-3 pt-2 space-y-3 border-t border-border">
                  <Field label={`Tiêu đề buổi ${i + 1}`} htmlFor={`service-session-${i}-title`} required>
                    <Input
                      id={`service-session-${i}-title`}
                      maxLength={120}
                      placeholder="Ví dụ: Ôn tập thì hiện tại đơn"
                      value={s.title}
                      onChange={(e) => updateSession(i, 'title', e.target.value)}
                    />
                  </Field>
                  <Field label="Thời lượng" htmlFor={`service-session-${i}-duration`}>
                    <SuffixInput
                      id={`service-session-${i}-duration`}
                      type="number"
                      min="15"
                      max="240"
                      step="5"
                      suffix="phút"
                      placeholder={String(packageDuration)}
                      value={s.durationMinutes}
                      onChange={(e) => updateSession(i, 'durationMinutes', e.target.value)}
                    />
                  </Field>
                  <Field label="Mô tả buổi học" htmlFor={`service-session-${i}-desc`}>
                    <Textarea
                      id={`service-session-${i}-desc`}
                      rows={3}
                      placeholder="Nội dung chính của buổi học…"
                      value={s.description}
                      onChange={(e) => updateSession(i, 'description', e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Trọng tâm kiến thức"
                    htmlFor={`service-session-${i}-topics`}
                    hint="Không bắt buộc — các ý cách nhau bằng dấu phẩy."
                  >
                    <Input
                      id={`service-session-${i}-topics`}
                      placeholder="Ví dụ: Từ vựng, Luyện nghe, Bài tập"
                      value={s.keyTopicsText}
                      onChange={(e) => updateSession(i, 'keyTopicsText', e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
        {sessionsList.length === 0 && (
          <p className="text-caption text-fg-secondary bg-neutral-50 border border-dashed border-border rounded-brand-md p-3">
            Chưa có buổi học chi tiết. Nhấn &ldquo;Thêm buổi&rdquo; để mô tả nội dung từng buổi cho học viên.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSession}
          disabled={maxSessions > 0 && sessionsList.length >= maxSessions}
          icon={<Icon name="add" size="xs" />}
          className="w-full"
        >
          Thêm buổi
          {maxSessions > 0 && ` (${sessionsList.length}/${maxSessions})`}
        </Button>
      </div>

      <Field
        label="Đối tượng phù hợp"
        htmlFor="service-audience"
        hint={`Không bắt buộc — mỗi dòng một đối tượng (tối đa ${AUDIENCE_MAX}).`}
      >
        <Textarea
          id="service-audience"
          rows={3}
          placeholder={'Ví dụ:\nHọc sinh mất gốc cần lấy lại căn bản\nNgười đi làm cần giao tiếp công việc'}
          value={formData.targetAudienceText || ''}
          onChange={(e) => onFieldChange('targetAudienceText', e.target.value)}
        />
      </Field>

      <Field
        label="Điều kiện tiên quyết"
        htmlFor="service-prereq"
        hint={`Không bắt buộc — mỗi dòng một điều kiện (tối đa ${AUDIENCE_MAX}).`}
      >
        <Textarea
          id="service-prereq"
          rows={3}
          placeholder={'Ví dụ:\nĐã nắm bảng chữ cái và phát âm cơ bản\nCó laptop và tai nghe để học online'}
          value={formData.prerequisitesText || ''}
          onChange={(e) => onFieldChange('prerequisitesText', e.target.value)}
        />
      </Field>
      </>
      )}
    </>
  );
}

CurriculumFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  step: PropTypes.number,
};

CurriculumFields.defaultProps = {
  step: 4,
};

/* ── FAQs ── */
export function FaqFields({ formData, onFieldChange }) {
  const faqList = Array.isArray(formData.faqs) ? formData.faqs : [];

  const updateFaq = (index, key, value) => {
    onFieldChange(
      'faqs',
      faqList.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );
  };
  const handleAddFaq = () => {
    if (faqList.length >= FAQ_MAX) return;
    onFieldChange('faqs', [...faqList, { ...EMPTY_FAQ }]);
  };
  const handleRemoveFaq = (index) => {
    onFieldChange(
      'faqs',
      faqList.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-2.5">
      <p className="text-caption font-bold text-fg" id="service-faq-label">
        Câu hỏi thường gặp
      </p>
      {faqList.map((f, i) => (
        <div key={i} className="border border-border rounded-brand-md p-2.5 space-y-2.5" role="group" aria-label={`Câu hỏi thường gặp ${i + 1}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-bold text-fg-secondary">Mục {i + 1}</span>
            <button
              type="button"
              onClick={() => handleRemoveFaq(i)}
              aria-label={`Xóa mục hỏi đáp ${i + 1}`}
              title={`Xóa mục hỏi đáp ${i + 1}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-fg-secondary hover:text-danger-strong hover:bg-danger-subtle shrink-0"
            >
              <Icon name="delete" size="xs" />
            </button>
          </div>
          <Field label="Câu hỏi" htmlFor={`service-faq-${i}-q`} required>
            <Input
              id={`service-faq-${i}-q`}
              maxLength={200}
              placeholder="Ví dụ: Học online hay offline?"
              value={f.question}
              onChange={(e) => updateFaq(i, 'question', e.target.value)}
            />
          </Field>
          <Field label="Câu trả lời" htmlFor={`service-faq-${i}-a`} required>
            <Textarea
              id={`service-faq-${i}-a`}
              rows={2}
              placeholder="Câu trả lời dành cho học viên…"
              value={f.answer}
              onChange={(e) => updateFaq(i, 'answer', e.target.value)}
            />
          </Field>
        </div>
      ))}
      {faqList.length === 0 && (
        <p className="text-caption text-fg-secondary bg-neutral-50 border border-dashed border-border rounded-brand-md p-3">
          Chưa có câu hỏi nào. Thêm các câu hỏi học viên hay thắc mắc để tăng tỉ lệ đăng ký.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddFaq}
        disabled={faqList.length >= FAQ_MAX}
        icon={<Icon name="add" size="xs" />}
        className="w-full"
        aria-labelledby="service-faq-label"
      >
        Thêm câu hỏi
        {` (${faqList.length}/${FAQ_MAX})`}
      </Button>
    </div>
  );
}

FaqFields.propTypes = {
  formData: formDataShape.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};
