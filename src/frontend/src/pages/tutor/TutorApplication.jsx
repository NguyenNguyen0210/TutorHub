import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import tutorService from '@/services/tutor.service';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Field, Textarea, Select, Checkbox } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Callout from '@/components/ui/Callout';

export default function TutorApplication() {
  const toast = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [bio, setBio] = useState('');
  const [teachingMode, setTeachingMode] = useState('Online');
  const [address, setAddress] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('Cử nhân');
  const [experienceYears, setExperienceYears] = useState(3);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!bio || bio.trim().length < 20) {
        toast.error('Vui lòng nhập phần giới thiệu bản thân tối thiểu 20 ký tự.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!university.trim() || !major.trim()) {
        toast.error('Vui lòng nhập đầy đủ trường đào tạo và chuyên ngành.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error('Bạn cần cam kết tính chính xác của thông tin trước khi nộp hồ sơ.');
      return;
    }

    try {
      setSubmitting(true);
      const educationString = `${degreeLevel} - ${major.trim()} (${university.trim()})`;
      await tutorService.submitTutorApplication({
        bio: bio.trim(),
        education: educationString,
        experienceYears: Number(experienceYears) || 0,
        teachingMode,
        address: address.trim() || null,
      });

      toast.success('Đã gửi hồ sơ gia sư thành công! Ban quản trị sẽ kiểm duyệt trong vòng 24 giờ.');
      navigate('/tutor/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Không thể nộp hồ sơ gia sư. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Thông tin & Giới thiệu', icon: 'person' },
    { num: 2, label: 'Học vấn & Bằng cấp', icon: 'school' },
    { num: 3, label: 'Cam kết & Nộp hồ sơ', icon: 'verified' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="primary">Gia nhập đội ngũ gia sư chuyên nghiệp</Badge>
        <h1 className="text-headline-1 text-fg">Đăng ký hồ sơ giảng dạy TutorHub</h1>
        <p className="text-body-reg text-fg-muted max-w-lg mx-auto">
          Hoàn thành hồ sơ thông tin và học vấn để được cấp huy hiệu xác thực và mở lớp trên sàn
        </p>
      </div>

      <Card padding="md">
        <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Tiến độ đăng ký">
          {steps.map((s) => {
            const done = currentStep > s.num;
            const active = currentStep === s.num;
            return (
              <li
                key={s.num}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex flex-col items-center text-center gap-2',
                  active || done ? 'text-brand-primary-700' : 'text-fg-muted'
                )}
              >
                <span
                  className={cn(
                    'w-10 h-10 rounded-brand-md flex items-center justify-center font-bold text-body-reg transition-all',
                    active
                      ? 'bg-brand-primary-600 text-white shadow-brand-md ring-4 ring-brand-primary-100'
                      : done
                        ? 'bg-brand-primary-100 text-brand-primary-700'
                        : 'bg-neutral-100 text-fg-muted'
                  )}
                >
                  {done ? <Icon name="check" size="sm" /> : s.num}
                </span>
                <span className="text-[11px] font-semibold hidden sm:inline">{s.label}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card padding="lg" className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-headline-3 text-fg flex items-center gap-2">
              <Icon name="badge" size="md" className="text-brand-primary-600" />
              Bước 1: Giới thiệu bản thân & Phương thức dạy
            </h2>

            <Field label="Tiểu sử giới thiệu (tối thiểu 20 ký tự)" htmlFor="tutor-bio" required>
              <Textarea
                id="tutor-bio"
                rows={5}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu về phương pháp giảng dạy, kinh nghiệm, thành tích học sinh từng đạt được..."
              />
              <span className="text-[11px] text-fg-muted block text-right mt-1">
                {bio.length} ký tự
              </span>
            </Field>

            <div className="space-y-2">
              <span
                id="teaching-mode-label"
                className="block text-caption font-semibold text-fg-secondary uppercase tracking-wide"
              >
                Hình thức giảng dạy
              </span>
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                role="radiogroup"
                aria-labelledby="teaching-mode-label"
              >
                {[
                  { key: 'Online', label: 'Dạy trực tuyến', desc: 'Google Meet / Zoom' },
                  { key: 'Offline', label: 'Dạy tại nhà', desc: 'Gặp trực tiếp học viên' },
                  { key: 'Both', label: 'Cả hai hình thức', desc: 'Linh hoạt theo yêu cầu' },
                ].map((m) => {
                  const selected = teachingMode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTeachingMode(m.key)}
                      className={cn(
                        'p-4 rounded-brand-md border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600',
                        selected
                          ? 'border-brand-primary-600 bg-brand-primary-50/50'
                          : 'border-border hover:bg-neutral-50'
                      )}
                    >
                      <span className="font-semibold text-body-reg text-fg block">{m.label}</span>
                      <span className="text-[11px] text-fg-muted mt-0.5 block">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(teachingMode === 'Offline' || teachingMode === 'Both') && (
              <Field label="Khu vực có thể dạy (Quận/Huyện, Thành phố)" htmlFor="tutor-address" required>
                <Input
                  id="tutor-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Quận Cầu Giấy, Quận Đống Đa, Hà Nội"
                />
              </Field>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-headline-3 text-fg flex items-center gap-2">
              <Icon name="school" size="md" className="text-brand-primary-600" />
              Bước 2: Trình độ học vấn & Kinh nghiệm
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Trường Đại học / Cao đẳng đào tạo" htmlFor="tutor-uni" required>
                <Input
                  id="tutor-uni"
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Ví dụ: ĐH Sư Phạm Hà Nội, ĐH Ngoại Thương..."
                />
              </Field>

              <Field label="Chuyên ngành đào tạo" htmlFor="tutor-major" required>
                <Input
                  id="tutor-major"
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Ví dụ: Sư phạm Toán, Ngôn ngữ Anh..."
                />
              </Field>

              <Field label="Học vị cao nhất" htmlFor="tutor-degree">
                <Select
                  id="tutor-degree"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                >
                  <option value="Cử nhân">Cử nhân</option>
                  <option value="Thạc sĩ">Thạc sĩ</option>
                  <option value="Tiến sĩ">Tiến sĩ</option>
                  <option value="Sinh viên năm 3-4">Sinh viên năm 3-4</option>
                </Select>
              </Field>

              <Field label="Số năm kinh nghiệm gia sư/giảng dạy" htmlFor="tutor-exp">
                <Input
                  id="tutor-exp"
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-headline-3 text-fg flex items-center gap-2">
              <Icon name="verified" size="md" className="text-brand-primary-600" />
              Bước 3: Xác nhận cam kết & Nộp hồ sơ
            </h2>

            <dl className="p-4 rounded-brand-md bg-neutral-50 border border-border divide-y divide-border text-body-reg">
              {[
                ['Trường đào tạo', university],
                ['Chuyên ngành', major],
                ['Kinh nghiệm', `${experienceYears} năm`],
                ['Hình thức dạy', teachingMode],
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 py-2">
                  <dt className="text-fg-muted">{term}:</dt>
                  <dd className="font-semibold text-fg text-right">{value}</dd>
                </div>
              ))}
            </dl>

            <Callout variant="info">
              <Checkbox
                id="tutor-agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                label="Tôi cam kết các thông tin văn bằng và kinh nghiệm giảng dạy là hoàn toàn chính xác, tuân thủ quy chế bảo chứng học phí Escrow của sàn TutorHub và chịu trách nhiệm pháp lý theo quy định."
              />
            </Callout>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <Button variant="outline" size="md" onClick={() => setCurrentStep((s) => s - 1)}>
              Quay lại
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              variant="success"
              size="md"
              loading={submitting}
              disabled={!agreed}
              onClick={handleSubmit}
              icon={!submitting && <Icon name="send" size="sm" />}
            >
              Nộp hồ sơ xét duyệt ngay
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
