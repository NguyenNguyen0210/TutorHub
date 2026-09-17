import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { message } from 'antd';

export default function TutorApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
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
        message.error('Vui lòng nhập phần giới thiệu bản thân tối thiểu 20 ký tự.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!university.trim() || !major.trim()) {
        message.error('Vui lòng nhập đầy đủ trường đào tạo và chuyên ngành.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      message.error('Bạn cần cam kết tính chính xác của thông tin trước khi nộp hồ sơ.');
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

      message.success('Đã gửi hồ sơ gia sư thành công! Ban quản trị sẽ kiểm duyệt trong vòng 24 giờ.');
      navigate('/tutor/dashboard');
    } catch (err) {
      message.error(err?.message || 'Không thể nộp hồ sơ gia sư. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Thông Tin & Giới Thiệu', icon: 'person' },
    { num: 2, label: 'Học Vấn & Bằng Cấp', icon: 'school' },
    { num: 3, label: 'Cam Kết & Nộp Hồ Sơ', icon: 'verified' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-brand-indigo-50 text-brand-indigo-700 text-xs font-bold uppercase tracking-wider">
          Gia Nhập Đội Ngũ Gia Sư Chuyên Nghiệp
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Đăng Ký Hồ Sơ Giảng Dạy TutorHub
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Hoàn thành hồ sơ thông tin và học vấn để được cấp huy hiệu xác thực và mở lớp trên sàn
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`flex flex-col items-center text-center space-y-2 z-10 transition-colors ${
                currentStep >= s.num ? 'text-brand-indigo-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${
                  currentStep === s.num
                    ? 'bg-brand-indigo-600 text-white shadow-md shadow-brand-indigo-600/30 ring-4 ring-brand-indigo-50'
                    : currentStep > s.num
                    ? 'bg-brand-indigo-100 text-brand-indigo-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > s.num ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  s.num
                )}
              </div>
              <span className="text-[11px] font-bold hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        {/* Step 1: Personal Bio & Mode */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">badge</span>
              Bước 1: Giới Thiệu Bản Thân & Phương Thức Dạy
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="tutor-bio" className="text-xs font-bold text-slate-800 block">
                Tiểu sử giới thiệu (Tối thiểu 20 ký tự) *
              </label>
              <textarea
                id="tutor-bio"
                rows={5}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu về phương pháp giảng dạy, kinh nghiệm, thành tích học sinh từng đạt được..."
                className="w-full p-4 rounded-2xl border border-border-light text-xs text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none leading-relaxed"
              />
              <span className="text-[11px] text-text-muted block text-right">
                {bio.length} ký tự
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Hình thức giảng dạy *</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Hình thức giảng dạy">
                {[
                  { key: 'Online', label: 'Dạy Trực Tuyến', desc: 'Google Meet / Zoom' },
                  { key: 'Offline', label: 'Dạy Tại Nhà', desc: 'Gặp trực tiếp học viên' },
                  { key: 'Both', label: 'Cả Hai Hình Thức', desc: 'Linh hoạt theo yêu cầu' },
                ].map((m) => (
                  <div
                    key={m.key}
                    role="radio"
                    aria-checked={teachingMode === m.key}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTeachingMode(m.key);
                      }
                    }}
                    onClick={() => setTeachingMode(m.key)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-indigo-500 ${
                      teachingMode === m.key
                        ? 'border-brand-indigo-600 bg-brand-indigo-50/50 text-brand-indigo-950'
                        : 'border-border-light hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">{m.label}</span>
                    <span className="text-[11px] text-text-muted mt-0.5 block">{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {(teachingMode === 'Offline' || teachingMode === 'Both') && (
              <div className="space-y-1.5">
                <label htmlFor="tutor-address" className="text-xs font-bold text-slate-800 block">
                  Khu vực có thể dạy (Quận/Huyện, Thành phố) *
                </label>
                <input
                  id="tutor-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Quận Cầu Giấy, Quận Đống Đa, Hà Nội"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Academic & Education */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">school</span>
              Bước 2: Trình Độ Học Vấn & Kinh Nghiệm
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="tutor-uni" className="text-xs font-bold text-slate-800 block">
                  Trường Đại học / Cao đẳng đào tạo *
                </label>
                <input
                  id="tutor-uni"
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Ví dụ: ĐH Sư Phạm Hà Nội, ĐH Ngoại Thương..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tutor-major" className="text-xs font-bold text-slate-800 block">
                  Chuyên ngành đào tạo *
                </label>
                <input
                  id="tutor-major"
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Ví dụ: Sư phạm Toán, Ngôn ngữ Anh..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tutor-degree" className="text-xs font-bold text-slate-800 block">
                  Học vị cao nhất
                </label>
                <select
                  id="tutor-degree"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none bg-white"
                >
                  <option value="Cử nhân">Cử nhân</option>
                  <option value="Thạc sĩ">Thạc sĩ</option>
                  <option value="Tiến sĩ">Tiến sĩ</option>
                  <option value="Sinh viên năm 3-4">Sinh viên năm 3-4</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tutor-exp" className="text-xs font-bold text-slate-800 block">
                  Số năm kinh nghiệm gia sư/giảng dạy
                </label>
                <input
                  id="tutor-exp"
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Legal Commit */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">verified</span>
              Bước 3: Xác Nhận Cam Kết & Nộp Hồ Sơ
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Trường đào tạo:</span>
                <span className="font-bold text-slate-800">{university}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Chuyên ngành:</span>
                <span className="font-bold text-slate-800">{major}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Kinh nghiệm:</span>
                <span className="font-bold text-slate-800">{experienceYears} năm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức dạy:</span>
                <span className="font-bold text-slate-800">{teachingMode}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-indigo-50 border border-brand-indigo-200 text-xs">
              <label htmlFor="tutor-agreement" className="flex items-start gap-3 cursor-pointer">
                <input
                  id="tutor-agreement"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-brand-indigo-600 focus:ring-brand-indigo-500 border-border-light"
                />
                <span className="text-xs text-brand-indigo-950 leading-relaxed font-medium">
                  Tôi cam kết các thông tin văn bằng và kinh nghiệm giảng dạy là hoàn toàn chính xác, tuân thủ quy chế bảo chứng học phí Escrow của sàn TutorHub và chịu trách nhiệm pháp lý theo quy định.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="py-2.5 px-5 rounded-xl border border-border-light text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Quay lại
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-6 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !agreed}
              onClick={handleSubmit}
              className="py-3 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {submitting ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Xét Duyệt Ngay'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
