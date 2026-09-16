import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { TEACHING_MODE } from '@/config/enums';
import { message } from 'antd';

export default function TutorApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [bio, setBio] = useState(
    'Cử nhân Sư phạm Toán với 5 năm kinh nghiệm giảng dạy và luyện thi đại học điểm 9+.'
  );
  const [teachingMode, setTeachingMode] = useState(TEACHING_MODE.BOTH);
  const [address, setAddress] = useState('Quận Cầu Giấy, Hà Nội');

  const [university, setUniversity] = useState('Đại Học Sư Phạm Hà Nội');
  const [major, setMajor] = useState('Sư phạm Toán học');
  const [degreeLevel, setDegreeLevel] = useState('Cử nhân Xuất sắc (GPA 3.8/4.0)');
  const [experienceYears, setExperienceYears] = useState(5);

  const [files, setFiles] = useState([
    'Bang-Cu-Nhan-DHSPHN.pdf',
    'Chung-Chi-Nghiep-Vu-Su-Pham.pdf',
  ]);
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
      if (!university || !major) {
        message.error('Vui lòng nhập đầy đủ trường đào tạo và chuyên ngành.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (files.length === 0) {
        message.error('Vui lòng đính kèm ít nhất 1 tài liệu chứng chỉ.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      message.error('Bạn cần cam kết tính chính xác của thông tin trước khi nộp hồ sơ.');
      return;
    }

    try {
      setSubmitting(true);
      const educationString = `${degreeLevel} - ${major} (${university})`;
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
    { num: 2, label: 'Bằng Cấp & Học Thuật', icon: 'school' },
    { num: 3, label: 'Minh Chứng Văn Bằng', icon: 'description' },
    { num: 4, label: 'Cam Kết & Nộp Hồ Sơ', icon: 'verified' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Quy Trình Xác Thực Hồ Sơ Gia Sư Bảo Chứng
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Hoàn thành 4 bước để nhận huy hiệu Verified Master Tutor và kích hoạt nhận giải ngân Escrow
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setCurrentStep(s.num);
              }}
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                isDone
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 cursor-pointer'
                  : isCurrent
                  ? 'bg-brand-indigo-50 border-2 border-brand-indigo-500 text-brand-indigo-700 shadow-xs'
                  : 'bg-slate-100 border border-slate-200 text-slate-400'
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  isDone ? 'text-financial-available' : isCurrent ? 'text-brand-indigo-600' : 'text-slate-400'
                }`}
              >
                {isDone ? 'check_circle' : s.icon}
              </span>
              <span className="truncate">Bước {s.num}: {s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        {/* Step 1: Info & Bio */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">person</span>
              Bước 1: Thông Tin Chung & Giới Thiệu
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Giới thiệu bản thân & Phương pháp giảng dạy (Tối thiểu 20 ký tự)
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 rounded-xl border border-border-light text-xs text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden leading-relaxed"
                placeholder="Mô tả phong cách giảng dạy, thế mạnh môn học và kinh nghiệm luyện thi..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Hình thức giảng dạy</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden bg-white"
                >
                  <option value={TEACHING_MODE.BOTH}>Cả Trực Tuyến & Tại Nhà (Both)</option>
                  <option value={TEACHING_MODE.ONLINE}>Chỉ Dạy Online</option>
                  <option value={TEACHING_MODE.OFFLINE}>Chỉ Dạy Tại Nhà (Offline)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Khu vực dạy chính (Offline)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Quận Cầu Giấy, Hà Nội"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Credentials */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">school</span>
              Bước 2: Thông Tin Học Thuật & Văn Bằng Chuyên Môn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Trường Đại Học tốt nghiệp</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Chuyên ngành đào tạo</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Học vị / Bằng cấp cao nhất</label>
                <input
                  type="text"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Số năm kinh nghiệm gia sư</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">description</span>
              Bước 3: Minh Chứng Văn Bằng & Chứng Chỉ
            </h3>

            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
              <span className="material-symbols-outlined text-4xl text-slate-400">cloud_upload</span>
              <p className="text-xs font-bold text-slate-700 m-0">Tải lên scan văn bằng (PDF, PNG, JPG)</p>
              <p className="text-[11px] text-slate-400 m-0">Hỗ trợ bằng đại học, thạc sĩ, chứng chỉ IELTS / sư phạm (tối đa 10MB/tệp)</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Tệp đính kèm đã sẵn sàng ({files.length}):</span>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <span className="material-symbols-outlined text-brand-indigo-600 text-lg">check_circle</span>
                    <span className="font-medium">{file}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review & Legal Commit */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">verified</span>
              Bước 4: Xác Nhận Cam Kết & Nộp Hồ Sơ
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
              <label className="flex items-start gap-3 cursor-pointer">
                <input
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

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((c) => c - 1)}
              className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Quay Lại Bước {currentStep - 1}
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-6 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Tiếp Tục Sang Bước {currentStep + 1}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !agreed}
              onClick={handleSubmit}
              className="py-3 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {submitting ? 'Đang gửi hồ sơ...' : 'Xác Nhận Nộp Hồ Sơ Xét Duyệt'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
