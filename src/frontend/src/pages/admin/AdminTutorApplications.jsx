import React, { useState } from 'react';
import { message } from 'antd';

export default function AdminTutorApplications() {
  const [selectedApp, setSelectedApp] = useState('app-1');

  const applicants = [
    {
      id: 'app-1',
      fullName: 'ThS. Nguyễn Văn An',
      university: 'Đại Học Sư Phạm Hà Nội',
      major: 'Toán THPT',
      date: '12/09/2026',
      phone: '0912345678',
      email: 'tutor.an@tutorhub.com',
      files: ['Bang-Thac-Si-Toan-DHSPHN.pdf', 'CCCD-Nguyen-Van-An.jpg', 'Video-Day-Thu.mp4'],
    },
    {
      id: 'app-2',
      fullName: 'Trần Thị Bích, M.Ed',
      university: 'ĐH Ngoại Thương',
      major: 'Luyện thi IELTS 8.0+',
      date: '11/09/2026',
      phone: '0923456789',
      email: 'tutor.bich@tutorhub.com',
      files: ['Bang-Cu-Nhan-Ngoai-Thuong.pdf', 'Chung-Chi-IELTS-8.5.pdf'],
    }
  ];

  const current = applicants.find((a) => a.id === selectedApp) || applicants[0];

  const handleApprove = () => {
    message.success(`Đã phê duyệt và cấp Verified Badge cho ${current.fullName}!`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Bàn Kiểm Duyệt Hồ Sơ Gia Sư & Xác Minh Bằng Cấp
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kiểm tra bằng đại học, chứng chỉ sư phạm và thông tin KYC trước khi cấp huy hiệu Verified Master Tutor
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Applicants List */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-bold text-slate-400 block mb-3">Hồ Sơ Chờ Duyệt (2)</span>
            <div className="space-y-2">
              {applicants.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedApp(a.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedApp === a.id
                      ? 'bg-brand-indigo-600/20 border-brand-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">{a.fullName}</span>
                    <span className="text-[10px] text-slate-400">{a.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.major}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Applicant Review */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white">{current.fullName}</h2>
              <p className="text-xs text-brand-indigo-400">{current.university}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              Chờ Xét Duyệt
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block">Số điện thoại:</span>
              <span className="font-mono font-bold">{current.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Email đăng ký:</span>
              <span className="font-mono font-bold">{current.email}</span>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Tài liệu văn bằng scan dấu đỏ:</span>
            <div className="space-y-2">
              {current.files.map((f, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="material-symbols-outlined text-brand-indigo-400">description</span>
                    <span>{f}</span>
                  </div>
                  <button type="button" className="text-xs font-bold text-brand-indigo-400 hover:underline">
                    Xem Tài Liệu
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={handleApprove}
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              Phê Duyệt & Cấp Verified Badge
            </button>
            <button
              type="button"
              onClick={() => message.info('Đã gửi yêu cầu bổ sung minh chứng')}
              className="py-3 px-6 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-colors"
            >
              Yêu Cầu Bổ Sung
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
