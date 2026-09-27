import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Input, { Textarea, Select, Field, Checkbox } from '@/components/ui/Input';
import {
  BIO_MAX,
  AVATAR_ACCEPT,
  DEGREE_ACCEPT,
  GENDER_OPTIONS,
  GRADE_LEVELS,
  POPULAR_SUBJECTS,
  TEACHING_MODE_OPTIONS,
  needsOfflineArea,
  toggleListValue,
} from './applicationFormUtils';

/* ── Local presentational helpers (not exported) ──────────────────────────── */

/** Danh sách học vị — value khác label ở 2 mục cuối, giữ nguyên copy gốc. */
const DEGREE_OPTIONS = [
  { value: 'Cử nhân', label: 'Cử nhân (Đã tốt nghiệp Đại học)' },
  { value: 'Thạc sĩ', label: 'Thạc sĩ' },
  { value: 'Tiến sĩ', label: 'Tiến sĩ' },
  { value: 'Sinh viên năm 3-4', label: 'Sinh viên năm 3 hoặc năm cuối' },
  { value: 'Giảng viên Đại học', label: 'Giảng viên Đại học / Cao đẳng' },
];

/** Tiêu đề bước: số thứ tự + tên bước + mô tả ngắn, gạch dưới. */
function StepHeading({ step, title, description }) {
  return (
    <div className="border-b border-border pb-4">
      <h2 className="text-headline-2 font-bold text-fg">
        {step}. {title}
      </h2>
      <p className="text-caption text-fg-muted mt-1">{description}</p>
    </div>
  );
}

StepHeading.propTypes = {
  step: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

/** Nhãn nhóm (không gắn với một control cụ thể) — dùng <p> để không tạo <label> mồ côi. */
function GroupLabel({ children, required = false }) {
  return (
    <p className="block text-caption font-semibold text-fg-secondary mb-1.5">
      {children}
      {required && (
        <span className="text-danger ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </p>
  );
}

GroupLabel.propTypes = { children: PropTypes.node.isRequired, required: PropTypes.bool };

/** Input có icon dẫn hướng bên trái — vẫn là `Input` chuẩn, chỉ thêm padding. */
function IconInput({ id, icon, className, ...rest }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
        <Icon name={icon} size="md" />
      </span>
      <Input id={id} className={cn('pl-10', className)} {...rest} />
    </div>
  );
}

IconInput.propTypes = { id: PropTypes.string.isRequired, icon: PropTypes.string.isRequired };

/**
 * Vùng kéo-thả tệp. Bấm vào vùng sẽ gọi `onActivate` (bấm vào input file ẩn qua ref),
 * kéo tệp vào sẽ báo `onDrop` — hành vi upload giữ nguyên như trước.
 */
function Dropzone({
  isDragging,
  onActivate,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  icon,
  iconSize,
  primary,
  secondary,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'w-full border-2 border-dashed rounded-brand-lg p-6 text-center cursor-pointer transition-all group',
        isDragging
          ? 'border-brand-primary-600 bg-brand-primary-50/80 ring-4 ring-brand-primary-100 scale-[1.01]'
          : 'border-border hover:border-brand-primary-400 bg-neutral-50 hover:bg-brand-primary-50/30',
        className
      )}
    >
      <Icon
        name={icon}
        size={iconSize}
        className={cn(
          'mx-auto mb-2 transition-transform group-hover:scale-110',
          isDragging ? 'text-brand-primary-700' : 'text-fg-muted'
        )}
      />
      <span className="text-caption font-bold text-brand-primary-700 block">{primary}</span>
      <span className="text-caption text-fg-muted mt-1 block">{secondary}</span>
    </button>
  );
}

Dropzone.propTypes = {
  isDragging: PropTypes.bool.isRequired,
  onActivate: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  iconSize: PropTypes.string.isRequired,
  primary: PropTypes.string.isRequired,
  secondary: PropTypes.string.isRequired,
  className: PropTypes.string,
};

/** Ô chọn dạng thẻ (khối lớp, đối tượng học viên). */
function ChoiceCard({ selected, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'p-3 rounded-brand-lg border text-left text-caption transition-all flex items-center justify-between cursor-pointer',
        selected
          ? 'border-brand-primary-600 bg-brand-primary-50/60 text-brand-primary-700 font-semibold'
          : 'border-border text-fg-secondary hover:bg-neutral-50',
        className
      )}
    >
      <span>{children}</span>
      {selected && <Icon name="check" size="xs" />}
    </button>
  );
}

ChoiceCard.propTypes = {
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

/** Nút chọn dạng pill (môn học, hình thức giảng dạy). */
function PillToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3.5 py-1.5 rounded-pill text-caption font-medium transition-all border cursor-pointer',
        active
          ? 'bg-brand-primary-600 text-white border-brand-primary-600 shadow-brand-sm'
          : 'bg-surface text-fg-secondary border-border hover:bg-neutral-50'
      )}
    >
      {children}
    </button>
  );
}

PillToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

const formDataShape = PropTypes.shape({
  fullName: PropTypes.string,
  dob: PropTypes.string,
  gender: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  address: PropTypes.string,
  avatarUrl: PropTypes.string,
  avatarPreview: PropTypes.string,
  bio: PropTypes.string,
  university: PropTypes.string,
  major: PropTypes.string,
  degreeLevel: PropTypes.string,
  certifications: PropTypes.string,
  degreeFiles: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, size: PropTypes.string, previewUrl: PropTypes.string })
  ),
  experienceYears: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  targetStudents: PropTypes.arrayOf(PropTypes.string),
  achievements: PropTypes.string,
  teachingMode: PropTypes.string,
  offlineArea: PropTypes.string,
  subjects: PropTypes.arrayOf(PropTypes.string),
  grades: PropTypes.arrayOf(PropTypes.string),
  methodology: PropTypes.string,
  curriculum: PropTypes.string,
  commitments: PropTypes.string,
  agreed: PropTypes.bool,
});

const baseProps = { formData: formDataShape.isRequired, onFieldChange: PropTypes.func.isRequired };

/* ══ BƯỚC 1 — Thông tin cá nhân ═══════════════════════════════════════════ */

export function PersonalInfoStep({
  formData,
  onFieldChange,
  isDraggingAvatar,
  avatarInputRef,
  onAvatarActivate,
  onAvatarDragOver,
  onAvatarDragLeave,
  onAvatarDrop,
  onAvatarChange,
}) {
  const bio = formData.bio || '';
  const avatarSrc = formData.avatarPreview || formData.avatarUrl;

  return (
    <div className="space-y-5">
      <StepHeading
        step={1}
        title="Thông tin cá nhân"
        description="Hãy chia sẻ một số thông tin cơ bản để chúng tôi hiểu rõ hơn về bạn."
      />

      {/* Họ và tên + Ngày sinh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Họ và tên" htmlFor="tutor-name" required>
          <IconInput
            id="tutor-name"
            icon="person"
            value={formData.fullName}
            onChange={(e) => onFieldChange('fullName', e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </Field>
        <Field label="Ngày sinh" htmlFor="tutor-dob" required>
          <IconInput
            id="tutor-dob"
            type="date"
            icon="calendar_month"
            value={formData.dob}
            onChange={(e) => onFieldChange('dob', e.target.value)}
          />
        </Field>
      </div>

      {/* Giới tính + Số điện thoại */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <GroupLabel required>Giới tính</GroupLabel>
          <div className="flex items-center gap-4 h-10" role="group" aria-label="Giới tính">
            {GENDER_OPTIONS.map((g) => {
              const isChecked = formData.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onFieldChange('gender', g)}
                  aria-pressed={isChecked}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                      isChecked
                        ? 'border-brand-primary-600 bg-brand-primary-600'
                        : 'border-border bg-surface group-hover:border-neutral-400'
                    )}
                  >
                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
                  </span>
                  <span className="text-caption font-medium text-fg-secondary">{g}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Số điện thoại" htmlFor="tutor-phone" required>
          <IconInput
            id="tutor-phone"
            type="tel"
            icon="call"
            value={formData.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            placeholder="0901 234 567"
          />
        </Field>
      </div>

      {/* Email */}
      <Field label="Email" htmlFor="tutor-email" required>
        <IconInput
          id="tutor-email"
          type="email"
          icon="mail"
          value={formData.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          placeholder="nguyenvana@example.com"
        />
      </Field>

      {/* Địa chỉ hiện tại */}
      <Field label="Địa chỉ hiện tại" htmlFor="tutor-address" required>
        <IconInput
          id="tutor-address"
          icon="location_on"
          value={formData.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          placeholder="Quận Cầu Giấy, Hà Nội"
        />
      </Field>

      {/* Ảnh đại diện */}
      <div>
        <GroupLabel required>Ảnh đại diện</GroupLabel>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full border-2 border-border shadow-brand-sm overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Ảnh xem trước" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" size="xl" className="text-fg-muted" />
            )}
          </div>

          <div className="flex-1">
            <Dropzone
              isDragging={isDraggingAvatar}
              onActivate={onAvatarActivate}
              onDragOver={onAvatarDragOver}
              onDragLeave={onAvatarDragLeave}
              onDrop={onAvatarDrop}
              icon="file_upload"
              iconSize="md"
              primary="Tải ảnh lên"
              secondary="JPG, PNG (tối đa 5MB)"
              className="p-4 flex flex-col items-center justify-center"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              onChange={onAvatarChange}
              aria-label="Chọn ảnh đại diện"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Giới thiệu bản thân */}
      <div>
        <Field label="Giới thiệu bản thân" htmlFor="tutor-bio" required>
          <Textarea
            id="tutor-bio"
            rows={4}
            maxLength={BIO_MAX}
            value={formData.bio}
            onChange={(e) => onFieldChange('bio', e.target.value)}
            placeholder="Hãy giới thiệu ngắn gọn về bản thân, thế mạnh, phong cách giảng dạy và lý do bạn muốn trở thành gia sư trên TutorHub..."
          />
        </Field>
        <div className="flex justify-between items-center text-[11px] text-fg-muted">
          <span>Tối thiểu 20 ký tự</span>
          <span>
            {bio.length}/{BIO_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}

PersonalInfoStep.propTypes = {
  ...baseProps,
  isDraggingAvatar: PropTypes.bool.isRequired,
  avatarInputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  onAvatarActivate: PropTypes.func.isRequired,
  onAvatarDragOver: PropTypes.func.isRequired,
  onAvatarDragLeave: PropTypes.func.isRequired,
  onAvatarDrop: PropTypes.func.isRequired,
  onAvatarChange: PropTypes.func.isRequired,
};

/* ══ BƯỚC 2 — Học vấn & chứng chỉ ════════════════════════════════════════ */

export function EducationStep({
  formData,
  onFieldChange,
  isDraggingDegree,
  degreeInputRef,
  onDegreeActivate,
  onDegreeDragOver,
  onDegreeDragEnter,
  onDegreeDragLeave,
  onDegreeDrop,
  onDegreeChange,
  onRemoveDegreeFile,
}) {
  const degreeFiles = formData.degreeFiles || [];

  return (
    <div className="space-y-5">
      <StepHeading
        step={2}
        title="Học vấn & chứng chỉ"
        description="Cung cấp thông tin bằng cấp và chứng chỉ chuyên môn để xác minh hồ sơ."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Trường Đại học / Học viện" htmlFor="tutor-uni" required>
          <Input
            id="tutor-uni"
            value={formData.university}
            onChange={(e) => onFieldChange('university', e.target.value)}
            placeholder="ĐH Sư phạm Hà Nội, ĐH Ngoại thương..."
          />
        </Field>
        <Field label="Chuyên ngành đào tạo" htmlFor="tutor-major" required>
          <Input
            id="tutor-major"
            value={formData.major}
            onChange={(e) => onFieldChange('major', e.target.value)}
            placeholder="Sư phạm Toán, Ngôn ngữ Anh..."
          />
        </Field>
      </div>

      <Field label="Học vị cao nhất" htmlFor="tutor-degree" required>
        <Select
          id="tutor-degree"
          value={formData.degreeLevel}
          onChange={(e) => onFieldChange('degreeLevel', e.target.value)}
        >
          {DEGREE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Chứng chỉ chuyên môn bổ trợ" htmlFor="tutor-certs">
        <Input
          id="tutor-certs"
          value={formData.certifications}
          onChange={(e) => onFieldChange('certifications', e.target.value)}
          placeholder="Ví dụ: IELTS 8.0, TOEIC 950, Chứng chỉ Nghiệp vụ Sư phạm..."
        />
      </Field>

      {/* Tải lên ảnh bằng cấp / thẻ sinh viên minh chứng */}
      <div>
        <GroupLabel>Tải lên ảnh bằng cấp / thẻ sinh viên minh chứng</GroupLabel>
        <div className="space-y-2">
          <Dropzone
            isDragging={isDraggingDegree}
            onActivate={onDegreeActivate}
            onDragOver={onDegreeDragOver}
            onDragEnter={onDegreeDragEnter}
            onDragLeave={onDegreeDragLeave}
            onDrop={onDegreeDrop}
            icon="cloud_upload"
            iconSize="xl"
            primary="Chọn tệp văn bằng hoặc kéo thả vào đây"
            secondary="Hỗ trợ PDF, JPG, PNG tối đa 10MB mỗi tệp"
          />
          <input
            ref={degreeInputRef}
            type="file"
            multiple
            accept={DEGREE_ACCEPT}
            onChange={onDegreeChange}
            aria-label="Chọn tệp minh chứng bằng cấp"
            className="hidden"
          />
        </div>

        {degreeFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-caption font-semibold text-fg-secondary block">
              Tệp đã đính kèm ({degreeFiles.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {degreeFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-brand-lg border border-border bg-surface shadow-brand-sm group hover:border-neutral-300 transition-colors"
                >
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-brand-md object-cover border border-border shrink-0"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="w-10 h-10 rounded-brand-md bg-danger-subtle text-danger-strong flex items-center justify-center shrink-0 font-bold text-caption border border-danger/20"
                    >
                      PDF
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="text-caption font-semibold text-fg truncate block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-fg-muted block">{item.size} MB</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDegreeFile(item.id);
                    }}
                    aria-label={`Xóa tệp ${item.name}`}
                    title="Xóa tệp"
                    className="w-7 h-7 rounded-brand-md hover:bg-danger-subtle text-fg-muted hover:text-danger-strong flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EducationStep.propTypes = {
  ...baseProps,
  isDraggingDegree: PropTypes.bool.isRequired,
  degreeInputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  onDegreeActivate: PropTypes.func.isRequired,
  onDegreeDragOver: PropTypes.func.isRequired,
  onDegreeDragEnter: PropTypes.func.isRequired,
  onDegreeDragLeave: PropTypes.func.isRequired,
  onDegreeDrop: PropTypes.func.isRequired,
  onDegreeChange: PropTypes.func.isRequired,
  onRemoveDegreeFile: PropTypes.func.isRequired,
};

/* ══ BƯỚC 3 — Kinh nghiệm giảng dạy ═════════════════════════════════════ */

export function ExperienceStep({ formData, onFieldChange }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step={3}
        title="Kinh nghiệm giảng dạy"
        description="Chia sẻ về thâm niên, đối tượng học sinh và những thành tựu bạn đã đạt được."
      />

      <Field label="Số năm kinh nghiệm giảng dạy / gia sư" htmlFor="tutor-exp" required>
        <div className="flex items-center gap-3">
          <Input
            id="tutor-exp"
            type="number"
            min="0"
            max="40"
            className="w-32"
            value={formData.experienceYears}
            onChange={(e) => onFieldChange('experienceYears', e.target.value)}
          />
          <span className="text-caption text-fg-secondary font-medium">năm kinh nghiệm</span>
        </div>
      </Field>

      <div>
        <GroupLabel>Đối tượng học viên bạn từng kèm cặp nhiều nhất</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GRADE_LEVELS.map((g) => (
            <ChoiceCard
              key={g}
              selected={formData.targetStudents.includes(g)}
              onClick={() => onFieldChange('targetStudents', toggleListValue(formData.targetStudents, g))}
            >
              {g}
            </ChoiceCard>
          ))}
        </div>
      </div>

      <Field label="Thành tích tiêu biểu của học sinh hoặc giải thưởng chuyên môn" htmlFor="tutor-achievements">
        <Textarea
          id="tutor-achievements"
          rows={3}
          value={formData.achievements}
          onChange={(e) => onFieldChange('achievements', e.target.value)}
          placeholder="Ví dụ: Giúp học sinh đậu trường chuyên, điểm thi tăng từ 5 lên 8.5+, đạt giải HSG cấp thành phố..."
        />
      </Field>
    </div>
  );
}

ExperienceStep.propTypes = { ...baseProps };

/* ══ BƯỚC 4 — Môn học & lớp dạy ═════════════════════════════════════════ */

export function SubjectsStep({ formData, onFieldChange }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step={4}
        title="Môn học & lớp dạy"
        description="Chọn hình thức bạn có thể đáp ứng và môn học sở trường."
      />

      {/* Hình thức giảng dạy */}
      <div>
        <GroupLabel required>Hình thức giảng dạy</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEACHING_MODE_OPTIONS.map((m) => {
            const selected = formData.teachingMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onFieldChange('teachingMode', m.key)}
                aria-pressed={selected}
                className={cn(
                  'p-3.5 rounded-brand-lg border-2 text-left transition-all cursor-pointer',
                  selected
                    ? 'border-brand-primary-600 bg-brand-primary-50/50 shadow-brand-sm'
                    : 'border-border hover:bg-neutral-50'
                )}
              >
                <span className="font-bold text-caption text-fg block">{m.label}</span>
                <span className="text-[11px] text-fg-muted mt-0.5 block">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khu vực nhận dạy trực tiếp */}
      {needsOfflineArea(formData.teachingMode) && (
        <Field label="Khu vực nhận dạy trực tiếp (Quận/Huyện)" htmlFor="tutor-area" required>
          <Input
            id="tutor-area"
            value={formData.offlineArea}
            onChange={(e) => onFieldChange('offlineArea', e.target.value)}
            placeholder="Ví dụ: Quận Cầu Giấy, Nam Từ Liêm, Hà Nội"
          />
        </Field>
      )}

      {/* Môn học thế mạnh */}
      <div>
        <GroupLabel required>Môn học thế mạnh</GroupLabel>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SUBJECTS.map((s) => (
            <PillToggle
              key={s}
              active={formData.subjects.includes(s)}
              onClick={() => onFieldChange('subjects', toggleListValue(formData.subjects, s))}
            >
              {s}
            </PillToggle>
          ))}
        </div>
      </div>

      {/* Khối lớp sẵn sàng nhận dạy */}
      <div>
        <GroupLabel>Khối lớp sẵn sàng nhận dạy</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GRADE_LEVELS.map((g) => (
            <ChoiceCard
              key={g}
              selected={formData.grades.includes(g)}
              onClick={() => onFieldChange('grades', toggleListValue(formData.grades, g))}
              className="p-2.5"
            >
              {g}
            </ChoiceCard>
          ))}
        </div>
      </div>
    </div>
  );
}

SubjectsStep.propTypes = { ...baseProps };

/* ══ BƯỚC 5 — Giáo trình & phương pháp ═══════════════════════════════════ */

export function MethodologyStep({ formData, onFieldChange }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step={5}
        title="Giáo trình & phương pháp"
        description="Phong cách giảng dạy đặc trưng giúp phụ huynh và học sinh tin tưởng lựa chọn bạn."
      />

      <Field label="Phương pháp giảng dạy chủ đạo" htmlFor="tutor-method" required>
        <Textarea
          id="tutor-method"
          rows={3}
          value={formData.methodology}
          onChange={(e) => onFieldChange('methodology', e.target.value)}
          placeholder="Ví dụ: Cá nhân hóa lộ trình, học qua ví dụ thực tế, luyện phản xạ và chữa lỗi chi tiết..."
        />
      </Field>

      <Field label="Giáo trình & Tài liệu học tập sử dụng" htmlFor="tutor-curriculum">
        <Input
          id="tutor-curriculum"
          value={formData.curriculum}
          onChange={(e) => onFieldChange('curriculum', e.target.value)}
          placeholder="Bộ SGK mới, Cambridge, Oxford, bộ đề tự soạn..."
        />
      </Field>

      <Field label="Cam kết chất lượng đầu ra cho học viên" htmlFor="tutor-commitment">
        <Textarea
          id="tutor-commitment"
          rows={2}
          value={formData.commitments}
          onChange={(e) => onFieldChange('commitments', e.target.value)}
          placeholder="Ví dụ: Cam kết tiến bộ sau 1 tháng, hỗ trợ giải đáp thắc mắc bài tập ngoài giờ qua tin nhắn..."
        />
      </Field>
    </div>
  );
}

MethodologyStep.propTypes = { ...baseProps };

/* ══ BƯỚC 6 — Xem lại & gửi hồ sơ ═════════════════════════════════════════ */

function SummaryRow({ label, children }) {
  return (
    <div className="flex justify-between pt-2">
      <span className="text-fg-muted">{label}</span>
      {children}
    </div>
  );
}

SummaryRow.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node };

export function ReviewStep({ formData, onFieldChange }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step={6}
        title="Xem lại & gửi hồ sơ"
        description="Vui lòng kiểm tra lại toàn bộ thông tin đăng ký trước khi gửi đến ban kiểm duyệt."
      />

      <div className="p-4 rounded-brand-lg bg-neutral-50 border border-border divide-y divide-border text-caption space-y-2.5">
        <div className="flex justify-between py-1">
          <span className="text-fg-muted">Họ và tên:</span>
          <span className="font-semibold text-fg">{formData.fullName}</span>
        </div>
        <SummaryRow label="Số điện thoại / Email:">
          <span className="font-semibold text-fg">
            {formData.phone} • {formData.email}
          </span>
        </SummaryRow>
        <SummaryRow label="Trường đào tạo & Học vị:">
          <span className="font-semibold text-fg text-right">
            {formData.degreeLevel} - {formData.major} ({formData.university})
          </span>
        </SummaryRow>
        {formData.degreeFiles.length > 0 && (
          <SummaryRow label="Tệp minh chứng:">
            <span className="font-semibold text-success text-right">
              {formData.degreeFiles.length} tệp đã đính kèm
            </span>
          </SummaryRow>
        )}
        <SummaryRow label="Kinh nghiệm:">
          <span className="font-semibold text-fg">{formData.experienceYears} năm</span>
        </SummaryRow>
        <SummaryRow label="Hình thức giảng dạy:">
          <span className="font-semibold text-fg">{formData.teachingMode}</span>
        </SummaryRow>
        <SummaryRow label="Môn học nhận dạy:">
          <span className="font-semibold text-brand-primary-700 text-right">
            {formData.subjects.join(', ')}
          </span>
        </SummaryRow>
      </div>

      {/* Cam kết Escrow */}
      <div className="p-4 rounded-brand-lg bg-brand-primary-50 border border-brand-primary-200">
        <Checkbox
          id="tutor-agreed"
          checked={formData.agreed}
          onChange={(e) => onFieldChange('agreed', e.target.checked)}
          label="Tôi cam kết mọi thông tin cung cấp về bằng cấp, kinh nghiệm và chứng chỉ là hoàn toàn chính xác. Tôi đồng ý tuân thủ quy chế giải ngân học phí bảo chứng Escrow của TutorHub và chịu hoàn toàn trách nhiệm trước quy định của pháp luật."
        />
      </div>
    </div>
  );
}

ReviewStep.propTypes = { ...baseProps };
