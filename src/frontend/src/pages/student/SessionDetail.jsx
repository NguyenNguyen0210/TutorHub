import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentChoice, setStudentChoice] = useState('Attended');
  const [tutorChoice, setTutorChoice] = useState('Absent'); // Conflict scenario
  const [learningNotes, setLearningNotes] = useState('Học viên nắm tốt phương pháp tọa độ hóa khối chóp, đã giải bài tập mẫu 1-5.');
  const [hasConflict, setHasConflict] = useState(true);

  const handleConfirmAttendance = () => {
    message.success('Đã gửi xác nhận điểm danh thành công!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Back Navigation */}
      <Link to="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bàn Học
      </Link>

      {/* 24-Hour Dual Verification Window Header */}
      <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-brand-indigo-600 uppercase font-monospace-num">Buổi Học #{id || 's3'}</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Toán THPT: Hình Học Không Gian Oxyz</h1>
            <p className="text-xs text-text-muted">Gia sư: ThS. Nguyễn Văn An • Thời gian: 10/09/2026 (18:00 - 19:00)</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-text-muted block">Học phí buổi học:</span>
            <span className="text-xl font-extrabold text-financial-available font-monospace-num">200.000 ₫</span>
          </div>
        </div>

        {/* 24-Hour Countdown Alert */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-xl">timer</span>
            <span>Cửa sổ đối soát điểm danh 24h — Hạn còn lại: <strong>16 giờ 20 phút</strong></span>
          </div>
          <span className="font-bold text-amber-700 font-monospace-num text-xs">Tự động sau 16:20</span>
        </div>
      </div>

      {/* Dual Verification 2-Column Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-indigo-600">how_to_reg</span>
          Trạng Thái Điểm Danh 2 Chiều (Dual Attendance)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Học viên Column */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">1. Phía Học Viên (Bạn)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">ĐÃ XÁC NHẬN</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-financial-available text-lg">check_circle</span>
              Đã tham gia học (Attended)
            </div>
            <p className="text-[10px] text-text-muted">Ghi nhận lúc: 10/09/2026 19:10:15</p>
          </div>

          {/* Gia sư Column */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">2. Phía Gia Sư (Thầy An)</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">ĐÃ XÁC NHẬN</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-lg">cancel</span>
              Học viên vắng mặt (Absent)
            </div>
            <p className="text-[10px] text-text-muted">Ghi nhận lúc: 10/09/2026 19:15:30</p>
          </div>
        </div>

        {/* Conflict Warning Banner */}
        {hasConflict && (
          <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700">
              <span className="material-symbols-outlined text-rose-600 text-xl">warning</span>
              PHÁT HIỆN BẤT ĐỒNG ĐIỂM DANH (ATTENDANCE CONFLICT DETECTED)
            </div>
            <p className="text-xs leading-relaxed text-rose-800">
              Học viên xác nhận <strong>Có học</strong> nhưng Gia sư báo <strong>Vắng mặt</strong>. Hệ thống TutorHub lập tức <strong>phong tỏa 200.000 ₫</strong> tiền học buổi này trong Escrow. Không có bên nào bị trừ tiền hoặc giải ngân cho đến khi Bàn Trọng Tài giải quyết.
            </p>
            <div className="pt-1">
              <Link
                to={`/student/disputes/new?sessionId=${id || 's3'}`}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">gavel</span>
                Mở Đơn Khiếu Nại Tranh Chấp Lên Admin
              </Link>
            </div>
          </div>
        )}

        {/* Learning Notes Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">Nhật Ký Buổi Học (Learning Record)</label>
          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
            {learningNotes}
          </p>
        </div>
      </div>
    </div>
  );
}
