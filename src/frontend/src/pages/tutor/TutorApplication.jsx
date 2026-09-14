import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

export default function TutorApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2); // Step 2: Academic Credentials
  const [university, setUniversity] = useState('Đại Học Sư Phạm Hà Nội');
  const [major, setMajor] = useState('Sư phạm Toán học');
  const [degreeLevel, setDegreeLevel] = useState('Cử nhân Xuất sắc (GPA 3.8/4.0)');
  const [gradYear, setGradYear] = useState('2021');
  const [experienceYears, setExperienceYears] = useState('5');
  const [agreed, setAgreed] = useState(true);

  const handleNext = () => {
    message.success('Đã lưu hồ sơ học thuật thành công! Đang chuyển sang Bước 3...');
    setCurrentStep(3);
  };

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
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-financial-available text-lg">check_circle</span>
          Bước 1: KYC Căn Cước
        </div>
        <div className="p-3 rounded-2xl bg-brand-indigo-50 border-2 border-brand-indigo-500 text-brand-indigo-700 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-indigo-600 text-lg">edit</span>
          Bước 2: Bằng Cấp & Học Thuật
        </div>
        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">pending</span>
          Bước 3: Môn Học & Video Thử
        </div>
        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">pending</span>
          Bước 4: Ngân Hàng Escrow
        </div>
      </div>

      {/* Step 2 Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
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
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Trình độ cao nhất</label>
            <input
              type="text"
              value={degreeLevel}
              onChange={(e) => setDegreeLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Năm tốt nghiệp</label>
              <input
                type="text"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Số năm kinh nghiệm</label>
              <input
                type="text"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 block">Tài liệu minh chứng đã tải lên</label>
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-xl">picture_as_pdf</span>
                <span className="font-bold text-slate-800">Bang-Cu-Nhan-Su-Pham-Toan.pdf</span>
                <span className="text-[10px] text-text-muted">(1.4 MB)</span>
              </div>
              <span className="text-financial-available font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Đã tải lên
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-xl">picture_as_pdf</span>
                <span className="font-bold text-slate-800">Chung-Chi-Nghiep-Vu-Su-Pham.pdf</span>
                <span className="text-[10px] text-text-muted">(850 KB)</span>
              </div>
              <span className="text-financial-available font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Đã tải lên
              </span>
            </div>
          </div>
        </div>

        {/* Legal commitment */}
        <div className="pt-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-brand-indigo-600 focus:ring-brand-indigo-500 border-border-light"
            />
            <span className="text-xs text-slate-600 leading-normal">
              Tôi cam kết các thông tin văn bằng là chính xác và chịu hoàn toàn trách nhiệm pháp lý theo điều khoản quy chế sàn TutorHub.
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-border-light">
          <button
            type="button"
            onClick={handleNext}
            className="py-3 px-6 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Lưu & Tiếp Tục Sang Bước 3</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
          >
            Quay Lại Bước 1
          </button>
        </div>
      </div>
    </div>
  );
}
